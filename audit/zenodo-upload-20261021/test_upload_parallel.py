import hashlib
import io
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest import mock
from contextlib import redirect_stdout

import upload_to_zenodo as u


class ParallelTests(unittest.TestCase):
    def fixture(self, root, workers=2, transport='windows-curl'):
        files = []
        for name in ('a.zip', 'b.zip', 'c.zip', 'saved.zip'):
            path = root / name
            content = (name * 100).encode()
            path.write_bytes(content)
            files.append({'name': name, 'path': str(path), 'bytes': len(content),
                          'mtime_ns': path.stat().st_mtime_ns,
                          'sha256': hashlib.sha256(content).hexdigest()})
        worker = u.Uploader('private-test-token-never-log', files, root / 'audit',
                            workers=workers, transport=transport)
        return worker, files

    def test_parallel_native_saves_once_skips_existing_and_finishes_inventory(self):
        with tempfile.TemporaryDirectory() as directory, redirect_stdout(io.StringIO()):
            root = Path(directory)
            worker, files = self.fixture(root)
            lock = threading.Lock()
            barrier = threading.Barrier(2)
            by_name = {item['name']: item for item in files}
            saved = by_name['saved.zip']
            remote = {'saved.zip': {'filename': 'saved.zip', 'filesize': saved['bytes'],
                                   'checksum': hashlib.md5(Path(saved['path']).read_bytes()).hexdigest(),
                                   'status': 'completed'}}
            called = []
            active = 0
            peak = 0
            both_visible = []
            bucket = 'https://zenodo.org/api/files/test-bucket'

            def draft():
                with lock:
                    entries = [dict(value) for value in remote.values()]
                return {'id': u.RECORD_ID, 'submitted': False, 'state': 'unsubmitted',
                        'metadata': {'prereserve_doi': {'doi': u.DOI}},
                        'links': {'bucket': bucket}, 'files': entries}

            def upload(url, path, token, agent, callback):
                nonlocal active, peak
                name = Path(path).name
                content = Path(path).read_bytes()
                with lock:
                    called.append(name)
                    active += 1
                    peak = max(peak, active)
                callback(50)
                if name in ('a.zip', 'b.zip'):
                    barrier.wait(timeout=5)
                    with worker._state_lock:
                        both_visible.append(len(worker.state['active_transfers']))
                md5 = hashlib.md5(content).hexdigest()
                with lock:
                    remote[name] = {'filename': name, 'filesize': len(content),
                                    'checksum': md5, 'status': 'completed'}
                    active -= 1
                callback(100)
                return {'http_status': 201, 'sent_bytes': len(content), 'seconds': 1,
                        'exit_code': 0, 'response': {'size': len(content), 'checksum': 'md5:' + md5}}

            worker.get_draft = draft
            with mock.patch.object(u.upload_native_curl, 'upload', side_effect=upload):
                worker.run()
            self.assertEqual(sorted(called), ['a.zip', 'b.zip', 'c.zip'])
            self.assertEqual(peak, 2)
            self.assertIn(2, both_visible)
            self.assertTrue(worker.state['full_collection_verified'])
            self.assertEqual(worker.state['remaining_file_count'], 0)
            self.assertEqual(worker.state['remaining_wire_bytes_estimate'], 0)
            receipts = json.loads(worker.receipt_path.read_text())['files']
            self.assertEqual(set(receipts), set(by_name))
            self.assertTrue(all(receipt['verified'] for receipt in receipts.values()))
            self.assertEqual(receipts['saved.zip']['action'], 'existing_verified')
            for path in worker.audit.glob('*.json*'):
                self.assertNotIn('private-test-token-never-log', path.read_text())

    def test_failure_stops_new_files_but_does_not_cancel_other_active_file(self):
        with tempfile.TemporaryDirectory() as directory, redirect_stdout(io.StringIO()):
            worker, files = self.fixture(Path(directory))
            b_started = threading.Event()
            a_failed = threading.Event()
            called = []

            def upload(bucket, item):
                called.append(item['name'])
                if item['name'] == 'a.zip':
                    self.assertTrue(b_started.wait(5))
                    a_failed.set()
                    raise u.UploadError('Test server failure')
                self.assertEqual(item['name'], 'b.zip')
                b_started.set()
                self.assertTrue(a_failed.wait(5))
                worker.record_receipt(item, hashlib.md5(Path(item['path']).read_bytes()).hexdigest(), 'uploaded_verified')

            worker.upload_one = upload
            with self.assertRaisesRegex(u.UploadError, 'Test server failure'):
                worker.run_queue('https://zenodo.org/api/files/test-bucket', files)
            self.assertEqual(set(called), {'a.zip', 'b.zip'})
            receipts = json.loads(worker.receipt_path.read_text())['files']
            self.assertEqual(set(receipts), {'b.zip'})
            self.assertTrue(receipts['b.zip']['verified'])
            self.assertEqual(worker.state['simultaneous_transfers'], 0)

    def test_same_file_is_never_scheduled_twice(self):
        with tempfile.TemporaryDirectory() as directory:
            worker, files = self.fixture(Path(directory))
            worker.upload_one = mock.Mock()
            with self.assertRaisesRegex(u.UploadError, 'Duplicate filename'):
                worker.run_queue('unused', [files[0], files[0]])
            worker.upload_one.assert_not_called()

    def test_transient_failure_continues_serially_then_retries_only_failed_file(self):
        with tempfile.TemporaryDirectory() as directory, redirect_stdout(io.StringIO()):
            worker,files=self.fixture(Path(directory))
            worker.delay=lambda *args:None
            worker.reconcile_upload=mock.Mock(return_value=False)
            calls=[];b_started=threading.Event();failure_sent=threading.Event()
            lock=threading.Lock();active=0;later_peak=0
            def upload(bucket,item):
                nonlocal active,later_peak
                name=item['name']
                with lock:
                    calls.append(name);active+=1
                    if name in ('c.zip','saved.zip'):later_peak=max(later_peak,active)
                try:
                    if name=='a.zip' and calls.count(name)==1:
                        self.assertTrue(b_started.wait(5));failure_sent.set()
                        raise u.TransientUploadError('Readback confirmed absent')
                    if name=='b.zip':
                        b_started.set();self.assertTrue(failure_sent.wait(5))
                    worker.record_receipt(item,hashlib.md5(Path(item['path']).read_bytes()).hexdigest(),'uploaded_verified')
                finally:
                    with lock:active-=1
            worker.upload_one=upload
            worker.run_queue('https://zenodo.org/api/files/b',files)
            self.assertEqual(calls.count('a.zip'),2)
            self.assertTrue(all(calls.count(name)==1 for name in ('b.zip','c.zip','saved.zip')))
            self.assertEqual(calls[-1],'a.zip')
            self.assertEqual(later_peak,1)
            self.assertEqual(len(worker.state['completed']),4)
            self.assertEqual(worker.reconcile_upload.call_count,1)

    def test_deferred_file_saved_later_is_reconciled_without_resending(self):
        with tempfile.TemporaryDirectory() as directory, redirect_stdout(io.StringIO()):
            worker,files=self.fixture(Path(directory),workers=1)
            worker.delay=lambda *args:None
            calls=[]
            def upload(bucket,item):
                calls.append(item['name'])
                if item['name']=='a.zip':raise u.TransientUploadError('Temporary failure')
                worker.record_receipt(item,hashlib.md5(Path(item['path']).read_bytes()).hexdigest(),'uploaded_verified')
            def reconcile(bucket,item):
                worker.record_receipt(item,hashlib.md5(Path(item['path']).read_bytes()).hexdigest(),'recovered_verified');return True
            worker.upload_one=upload;worker.reconcile_upload=reconcile
            worker.run_queue('https://zenodo.org/api/files/b',files)
            self.assertEqual(calls.count('a.zip'),1)
            self.assertEqual(len(worker.state['completed']),4)

    def test_continuous_service_failure_stops_bounded_recovery(self):
        with tempfile.TemporaryDirectory() as directory, redirect_stdout(io.StringIO()):
            worker,files=self.fixture(Path(directory),workers=1)
            worker.delay=lambda *args:None
            calls=[]
            def upload(bucket,item):
                calls.append(item['name']);raise u.TransientUploadError('Server unavailable')
            worker.upload_one=upload
            with self.assertRaisesRegex(u.UploadError,'bounded automatic recovery'):
                worker.run_queue('https://zenodo.org/api/files/b',files)
            self.assertEqual(calls,['a.zip','b.zip'])
            self.assertFalse(worker.state['completed'])

    def test_single_transfer_fallback_preserves_order(self):
        with tempfile.TemporaryDirectory() as directory:
            worker, files = self.fixture(Path(directory), workers=1)
            calls = []
            worker.upload_one = lambda bucket, item: calls.append(item['name'])
            worker.run_queue('unused', list(reversed(files)))
            self.assertEqual(calls, [item['name'] for item in sorted(reversed(files), key=lambda x:x['bytes'])])
            self.assertFalse(worker._parallel_active)

    def test_workers_bounded_and_duplicate_receipt_not_double_counted(self):
        with tempfile.TemporaryDirectory() as directory, redirect_stdout(io.StringIO()):
            root = Path(directory)
            for workers in (0, 3, 20):
                with self.assertRaises(u.UploadError):
                    u.Uploader('test-token', [], root, workers=workers)
            worker, files = self.fixture(root)
            item = files[0]
            md5 = hashlib.md5(Path(item['path']).read_bytes()).hexdigest()
            worker.record_receipt(item, md5, 'uploaded_verified')
            worker.record_receipt(item, md5, 'recovered_verified')
            self.assertEqual(worker.state['completed'], [item['name']])
            self.assertEqual(worker.state['remaining_file_count'], 3)

    def test_four_transfers_run_together_and_keep_all_receipts(self):
        with tempfile.TemporaryDirectory() as directory, redirect_stdout(io.StringIO()):
            worker,files=self.fixture(Path(directory),workers=4)
            barrier=threading.Barrier(4)
            lock=threading.Lock();active=0;peak=0;calls=[]
            def upload(bucket,item):
                nonlocal active,peak
                with lock:
                    calls.append(item['name']);active+=1;peak=max(peak,active)
                barrier.wait(timeout=5)
                worker.record_receipt(item,hashlib.md5(Path(item['path']).read_bytes()).hexdigest(),'uploaded_verified')
                with lock:active-=1
            worker.upload_one=upload
            worker.run_queue('https://zenodo.org/api/files/b',files)
            self.assertEqual(peak,4)
            self.assertEqual(len(set(calls)),4)
            receipts=json.loads(worker.receipt_path.read_text())['files']
            self.assertEqual(len(receipts),4)
            self.assertTrue(all(r['verified'] for r in receipts.values()))
            self.assertEqual(worker.state['remaining_file_count'],0)


if __name__ == '__main__':
    unittest.main()
