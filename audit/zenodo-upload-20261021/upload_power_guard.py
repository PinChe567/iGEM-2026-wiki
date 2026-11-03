"""Keep Windows awake only while an upload is running; no persistent settings."""
import argparse
import ctypes
from ctypes import wintypes
import json
import os
from pathlib import Path
import time

ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
ES_DISPLAY_REQUIRED = 0x00000002


class AwakeLease:
    """Acquire and release on the same thread, including exceptional exits."""

    def __init__(self, setter=None):
        self.setter = setter
        self.previous = None
        self.active = False

    def __enter__(self):
        if self.setter is None:
            if os.name != 'nt':
                return self
            self.setter = ctypes.WinDLL('kernel32', use_last_error=True).SetThreadExecutionState
            self.setter.argtypes = [wintypes.DWORD]
            self.setter.restype = wintypes.DWORD
        previous = self.setter(ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED)
        if not previous:
            raise OSError('Windows rejected the upload keep-awake request.')
        self.previous = previous
        self.active = True
        return self

    def __exit__(self, *_):
        if self.active:
            self.setter(self.previous | ES_CONTINUOUS)
            self.active = False


def watch_existing_upload(pid):
    """Protect the already-running worker without interrupting its connection."""
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.WaitForSingleObject.argtypes = [wintypes.HANDLE, wintypes.DWORD]
    kernel.WaitForSingleObject.restype = wintypes.DWORD
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD,
                                                 wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]
    handle = kernel.OpenProcess(0x00100000 | 0x1000, False, pid)
    if not handle:
        raise OSError('The uploader process is no longer available.')
    state_path = Path(__file__).with_name('power-guard-status.json')
    state = {'uploader_pid': pid, 'guard_pid': os.getpid(),
             'persistent_power_settings_changed': False,
             'started_at_unix': time.time()}

    def save(status, active=False):
        state.update(status=status, active=active, updated_at_unix=time.time())
        temporary = state_path.with_suffix('.tmp')
        temporary.write_text(json.dumps(state, indent=2), encoding='utf-8')
        temporary.replace(state_path)

    try:
        path = ctypes.create_unicode_buffer(32768)
        size = wintypes.DWORD(len(path))
        if not kernel.QueryFullProcessImageNameW(handle, 0, path, ctypes.byref(size)):
            raise OSError('Cannot verify uploader process executable.')
        if Path(path.value).name.lower() not in ('python.exe', 'pythonw.exe'):
            raise ValueError('The monitored process must be the Python uploader.')
        if kernel.WaitForSingleObject(handle, 0) != 258:
            raise OSError('The uploader process has already exited.')
        with AwakeLease() as lease:
            save('protecting_current_upload', lease.active)
            while True:
                result = kernel.WaitForSingleObject(handle, 10000)
                if result == 0:
                    break
                if result != 258:
                    raise OSError('Cannot monitor uploader lifetime.')
                save('protecting_current_upload', lease.active)
        save('released_uploader_exited')
    except Exception as error:
        state['error_class'] = type(error).__name__
        save('failed')
        raise
    finally:
        kernel.CloseHandle(handle)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pid', required=True, type=int)
    watch_existing_upload(parser.parse_args().pid)
