"""Windows Schannel transport. Secret configuration travels only through stdin.

No redirects, default curl configuration, credential files, or internal retries.
The caller verifies the draft, the source digest, and the server's saved digest.
"""
import ctypes
from ctypes import wintypes
import json
import os
from pathlib import Path
import queue
import re
import subprocess
import threading
import time
from urllib.parse import urlsplit

MARKER = b'\nAEROSENSE_TRANSFER:'
MAX_RESPONSE = 2_000_000


class NativeTransportError(Exception):
    def __init__(self, kind, code=None):
        self.kind, self.code = kind, code
        super().__init__('Native transport failed (%s; code=%s).' % (kind, code))


def curl_path():
    path = Path(os.environ.get('SystemRoot', r'C:\Windows')) / 'System32' / 'curl.exe'
    if os.name != 'nt' or not path.is_file():
        raise NativeTransportError('windows_curl_unavailable')
    return str(path)


def quoted(value):
    if any(c in value for c in '\r\n\0'):
        raise NativeTransportError('invalid_configuration_value')
    return '"' + value.replace('\\', '\\\\').replace('"', '\\"') + '"'


def configuration(url, path, token, user_agent):
    parsed = urlsplit(url)
    if (parsed.scheme != 'https' or parsed.hostname != 'zenodo.org'
            or parsed.port not in (None, 443) or parsed.username or parsed.password
            or parsed.query or parsed.fragment or not parsed.path.startswith('/api/files/')):
        raise NativeTransportError('untrusted_destination')
    if not token or any(c.isspace() for c in token):
        raise NativeTransportError('invalid_credential')
    return '\n'.join([
        'url = ' + quoted(url),
        'upload-file = ' + quoted(Path(path).resolve(strict=True).as_posix()),
        'header = ' + quoted('Authorization: Bearer ' + token),
        'header = "Accept: application/json"',
        'header = "Content-Type: application/octet-stream"',
        'user-agent = ' + quoted(user_agent),
        'proto = "=https"', 'proto-redir = "=https"',
        'http1.1', 'tlsv1.2', 'globoff', 'progress-bar',
        'connect-timeout = 30', 'expect100-timeout = 5',
        'keepalive-time = 30', 'keepalive-cnt = 3',
        'speed-limit = 1024', 'speed-time = 120', 'retry = 0',
        'write-out = "\\nAEROSENSE_TRANSFER:%{http_code}|%{size_upload}|%{time_total}|%{remote_ip}\\n"',
        ''
    ]).encode('utf-8')


class ChildLifetime:
    """A stopped uploader must also stop its credential-bearing curl child."""
    def __init__(self, process):
        class Basic(ctypes.Structure):
            _fields_ = [('ProcessTime', ctypes.c_longlong), ('JobTime', ctypes.c_longlong),
                        ('LimitFlags', wintypes.DWORD), ('MinWorkingSet', ctypes.c_size_t),
                        ('MaxWorkingSet', ctypes.c_size_t), ('ActiveProcessLimit', wintypes.DWORD),
                        ('Affinity', ctypes.c_size_t), ('PriorityClass', wintypes.DWORD),
                        ('SchedulingClass', wintypes.DWORD)]
        class IO(ctypes.Structure):
            _fields_ = [(name, ctypes.c_ulonglong) for name in
                        ('ReadOperations','WriteOperations','OtherOperations','ReadBytes','WriteBytes','OtherBytes')]
        class Extended(ctypes.Structure):
            _fields_ = [('Basic', Basic), ('IO', IO), ('ProcessMemory', ctypes.c_size_t),
                        ('JobMemory', ctypes.c_size_t), ('PeakProcessMemory', ctypes.c_size_t),
                        ('PeakJobMemory', ctypes.c_size_t)]
        self.kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        self.kernel.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
        self.kernel.CreateJobObjectW.restype = wintypes.HANDLE
        self.kernel.SetInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
        self.kernel.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
        self.kernel.CloseHandle.argtypes = [wintypes.HANDLE]
        self.handle = self.kernel.CreateJobObjectW(None, None)
        if not self.handle:
            raise NativeTransportError('child_lifetime_guard', ctypes.get_last_error())
        info = Extended()
        info.Basic.LimitFlags = 0x2000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
        if (not self.kernel.SetInformationJobObject(self.handle, 9, ctypes.byref(info), ctypes.sizeof(info))
                or not self.kernel.AssignProcessToJobObject(self.handle, wintypes.HANDLE(int(process._handle)))):
            code = ctypes.get_last_error()
            self.close()
            raise NativeTransportError('child_lifetime_guard', code)

    def close(self):
        if self.handle:
            self.kernel.CloseHandle(self.handle)
            self.handle = None


