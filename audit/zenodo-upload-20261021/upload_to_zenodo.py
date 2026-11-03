"""Upload to the existing Zenodo draft; never publish or delete completed files.

Official API: https://developers.zenodo.org/#quickstart-upload
The token is accepted only as the first line of stdin and is never persisted.
"""
import argparse
import csv
import hashlib
import http.client
import json
import os
from pathlib import Path
import socket
import ssl
import sys
import time
import traceback
import threading
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from functools import wraps
from collections import deque
from urllib.parse import quote, urlsplit
from uuid import UUID
from upload_power_guard import AwakeLease
import upload_native_curl

RECORD_ID = 23469212
DOI = "10.5281/zenodo.23469212"
BASE = "https://zenodo.org"
DEPOSITION = BASE + "/api/deposit/depositions/" + str(RECORD_ID)
MODERN_DRAFT = BASE + "/api/records/" + str(RECORD_ID) + "/draft"
USER_AGENT = "AeroSenseNTHUArchiveUploader/1.0 (+https://2026.igem.wiki/nthu/)"
CHUNK = 1024 * 1024
ATTACHMENTS = ("UPLOAD_README.txt", "PACKAGE_INDEX.csv", "ARCHIVE_CHECKSUMS.sha256")
CHUNK_MAP = 'GH146_FILE_MAP.csv'
AUDIT = Path(__file__).resolve().parent
DEFAULT_ROOT = Path(__file__).resolve().parents[3] / "zenodo-upload"


class UploadError(Exception):
    pass


class TransientUploadError(UploadError):
    """Transfer failed, and an authenticated read confirmed the file is not saved."""
    pass


def serialized(method):
    """Keep progress, receipts and their temporary files consistent across uploads."""
    @wraps(method)
    def call(self, *args, **kwargs):
        with self._state_lock:
            return method(self, *args, **kwargs)
    return call


class LocalPersistenceError(UploadError):
    def __init__(self, path, operation, error):
        self.permission_conflict = isinstance(error, PermissionError)
        self.details = {'file': Path(path).name, 'operation': operation,
                        'error_class': type(error).__name__,
                        'errno': getattr(error, 'errno', None),
                        'winerror': getattr(error, 'winerror', None)}
        super().__init__('Cannot %s local %s (%s; errno=%s; winerror=%s).' % (
            operation, Path(path).name, type(error).__name__,
            self.details['errno'], self.details['winerror']))


def local_io_retry(operation, path, description):
    """Windows readers/antivirus may briefly deny replacement of a JSON file."""
    for attempt in range(8):
        try:
            return operation()
        except PermissionError as error:
            if attempt == 7:
                raise LocalPersistenceError(path, description, error) from error
            time.sleep(min(0.8, 0.05 * 2 ** attempt))
        except OSError as error:
            raise LocalPersistenceError(path, description, error) from error


def safe_error_details(error):
    """Diagnostics contain locations/codes only, never messages, source or locals."""
    return {'error_class': type(error).__name__,
            'errno': getattr(error, 'errno', None),
            'winerror': getattr(error, 'winerror', None),
            'local_io': error.details if isinstance(error, LocalPersistenceError) else None,
            'frames': [{'file': Path(frame.filename).name, 'function': frame.name,
                        'line': frame.lineno}
                       for frame in traceback.extract_tb(error.__traceback__)]}


def acquire_upload_lock(audit=AUDIT):
    """Keep multiple open helper windows from starting concurrent uploads."""
    import msvcrt
    handle = (Path(audit)/'upload.lock').open('a+b')
    try:
        if handle.seek(0, 2) == 0:
            handle.write(b'0')
            handle.flush()
        handle.seek(0)
        msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        return handle
    except OSError:
        handle.close()
        raise UploadError('Another upload process is already running. Keep its window open; do not start a second upload.')


def guarded_url(url):
    parsed = urlsplit(url)
    if (parsed.scheme != "https" or parsed.hostname != "zenodo.org"
            or parsed.port not in (None, 443) or parsed.username or parsed.password
            or parsed.fragment or parsed.query or not parsed.path.startswith("/api/")):
        raise UploadError("Refusing a URL outside the official Zenodo HTTPS API.")
    return parsed.path