def _run(configuration_bytes, on_progress):
    """Drain both pipes, retaining only the bounded response and numeric progress."""
    process = subprocess.Popen([curl_path(), '-q', '--config', '-'],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0), close_fds=True)
    guard = None
    messages = queue.Queue(maxsize=128)
    output = bytearray()
    oversized = threading.Event()
    stopped = threading.Event()
    threads = []

    def receive_response():
        try:
            while not stopped.is_set():
                block = os.read(process.stdout.fileno(), 16384)
                if not block:
                    break
                if len(output) + len(block) > MAX_RESPONSE:
                    oversized.set()
                    break
                output.extend(block)
        except OSError:
            pass

    def receive_progress():
        pending = b''
        try:
            while not stopped.is_set():
                block = os.read(process.stderr.fileno(), 4096)
                if not block:
                    break
                lines = re.split(br'[\r\n]', pending + block)
                pending = lines.pop()[-4096:]
                for line in lines:
                    match = re.search(br'(?:^|\s)(\d{1,3}\.\d)%\s*$', line)
                    if match:
                        try: messages.put_nowait(min(100.0, float(match.group(1))))
                        except queue.Full: pass
                # All non-progress stderr, including possible reflected values,
                # is discarded. Only curl's numeric exit code is reported.
        except OSError:
            pass

    try:
        guard = ChildLifetime(process)  # Before handing over any credential.
        for target in (receive_response, receive_progress):
            thread = threading.Thread(target=target, daemon=True)
            thread.start()
            threads.append(thread)
        process.stdin.write(configuration_bytes)
        process.stdin.close()
        configuration_bytes = None
        maximum = 0.0
        while process.poll() is None:
            if oversized.is_set():
                raise NativeTransportError('response_too_large')
            try:
                percent = messages.get(timeout=0.5)
                if percent >= maximum:
                    maximum = percent
                    on_progress(percent)
            except queue.Empty:
                pass
        for thread in threads:
            thread.join(timeout=3)
        if oversized.is_set():
            raise NativeTransportError('response_too_large')
        body, separator, footer = bytes(output).rpartition(MARKER)
        if not separator:
            raise NativeTransportError('missing_transfer_result', process.returncode)
        try:
            status, sent, elapsed, address = footer.strip().decode('ascii').split('|')
            result = {'http_status': int(status), 'sent_bytes': int(float(sent)),
                      'seconds': float(elapsed), 'exit_code': process.returncode}
            if not (0 <= result['http_status'] <= 599 and result['sent_bytes'] >= 0):
                raise ValueError()
        except (ValueError, UnicodeError):
            raise NativeTransportError('invalid_transfer_result', process.returncode)
        # Only an explicitly selected JSON response is exposed to the caller.
        try: result['response'] = json.loads(body.decode('utf-8'))
        except (ValueError, UnicodeError): result['response'] = None
        return result
    finally:
        configuration_bytes = None
        stopped.set()
        if process.poll() is None:
            process.kill()
        process.wait(timeout=10)
        for thread in threads:
            thread.join(timeout=3)
        for stream in (process.stdin, process.stdout, process.stderr):
            if stream and not stream.closed:
                stream.close()
        if guard:
            guard.close()


def upload(url, path, token, user_agent, on_progress):
    return _run(configuration(url, path, token, user_agent), on_progress)