def collect_files(root):
    root = Path(root).resolve(strict=True)
    with (root / "PACKAGE_INDEX.csv").open(encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))
    if not 1 <= len(rows) <= 96:
        raise UploadError('The package index must contain 1 to 96 ZIP files.')
    result = []
    for row in rows:
        rel = row["local_zip_path"]
        candidate = root / rel
        path = candidate.resolve(strict=True)
        if not path.is_relative_to(root) or not path.is_file() or path.suffix.lower() != ".zip":
            raise UploadError("Invalid archive path in PACKAGE_INDEX.csv.")
        stat = path.stat()
        if path.name != row["zip_filename"] or stat.st_size != int(row["zip_bytes"]):
            raise UploadError("An archive filename or size no longer matches PACKAGE_INDEX.csv.")
        sha = row["sha256"].lower()
        if len(sha) != 64 or any(c not in "0123456789abcdef" for c in sha):
            raise UploadError("Invalid SHA-256 in PACKAGE_INDEX.csv.")
        result.append({"name": path.name, "path": str(path), "bytes": stat.st_size,
                       "mtime_ns": stat.st_mtime_ns, "sha256": sha})
    attachments=(*ATTACHMENTS,CHUNK_MAP) if (root/CHUNK_MAP).is_file() else ATTACHMENTS
    for name in attachments:
        path = (root / name).resolve(strict=True)
        if not path.is_relative_to(root) or not path.is_file():
            raise UploadError("Invalid upload attachment path.")
        stat = path.stat()
        result.append({"name": name, "path": str(path), "bytes": stat.st_size,
                       "mtime_ns": stat.st_mtime_ns,
                       "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    if len({item["name"] for item in result}) != len(result) or len(result)>100:
        raise UploadError("Upload filenames must be unique.")
    if sum(item["bytes"] for item in result) > 50_000_000_000:
        raise UploadError("The prepared upload exceeds the default 50 GB quota.")
    return result


def remote_files(deposition):
    result = {}
    for item in deposition.get("files", []):
        name = item.get("filename") or item.get("name") or item.get("key")
        size = item.get("filesize", item.get("size", 0))
        checksum = item.get("checksum", "") or ""
        result[name] = {"bytes": int(size or 0), "md5": checksum.removeprefix("md5:").lower()}
        if 'status' in item:
            result[name]['status'] = item['status']
    return result


def remote_complete(item):
    return bool(item and item.get('status') in (None, 'completed')
                and item.get('bytes', 0) > 0 and len(item.get('md5', '')) == 32)


def approved_plan(audit=AUDIT):
    path = Path(audit) / 'approved-replacements.json'
    if not path.exists():
        return None
    plan = json.loads(path.read_text(encoding='utf-8'))
    if (plan.get('record_id') != RECORD_ID or plan.get('doi') != DOI
            or plan.get('mode') not in ('record19-update', 'hardware-simulation-update', 'gh146-lossless-repack','gh146-chunked','gh146-chunked-avi-cleanup')):
        raise UploadError('The local update plan does not match the requested record.')
    expected = {'AeroSense-00-guides-and-provenance.zip',
                'AeroSense-03-hardware-design-and-calibration.zip',
                'AeroSense-06-software-and-publication-history.zip', *ATTACHMENTS}
    if plan['mode'] == 'hardware-simulation-update':
        expected.remove('AeroSense-06-software-and-publication-history.zip')
    elif plan['mode'] == 'gh146-lossless-repack':
        expected = {'AeroSense-02c-lightsheet-GH146-run03-raw.zip',
                    'AeroSense-02d-lightsheet-GH146-run04-raw.zip', *ATTACHMENTS}
    elif plan['mode'] in ('gh146-chunked','gh146-chunked-avi-cleanup'):
        counts=plan.get('chunk_counts',{})
        if (set(counts)!={'02c','02d'} or any(type(v)!=int or not 1<=v<=85 for v in counts.values())
                or sum(counts.values())+15>100):
            raise UploadError('The GH146 split counts exceed the approved record limits.')
        expected={*ATTACHMENTS,CHUNK_MAP}
        for key,run in [('02c','03'),('02d','04')]:
            expected.update(f'AeroSense-{key}-lightsheet-GH146-run{run}-raw-part{i:02}-of{counts[key]:02}.zip'
                            for i in range(1,counts[key]+1))
        if plan['mode']=='gh146-chunked-avi-cleanup':
            expected.update({'AeroSense-00-guides-and-provenance.zip',
                             'AeroSense-02a-lightsheet-analysis-and-media.zip'})
        if set(plan.get('retired_pending_files',[])) != {
                'AeroSense-02c-lightsheet-GH146-run03-raw.zip',
                'AeroSense-02d-lightsheet-GH146-run04-raw.zip'}:
            raise UploadError('Unexpected retired GH146 placeholder names.')
    if set(plan.get('file_names', [])) != expected or set(plan.get('files', {})) != expected:
        raise UploadError('The update plan contains unexpected filenames.')
    return plan


def selected_files(files, audit=AUDIT, scope='record19-update'):
    plan = approved_plan(audit)
    if not plan:
        return files
    result = [item for item in files if item['name'] in plan['file_names']]
    for item in result:
        target = plan['files'][item['name']]['replacement']
        if item['sha256'] != target['sha256'] or item['bytes'] != target['bytes']:
            raise UploadError('Prepared update files no longer match their authorized plan.')
    if len(result) != len(plan['file_names']):
        raise UploadError('An update file is missing from the local upload selection.')
    return files if scope == 'full-record' else result


def check_draft(deposition):
    if str(deposition.get("id")) != str(RECORD_ID):
        raise UploadError("Zenodo returned a different draft ID; nothing was uploaded.")
    reserved = deposition.get("metadata", {}).get("prereserve_doi", {}).get("doi")
    doi = deposition.get("doi") or reserved
    if doi != DOI:
        raise UploadError("The reserved DOI does not match the requested DOI.")
    if deposition.get("submitted") is not False or deposition.get("state") == "done":
        raise UploadError("This record is published or its draft state is uncertain; refusing writes.")
    bucket = deposition.get("links", {}).get("bucket", "")
    path = guarded_url(bucket)
    if not path.startswith("/api/files/") or path.rstrip("/") == "/api/files":
        raise UploadError("The draft did not return an official file bucket.")
    return bucket.rstrip("/")


def normalize_modern_draft(draft, inventory):
    """Validate the native RDM response without its legacy metadata serializer.

    Bucket identifiers come exclusively from this draft's authenticated file
    inventory. No record or bucket is guessed from a DOI or filename.
    """
    if (str(draft.get('id')) != str(RECORD_ID)
            or draft.get('is_published') is not False
            or draft.get('is_draft') is not True
            or draft.get('pids', {}).get('doi', {}).get('identifier') != DOI):
        raise UploadError('Native API draft identity, DOI or unpublished state does not match; refusing writes.')
    expected_files_url = MODERN_DRAFT + '/files'
    if draft.get('links', {}).get('files') != expected_files_url:
        raise UploadError('Native API returned an unexpected draft file inventory URL.')
    if inventory.get('links', {}).get('self') != expected_files_url:
        raise UploadError('Native file inventory does not belong to the requested draft.')
    entries = inventory.get('entries')
    if not isinstance(entries, list):
        raise UploadError('Native file inventory has an unsupported format.')
    buckets = set()
    converted = []
    names = set()
    for entry in entries:
        name = entry.get('key')
        if not isinstance(name, str) or not name or name in names:
            raise UploadError('Native file inventory has missing or duplicate names.')
        names.add(name)
        bucket_id = entry.get('bucket_id')
        if bucket_id:
            try:
                buckets.add(str(UUID(bucket_id)))
            except (ValueError, TypeError, AttributeError):
                raise UploadError('Native file inventory returned an invalid bucket identifier.')
        converted.append({'filename':name, 'filesize':entry.get('size') or 0,
                          'checksum':entry.get('checksum') or '',
                          'status':entry.get('status')})
    if len(buckets) != 1:
        raise UploadError('Cannot identify one authenticated draft file bucket; no files were changed.')
    result = {'id': RECORD_ID, 'submitted': False, 'state': 'unsubmitted',
              'metadata': {'prereserve_doi': {'doi': DOI}},
              'links': {'bucket': BASE + '/api/files/' + next(iter(buckets))},
              'files': converted}
    check_draft(result)
    return result


def stream_file(path, send, on_progress=None):
    md5 = hashlib.md5()
    sha = hashlib.sha256()
    count = 0
    with Path(path).open("rb") as fh:
        while True:
            block = fh.read(CHUNK)
            if not block:
                break
            send(block)
            md5.update(block)
            sha.update(block)
            count += len(block)
            if on_progress:
                on_progress(count)
    return count, md5.hexdigest(), sha.hexdigest()


class Uploader:
    def __init__(self, token, files, audit=AUDIT, scope=None, expected_files=None, transport='python', workers=1):
        if workers not in (1, 2, 4):
            raise UploadError('Use one, two or four simultaneous file transfers.')
        self.workers = workers
        self._state_lock = threading.RLock()
        self._worker_context = threading.local()
        self._active = {}
        self._parallel_active = False
        self.token = token
        self.transport = transport
        self.files = files
        self.audit = Path(audit)
        self.audit.mkdir(parents=True, exist_ok=True)
        self.plan = approved_plan(self.audit)
        self.scope = scope or ('record19-update' if self.plan else 'full-record')
        self.expected_files = expected_files or files
        self.progress_path = self.audit / "upload-progress.json"
        self.receipt_path = self.audit / "upload-receipts.json"
        self.receipts = {}
        self.native_api = None
        self.progress_write_warning = False
        if self.receipt_path.exists():
            old = json.loads(self.receipt_path.read_text(encoding="utf-8"))
            if old.get("record_id") == RECORD_ID:
                self.receipts = old.get("files", {})
        self.state = {"record_id": RECORD_ID, "doi": DOI, "status": "starting",
                      "total_bytes": sum(x["bytes"] for x in files), "file_count": len(files),
                      "completed": [], "current": None, 'scope': self.scope,
                      'expected_file_count': len(self.expected_files), 'full_collection_verified': False}

    @serialized
    def save_inventory(self, entries, stage):
        expected = {item['name'] for item in self.expected_files}
        pending = sorted(name for name in expected if not remote_complete(entries.get(name)))
        extra = sorted(set(entries) - expected)
        self.state['expected_pending_files'] = pending
        self.state['extra_remote_files'] = extra
        self.state['remote_file_count'] = len(entries)
        self.save_json(self.audit/'remote-inventory.json', {
            'record_id': RECORD_ID, 'doi': DOI, 'stage': stage,
            'checked_at_unix': time.time(), 'expected_file_count':len(expected),
            'expected_pending_files':pending, 'extra_remote_files':extra, 'files':entries})

    @serialized
    def save_json(self, path, payload):
        temporary = path.with_suffix(path.suffix + ".tmp")
        text = json.dumps(payload, indent=2, ensure_ascii=False)
        local_io_retry(lambda: temporary.write_text(text, encoding='utf-8'), temporary, 'write')
        local_io_retry(lambda: os.replace(temporary, path), path, 'replace')

    @serialized
    def progress(self, status=None, current=None):
        name = getattr(self._worker_context, 'name', None)
        if self._parallel_active:
            if name:
                previous = self._active.get(name, {'name': name})
                if current is not None:
                    if current.get('name', name) != name:
                        raise UploadError('Progress refers to another file transfer.')
                    previous = {**previous, **current}
                if status:
                    previous['status'] = status
                self._active[name] = previous
            active = [dict(value) for value in self._active.values()]
            self.state['active_transfers'] = active
            self.state['simultaneous_transfers'] = len(active)
            self.state['max_simultaneous_transfers'] = self.workers
            self.state['combined_bytes_per_second'] = sum(v.get('bytes_per_second', 0) for v in active)
            self.state['status'] = 'uploading' if active else 'checking_remote'
            self.state['current'] = active[0] if active else {}
        else:
            if status:
                self.state['status'] = status
            if current is not None:
                self.state['current'] = current
        completed = set(self.state['completed'])
        remaining = [item for item in self.files if item['name'] not in completed]
        self.state['remaining_file_count'] = len(remaining)
        self.state['remaining_bytes'] = sum(item['bytes'] for item in remaining)
        in_flight = self.state.get('active_transfers', []) if self._parallel_active else [self.state.get('current') or {}]
        self.state['remaining_wire_bytes_estimate'] = self.state['remaining_bytes'] - sum(
            min(item.get('sent_bytes', 0), item.get('bytes', 0))
            for item in in_flight if item.get('name') not in completed)
        self.state["updated_at_unix"] = time.time()
        try:
            self.save_json(self.progress_path, self.state)
            if self.progress_write_warning:
                print(json.dumps({'at_unix':time.time(), 'event':'local_progress_recovered'}), flush=True)
            self.progress_write_warning = False
        except LocalPersistenceError as error:
            if not error.permission_conflict:
                raise
            # A UI refresh is not part of the data transfer or saved-file proof.
            # Never discard an active HTTP upload solely to refresh its display.
            if not self.progress_write_warning:
                print(json.dumps({'at_unix':time.time(), 'event':'local_progress_delayed',
                                  **error.details}), flush=True)
            self.progress_write_warning = True

    @serialized
    def event(self, event, **values):
        entry = {"at_unix": time.time(), "event": event, **values}
        text = json.dumps(entry, ensure_ascii=False)
        path = self.audit / 'upload-events.jsonl'
        def append():
            with path.open('a', encoding='utf-8') as fh:
                fh.write(text + '\n')
        try:
            local_io_retry(append, path, 'append')
        except LocalPersistenceError as error:
            if not error.permission_conflict:
                raise
            print(json.dumps({'at_unix':time.time(), 'event':'local_event_log_delayed',
                              **error.details}), flush=True)
        print(text, flush=True)

    def connection(self):
        return http.client.HTTPSConnection("zenodo.org", timeout=300,
                                           context=ssl.create_default_context())

    def headers(self):
        return {"Authorization": "Bearer " + self.token, "User-Agent": USER_AGENT,
                "Accept": "application/json"}

    def delay(self, attempt, response=None):
        delay = min(60, 5 * (2 ** attempt))
        if response:
            try:
                delay = max(delay, int(response.getheader("Retry-After", "0")))
            except ValueError:
                pass
        self.progress("retry_wait")
        self.event("retry_wait", seconds=delay, http_status=getattr(response, 'status', None))
        time.sleep(delay)

    def response_status(self, response, stage):
        self.state['last_http_status'] = response.status
        self.state['last_request_stage'] = stage
        self.progress()
        self.event('http_response', stage=stage, http_status=response.status)

    def response_json(self, response):
        body = response.read(2_000_000)
        try:
            return json.loads(body.decode("utf-8"))
        except (ValueError, UnicodeError):
            raise UploadError("Zenodo returned a non-JSON API response (HTTP %s)." % response.status)

    def get_native_json(self, url, stage, optional=False):
        """Read only, with the repository's native RDM media type."""
        for attempt in range(3):
            conn = self.connection()
            try:
                headers = self.headers()
                headers['Accept'] = 'application/vnd.inveniordm.v1+json'
                conn.request('GET', guarded_url(url), headers=headers)
                response = conn.getresponse()
                self.response_status(response, stage)
                if optional and response.status in (404, 406):
                    response.read(2_000_000)
                    return None
                if response.status in (401, 403):
                    raise UploadError('Zenodo rejected authentication or draft access; no files were changed.')
                if response.status == 429 or response.status >= 500:
                    if attempt == 2:
                        raise UploadError('Native Zenodo API returned HTTP %s after three attempts.' % response.status)
                    self.delay(attempt, response)
                    continue
                if response.status != 200:
                    raise UploadError('Cannot read native draft data (HTTP %s).' % response.status)
                return self.response_json(response)
            except (OSError, http.client.HTTPException) as error:
                if attempt == 2:
                    raise UploadError('Native API connection failed (%s).' % type(error).__name__)
                self.delay(attempt)
            finally:
                conn.close()

    def get_draft(self):
        # This bypasses known legacy metadata-serialization failures while
        # preserving the same DOI, draft, upload interface and checksum checks.
        if self.native_api is not False:
            draft = self.get_native_json(MODERN_DRAFT, 'read_native_draft', optional=self.native_api is None)
            if draft is not None:
                if (str(draft.get('id')) != str(RECORD_ID)
                        or draft.get('is_published') is not False
                        or draft.get('is_draft') is not True
                        or draft.get('pids', {}).get('doi', {}).get('identifier') != DOI
                        or draft.get('links', {}).get('files') != MODERN_DRAFT + '/files'):
                    raise UploadError('Native draft identity, DOI or state does not match; no files were changed.')
                inventory = self.get_native_json(draft['links']['files'], 'read_native_file_inventory')
                result = normalize_modern_draft(draft, inventory)
                self.native_api = True
                self.event('native_draft_verified', record_id=RECORD_ID, doi=DOI,
                           remote_file_count=len(result['files']))
                return result
            self.native_api = False
            self.event('native_draft_unavailable', record_id=RECORD_ID)
        return self.get_legacy_draft()

    def get_legacy_draft(self):
        for attempt in range(4):
            conn = self.connection()
            try:
                conn.request("GET", guarded_url(DEPOSITION), headers=self.headers())
                response = conn.getresponse()
                self.response_status(response, 'read_existing_draft')
                if response.status in (401, 403):
                    raise UploadError("Zenodo rejected authentication; use a token with deposit:write permission.")
                if response.status == 429 or response.status >= 500:
                    if attempt == 3:
                        raise UploadError("Zenodo returned HTTP %s after four attempts; no file was uploaded in this connection step." % response.status)
                    self.delay(attempt, response)
                    continue
                if response.status != 200:
                    raise UploadError("Cannot read the existing draft (HTTP %s)." % response.status)
                return self.response_json(response)
            except (OSError, http.client.HTTPException) as error:
                if attempt == 3:
                    raise UploadError("Connection to Zenodo failed after four attempts (%s)." % type(error).__name__)
                self.delay(attempt)
            finally:
                conn.close()

    def unchanged(self, item):
        stat = Path(item["path"]).stat()
        if stat.st_size != item["bytes"] or stat.st_mtime_ns != item["mtime_ns"]:
            raise UploadError("A local upload file changed after the upload plan was read.")

    def local_md5(self, item):
        self.unchanged(item)
        cached = self.receipts.get(item["name"], {})
        if (cached.get("verified") and cached.get("bytes") == item["bytes"]
                and cached.get("mtime_ns") == item["mtime_ns"]
                and cached.get("sha256") == item["sha256"]):
            return cached["md5"]
        self.progress("checking_existing", {"name": item["name"], "bytes": item["bytes"]})
        size, md5, sha = stream_file(item["path"], lambda block: None)
        self.unchanged(item)
        if size != item["bytes"] or sha != item["sha256"]:
            raise UploadError("An existing-upload source no longer matches its SHA-256 manifest.")
        return md5

    @serialized
    def record_receipt(self, item, md5, action):
        self.receipts[item["name"]] = {"bytes": item["bytes"], "mtime_ns": item["mtime_ns"],
            "sha256": item["sha256"], "md5": md5, "verified": True,
            "verified_at_unix": time.time(), "action": action}
        self.save_json(self.receipt_path, {"record_id": RECORD_ID, "doi": DOI, "files": self.receipts})
        if item['name'] not in self.state['completed']:
            self.state['completed'].append(item['name'])
        self.progress("uploading")
        self.event(action, filename=item["name"], bytes=item["bytes"], md5=md5)

    def authorized_replacement(self, item, remote):
        if not self.plan:
            return False
        entry = self.plan['files'].get(item['name'])
        return bool(entry and entry.get('previous') and remote['bytes'] == entry['previous']['bytes']
                    and remote['md5'] == entry['previous']['md5']
                    and item['sha256'] == entry['replacement']['sha256']
                    and item['bytes'] == entry['replacement']['bytes'])

    def reconcile_upload(self, bucket, item, expected_md5=None):
        """Recover a lost upload acknowledgement before sending the body again."""
        with self._state_lock:
            current = dict(self._active.get(item['name'], {}) if self._parallel_active
                           else (self.state.get('current') or {}))
        current.update(name=item['name'], bytes=item['bytes'])
        self.progress('checking_remote', current)
        try:
            draft = self.get_draft()
        except UploadError as error:
            raise UploadError('Cannot confirm whether Zenodo saved this file; stopped before retransmitting. ' + str(error)) from error
        if check_draft(draft) != bucket.rstrip('/'):
            raise UploadError('The authenticated draft file bucket changed; refusing to retransmit.')
        entries = remote_files(draft)
        self.save_inventory(entries, 'reconcile_upload')
        remote = entries.get(item['name'])
        self.unchanged(item)
        if remote_complete(remote):
            if remote['bytes'] == item['bytes']:
                md5 = expected_md5 or self.local_md5(item)
                if remote['md5'] == md5:
                    self.record_receipt(item, md5, 'recovered_verified')
                    return True
            if not self.authorized_replacement(item, remote):
                raise UploadError('A complete remote file differs from the local source and approved previous version; stopped before retransmitting.')
        elif not (not remote or remote.get('status') == 'pending'
                  or (remote['bytes'] == 0 and not remote['md5'])):
            raise UploadError('The remote file has an uncertain state; stopped before retransmitting.')
        self.progress('checking_remote', current)
        self.event('remote_not_saved', filename=item['name'],
                   remote_status=(remote or {}).get('status', 'absent' if not remote else 'previous_version'))
        return False

    def assert_upload_allowed(self, item):
        if (self.plan and self.plan.get('mode') in ('gh146-lossless-repack','gh146-chunked','gh146-chunked-avi-cleanup')
                and item['name'] not in self.plan['file_names']):
            raise UploadError('A previously completed ZIP is missing or changed remotely; '
                              'the requested two-archive update will not re-upload it: ' + item['name'])

    def upload_one(self, bucket, item):
        self.assert_upload_allowed(item)
        if self.transport == 'windows-curl':
            return self.upload_one_native(bucket, item)
        verified_md5 = None
        for attempt in range(4):
            # A slow server may finish committing during the retry delay.
            if attempt and self.reconcile_upload(bucket, item, verified_md5):
                return
            self.unchanged(item)
            conn = self.connection()
            start = time.monotonic()
            last_report = [0.0]
            current = {"name": item["name"], "bytes": item["bytes"], "sent_bytes": 0,
                       "attempt": attempt + 1, "bytes_per_second": 0}
            self.progress("uploading", current)
            self.event("upload_started", filename=item["name"], attempt=attempt + 1)
            phase = 'sending'
            try:
                conn.putrequest("PUT", guarded_url(bucket + "/" + quote(item["name"], safe="")))
                for key, value in self.headers().items():
                    conn.putheader(key, value)
                conn.putheader("Content-Type", "application/octet-stream")
                conn.putheader("Content-Length", str(item["bytes"]))
                conn.endheaders()

                def report(sent):
                    now = time.monotonic()
                    if now - last_report[0] >= 2 or sent == item["bytes"]:
                        current["sent_bytes"] = sent
                        current["bytes_per_second"] = round(sent / max(now - start, 0.001))
                        self.progress("uploading", current)
                        last_report[0] = now

                size, md5, sha = stream_file(item["path"], conn.send, report)
                self.unchanged(item)
                if size != item["bytes"] or sha != item["sha256"]:
                    raise UploadError("Source checksum mismatch; remote upload must not be published.")
                verified_md5 = md5
                phase = 'awaiting_confirmation'
                self.progress(phase, current)
                self.event('body_sent', filename=item['name'], attempt=attempt + 1, bytes=size,
                           saved_and_verified=False)
                response = conn.getresponse()
                self.response_status(response, 'upload_file')
                if response.status in (401, 403):
                    raise UploadError("Zenodo rejected the token or upload permission.")
                if response.status == 409:
                    raise UploadError("Zenodo reports a file conflict (409); no file was deleted. Inspect the interrupted file entry in the draft.")
                if response.status == 429 or response.status >= 500:
                    conn.close()
                    if response.status == 429:
                        self.delay(attempt, response)
                    if self.reconcile_upload(bucket, item, verified_md5):
                        return
                    if attempt == 3:
                        raise UploadError("Upload failed after four server-error attempts.")
                    if response.status != 429:
                        self.delay(attempt, response)
                    continue
                if response.status not in (200, 201):
                    raise UploadError("Zenodo rejected this file (HTTP %s); no draft was deleted." % response.status)
                data = self.response_json(response)
                remote_md5 = (data.get("checksum") or "").removeprefix("md5:").lower()
                if int(data.get("size", -1)) != size or remote_md5 != md5:
                    raise UploadError("Zenodo upload size/checksum verification failed; do not publish.")
                self.record_receipt(item, md5, "uploaded_verified")
                return
            except (OSError, http.client.HTTPException) as error:
                conn.close()
                self.event('upload_connection_error', filename=item['name'], attempt=attempt + 1,
                           phase=phase, sent_bytes=current['sent_bytes'], error_class=type(error).__name__)
                if self.reconcile_upload(bucket, item, verified_md5):
                    return
                if attempt == 3:
                    raise UploadError("Upload connection failed after four attempts (%s)." % type(error).__name__)
                self.delay(attempt)
            finally:
                conn.close()

    def upload_one_native(self, bucket, item):
        self.assert_upload_allowed(item)
        url = bucket + '/' + quote(item['name'], safe='')
        guarded_url(url)
        md5 = self.local_md5(item)  # Also checks the source SHA-256 before sending.
        for attempt in range(2):
            if attempt and self.reconcile_upload(bucket, item, md5):
                return
            self.unchanged(item)
            started = time.monotonic()
            last_report = [0.0]
            current = {'name': item['name'], 'bytes': item['bytes'], 'sent_bytes': 0,
                       'attempt': attempt + 1, 'bytes_per_second': 0,
                       'transport': 'windows-curl-schannel', 'progress_is_estimate': True}
            self.progress('uploading', current)
            self.event('upload_started', filename=item['name'], attempt=attempt + 1,
                       transport='windows-curl-schannel', attempt_limit=2)

            def report(percent):
                now = time.monotonic()
                if now - last_report[0] >= 2 or percent >= 100:
                    current['sent_bytes'] = int(item['bytes'] * percent / 100)
                    current['bytes_per_second'] = round(current['sent_bytes'] / max(now-started, 0.001))
                    self.progress('awaiting_confirmation' if percent >= 100 else 'uploading', current)
                    last_report[0] = now

            try:
                result = upload_native_curl.upload(url, item['path'], self.token, USER_AGENT, report)
            except (OSError, upload_native_curl.NativeTransportError) as error:
                self.event('native_transport_error', filename=item['name'],
                           error_class=type(error).__name__, kind=getattr(error, 'kind', None),
                           code=getattr(error, 'code', None))
                if self.reconcile_upload(bucket, item, md5):
                    return
                raise UploadError('The Windows transfer could not finish safely; completed files are preserved.') from error
            self.unchanged(item)
            current.update(sent_bytes=result['sent_bytes'], progress_is_estimate=False)
            self.state['last_http_status'] = result['http_status']
            self.state['last_request_stage'] = 'upload_file'
            self.progress('awaiting_confirmation', current)
            self.event('native_transfer_result', filename=item['name'], attempt=attempt+1,
                       http_status=result['http_status'], sent_bytes=result['sent_bytes'],
                       seconds=result['seconds'], exit_code=result['exit_code'])
            status = result['http_status']
            if result['exit_code'] == 0 and status in (200, 201):
                response = result['response']
                if (not isinstance(response, dict) or result['sent_bytes'] != item['bytes']
                        or int(response.get('size', -1)) != item['bytes']
                        or (response.get('checksum') or '').removeprefix('md5:').lower() != md5):
                    raise UploadError('Zenodo upload size/checksum verification failed; do not publish.')
                self.record_receipt(item, md5, 'uploaded_verified')
                return
            if self.reconcile_upload(bucket, item, md5):
                return
            if status in (401, 403):
                raise UploadError('Zenodo rejected authentication or upload permission.')
            # curl can retain the provisional 100 Continue code when sending
            # subsequently fails (e.g. exit 55). It is not a final rejection.
            if 200 <= status < 500 and status not in (200, 201):
                raise UploadError('Windows upload returned HTTP %s; completed files are preserved.' % status)
            if result['exit_code'] in (3, 4, 26, 48, 58, 60, 77):
                raise UploadError('Windows transfer configuration, local input or certificate check failed (curl %s).' % result['exit_code'])
            if attempt == 1:
                if status >= 500:
                    raise TransientUploadError('Zenodo returned HTTP %s after two transfer attempts. '
                                      'Completed files are preserved. Wait for the service to recover before retrying; '
                                      'this response does not establish a problem with the local Wi-Fi.' % status)
                error_type = (TransientUploadError if result['exit_code'] in (0, 5, 6, 7, 18, 28, 35, 52, 55, 56, 92)
                              else UploadError)
                raise error_type('The Windows transfer failed twice (curl %s; HTTP %s). '
                                  'Completed files are preserved. The cause of the connection failure is not yet determined.'
                                  % (result['exit_code'], status))
            self.delay(attempt)

    def run_queue(self, bucket, queue):
        ordered = sorted(queue, key=lambda entry: entry['bytes'])
        if len({item['name'] for item in ordered}) != len(ordered):
            raise UploadError('Duplicate filename in the transfer queue.')
        if not ordered:
            return
        self._parallel_active = True
        self.event('parallel_transfers_enabled', workers=self.workers, queued_files=len(ordered))
        fatal_errors = []
        unresolved = {}
        fatal = threading.Event()
        degraded = threading.Event()
        pending = deque((item, 0) for item in ordered)
        deferred = deque()
        consecutive_failures = 0
        circuit_open = False

        def transfer(item, round_number):
            self._worker_context.name = item['name']
            try:
                self.progress('checking_existing', {'name': item['name'], 'bytes': item['bytes'], 'sent_bytes': 0})
                # Reconcile a delayed completion before any deferred transfer.
                if round_number and self.reconcile_upload(bucket, item):
                    return
                self.upload_one(bucket, item)
            except TransientUploadError:
                degraded.set()
                raise
            except Exception:
                fatal.set()
                raise
            finally:
                self._worker_context.name = None
                with self._state_lock:
                    self._active.pop(item['name'], None)
                    self.progress()

        try:
            with ThreadPoolExecutor(max_workers=self.workers, thread_name_prefix='zenodo-file') as pool:
                futures = {}
                while pending or deferred or futures:
                    if not fatal.is_set() and not circuit_open:
                        # Finish the first pass before retrying deferred files.
                        if not pending and not futures and deferred:
                            pending, deferred = deferred, deque()
                            self.event('deferred_retry_pass', files=len(pending), workers=1)
                            self.delay(2)
                        limit = 1 if degraded.is_set() else self.workers
                        while pending and len(futures) < limit:
                            item, round_number = pending.popleft()
                            futures[pool.submit(transfer, item, round_number)] = (item, round_number)
                    if not futures:
                        break
                    done, _ = wait(futures, return_when=FIRST_COMPLETED)
                    for future in done:
                        item, round_number = futures.pop(future)
                        try:
                            future.result()
                            consecutive_failures = 0
                            unresolved.pop(item['name'], None)
                        except TransientUploadError as error:
                            unresolved[item['name']] = error
                            consecutive_failures += 1
                            if round_number == 0:
                                deferred.append((item, 1))
                            self.event('file_deferred', filename=item['name'],
                                       retry_pass=round_number, deferred_retry_available=round_number == 0,
                                       following_transfers=1, other_active_files_are_allowed_to_finish=True)
                            if consecutive_failures >= 2:
                                circuit_open = True
                                self.event('service_backoff_required', consecutive_failed_files=consecutive_failures)
                        except Exception as error:
                            fatal.set()
                            fatal_errors.append(error)
                            self.event('parallel_file_failed', filename=item['name'], error_class=type(error).__name__,
                                       other_active_files_are_allowed_to_finish=True)
            if fatal_errors:
                raise fatal_errors[0]
            if unresolved:
                raise UploadError('Transfers remain incomplete after bounded automatic recovery. '
                                  'Saved files are preserved. First unresolved file: ' + next(iter(unresolved)))
        finally:
            with self._state_lock:
                self._parallel_active = False
                self._active.clear()
                self.state['active_transfers'] = []
                self.state['simultaneous_transfers'] = 0
                self.progress('checking_remote', {})

    def run(self):
        deposition = self.get_draft()
        bucket = check_draft(deposition)
        existing = remote_files(deposition)
        if len(set(existing)|{item['name'] for item in self.files})>100:
            raise UploadError('The resulting draft would exceed 100 files; no upload started.')
        unexpected = set(existing) - {item["name"] for item in self.files}
        if unexpected and not self.plan and self.scope != 'full-record':
            raise UploadError("The draft contains unexpected filenames; review them before uploading. Nothing was deleted.")
        self.save_inventory(existing, 'before_upload')
        queue = []
        # Verify already completed files first so the total clearly starts at
        # the saved checkpoint, even when their names sort after pending ZIPs.
        for item in self.files:
            remote = existing.get(item["name"])
            if remote_complete(remote) and remote["bytes"] == item["bytes"]:
                md5 = self.local_md5(item)
                if md5 != remote["md5"]:
                    if self.authorized_replacement(item, remote):
                        self.event('authorized_update', filename=item['name'])
                        queue.append(item)
                    else:
                        raise UploadError("A complete remote file differs from its local source and the approved previous version; refusing to overwrite it.")
                else:
                    self.record_receipt(item, md5, "existing_verified")
            elif remote_complete(remote):
                if self.authorized_replacement(item, remote):
                    self.event('authorized_update', filename=item['name'])
                    queue.append(item)
                else:
                    raise UploadError("An existing remote file differs from the approved previous version; refusing to overwrite it.")
            elif (not remote or remote.get('status') == 'pending'
                  or (remote['bytes'] == 0 and not remote['md5'])):
                queue.append(item)
            else:
                raise UploadError('A remote file has an uncertain upload state; refusing to overwrite it.')
        self.state['remaining_file_count'] = len(queue)
        self.state['remaining_bytes'] = sum(item['bytes'] for item in queue)
        for item in queue:
            self.assert_upload_allowed(item)
        self.progress('uploading', {})
        self.run_queue(bucket, queue)
        final = self.get_draft()
        check_draft(final)
        actual = remote_files(final)
        self.save_inventory(actual, 'after_upload')
        for item in self.files:
            remote = actual.get(item["name"], {})
            receipt = self.receipts[item["name"]]
            if (not remote_complete(remote) or remote.get("bytes") != item["bytes"]
                    or remote.get("md5") != receipt["md5"]):
                raise UploadError("Final remote inventory verification failed; do not publish.")
        retired=set()
        if self.plan and self.plan.get('mode') in ('gh146-chunked','gh146-chunked-avi-cleanup'):
            retired=set(self.plan['retired_pending_files'])
            actual=self.remove_retired_pending_files(bucket,actual)
            self.save_inventory(actual,'after_pending_placeholder_cleanup')
            for item in self.files:
                remote=actual.get(item['name'],{});receipt=self.receipts[item['name']]
                if (not remote_complete(remote) or remote.get('bytes')!=item['bytes']
                        or remote.get('md5')!=receipt['md5']):
                    raise UploadError('Final file verification failed after pending-placeholder cleanup.')
        names = {item['name'] for item in self.files}
        untouched_before = {k:v for k,v in existing.items() if k not in names|retired}
        untouched_after = {k:v for k,v in actual.items() if k not in names|retired}
        if untouched_before != untouched_after:
            raise UploadError('Other remote files changed during this update; inspect concurrent browser uploads.')
        self.state['full_collection_verified'] = names == {item['name'] for item in self.expected_files}
        self.progress("complete", {})
        self.event("all_files_verified", file_count=len(self.files), total_bytes=self.state["total_bytes"], published=False,
                   scope=self.scope, full_collection_verified=self.state['full_collection_verified'],
                   extra_remote_files=self.state['extra_remote_files'])

    def remove_retired_pending_files(self,bucket,actual):
        """Remove only two empty failed placeholders after every new file is verified."""
        if not self.plan or self.plan.get('mode') not in ('gh146-chunked','gh146-chunked-avi-cleanup'):
            raise UploadError('Placeholder cleanup is not authorized for this plan.')
        allowed={'AeroSense-02c-lightsheet-GH146-run03-raw.zip',
                 'AeroSense-02d-lightsheet-GH146-run04-raw.zip'}
        if set(self.plan.get('retired_pending_files',[]))!=allowed:
            raise UploadError('Unexpected placeholder cleanup targets.')
        for item in self.files:
            remote=actual.get(item['name'],{});receipt=self.receipts.get(item['name'],{})
            if (not remote_complete(remote) or not receipt.get('verified')
                    or remote.get('bytes')!=item['bytes'] or remote.get('md5')!=receipt.get('md5')):
                raise UploadError('New split files must all be verified before placeholder cleanup.')
        for name in sorted(allowed):
            fresh=self.get_draft()
            if check_draft(fresh)!=bucket.rstrip('/'):
                raise UploadError('Draft identity changed before placeholder cleanup.')
            actual=remote_files(fresh);old=actual.get(name)
            if old is None:continue
            if old.get('status')!='pending' or old.get('bytes')!=0 or old.get('md5'):
                raise UploadError('Retired file is not an empty pending placeholder; left untouched: '+name)
            conn=self.connection();status=None;connection_error=None
            try:
                url=MODERN_DRAFT+'/files/'+quote(name,safe='')
                conn.request('DELETE',guarded_url(url),headers=self.headers())
                response=conn.getresponse();status=response.status
                self.response_status(response,'remove_empty_pending_placeholder')
                response.read(2_000_000)
            except (OSError,http.client.HTTPException) as error:
                connection_error=type(error).__name__
            finally:conn.close()
            refreshed=self.get_draft()
            if check_draft(refreshed)!=bucket.rstrip('/'):
                raise UploadError('Draft identity changed after placeholder cleanup.')
            actual=remote_files(refreshed)
            if name in actual:
                raise UploadError('Split files are saved, but pending-placeholder cleanup needs retry '
                                  '(HTTP %s; %s).'%(status,connection_error))
            self.event('retired_empty_placeholder_removed',filename=name,http_status=status)
        return actual


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Inspect local file names/sizes without authentication or network.")
    parser.add_argument('--scope',choices=['record19-update','full-record'],default='record19-update')
    parser.add_argument('--transport', choices=['python','windows-curl'], default='windows-curl')
    parser.add_argument('--workers', type=int, choices=[1, 2, 4], default=4,
                        help='At most four independent files; each saved file is verified and skipped on retry.')
    args = parser.parse_args()
    uploader = None
    upload_lock = None
    try:
        all_files = collect_files(DEFAULT_ROOT)
        files = selected_files(all_files, scope=args.scope)
        if args.dry_run:
            print(json.dumps({"record_id": RECORD_ID, "doi": DOI, "file_count": len(files),
                              "total_bytes": sum(x["bytes"] for x in files), "files": files}, indent=2))
            return 0
        token = sys.stdin.readline().strip()
        if not token or any(ch.isspace() for ch in token) or len(token) < 16:
            raise UploadError("Provide the personal access token on the first line of stdin.")
        upload_lock = acquire_upload_lock()
        uploader = Uploader(token, files, scope=args.scope, expected_files=all_files, transport=args.transport, workers=args.workers)
        with AwakeLease() as awake:
            uploader.event('power_guard_enabled', active=awake.active,
                           system_required=True, display_required=True,
                           persistent_settings_changed=False)
            uploader.event('transport_selected', transport=args.transport,
                           credential_storage='memory_and_child_stdin_only')
            try:
                uploader.run()
            finally:
                uploader.event('power_guard_releasing')
        return 0
    except KeyboardInterrupt:
        if uploader:
            uploader.progress("interrupted")
            uploader.event("interrupted")
        return 130
    except Exception as error:
        message = str(error) if isinstance(error, UploadError) else "Local operation failed (%s)." % type(error).__name__
        if uploader:
            try:
                uploader.event('failure_location', **safe_error_details(error))
                uploader.state['error'] = message
                uploader.progress("failed")
                uploader.event("failed", message=message)
            except LocalPersistenceError:
                print(json.dumps({'event':'failed', 'message':message,
                                  'diagnostics':safe_error_details(error)}), flush=True)
        else:
            print(json.dumps({"event": "failed", "message": message}), flush=True)
        return 1
    finally:
        if upload_lock:
            upload_lock.close()


if __name__ == "__main__":
    sys.exit(main())
