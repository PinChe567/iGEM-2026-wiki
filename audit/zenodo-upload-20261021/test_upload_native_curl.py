import contextlib
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import io
import json
import os
from pathlib import Path
import subprocess
import socket
import sys
import tempfile
import threading
import time
import unittest
from unittest import mock

import upload_native_curl as native
import upload_to_zenodo as u

TOKEN = 'dummy-unit-test-secret-not-a-real-token'


class NativeTests(unittest.TestCase):
    def item(self, folder):
        path = Path(folder)/'原始資料 with spaces.zip'
        data = bytes(range(256)) * 4096
        path.write_bytes(data)
        return {'name':path.name,'path':str(path),'bytes':len(data),
                'mtime_ns':path.stat().st_mtime_ns,'sha256':hashlib.sha256(data).hexdigest()}, data

    def test_destination_and_config_injection_are_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            item,_=self.item(folder)
            for url in ('http://zenodo.org/api/files/b/x', 'https://evil.test/api/files/x',
                        'https://zenodo.org/api/files/b/x?access_token=x',
                        'https://zenodo.org/api/files/x#frag', 'https://user@zenodo.org/api/files/x',
                        'https://zenodo.org/api/records/23469212/draft/actions/publish'):
                with self.subTest(url=url),self.assertRaises(native.NativeTransportError):
                    native.configuration(url,item['path'],TOKEN,'test')
            with self.assertRaises(native.NativeTransportError):
                native.configuration('https://zenodo.org/api/files/b/x',item['path'],TOKEN+'\nheader=x','test')
            config=native.configuration('https://zenodo.org/api/files/b/x',item['path'],TOKEN,'test')
            self.assertNotIn(b'insecure',config)
            self.assertNotIn(b'location',config)
            self.assertIn(b'retry = 0',config)

    @unittest.skipUnless(os.name=='nt','Native Windows integration')
    def test_real_curl_unicode_stream_and_redirect_guard(self):
        seen=[]
        class Handler(BaseHTTPRequestHandler):
            protocol_version='HTTP/1.1'
            def do_PUT(self):
                body=self.rfile.read(int(self.headers['Content-Length']))
                seen.append({'path':self.path,'body':body,'auth':self.headers.get('Authorization')})
                status=302 if self.path=='/redirect' else 201
                payload=json.dumps({'size':len(body),'checksum':'md5:'+hashlib.md5(body).hexdigest()}).encode()
                self.send_response(status)
                self.send_header('Content-Type','application/json')
                self.send_header('Content-Length',str(len(payload)))
                if status==302:self.send_header('Location','/must-not-follow')
                self.end_headers();self.wfile.write(payload)
            def log_message(self,*args):pass
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        server.daemon_threads=True
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            with tempfile.TemporaryDirectory() as folder:
                item,data=self.item(folder)
                original='https://zenodo.org/api/files/b/x'
                base=native.configuration(original,item['path'],TOKEN,'test')
                invocations=[];real_popen=subprocess.Popen
                def launch(args,**kwargs):
                    invocations.append(args)
                    self.assertNotIn(TOKEN,repr(args))
                    self.assertIsNone(kwargs.get('env'))
                    return real_popen(args,**kwargs)
                with mock.patch.object(native.subprocess,'Popen',side_effect=launch):
                    for path,status in (('/upload',201),('/redirect',302)):
                        # Only this isolated test replaces the validated destination
                        # and HTTPS protocol policy with a loopback HTTP receiver.
                        cfg=base.replace(original.encode(),('http://127.0.0.1:%s%s'%(server.server_port,path)).encode())
                        cfg=cfg.replace(b'proto = "=https"',b'proto = "=http"')
                        result=native._run(cfg,lambda percent:None)
                        self.assertEqual(result['exit_code'],0)
                        self.assertEqual(result['http_status'],status)
                        self.assertEqual(result['sent_bytes'],len(data))
                        self.assertEqual(result['response']['checksum'],'md5:'+hashlib.md5(data).hexdigest())
                self.assertEqual([v['path'] for v in seen],['/upload','/redirect'])
                self.assertTrue(all(v['body']==data and v['auth']=='Bearer '+TOKEN for v in seen))
                self.assertTrue(all(args[1:]==['-q','--config','-'] for args in invocations))
                self.assertEqual(list(Path(folder).iterdir()),[Path(item['path'])])
        finally:
            server.shutdown();server.server_close();thread.join(timeout=2)

    @unittest.skipUnless(os.name=='nt','Windows job lifetime')
    def test_native_child_stops_when_uploader_job_closes(self):
        process=subprocess.Popen([sys.executable,'-c','import time;time.sleep(30)'],
                                 creationflags=subprocess.CREATE_NO_WINDOW)
        guard=None
        try:
            guard=native.ChildLifetime(process)
            started=time.monotonic()
            guard.close()
            process.wait(timeout=5)
            self.assertIsNotNone(process.poll())
            self.assertLess(time.monotonic()-started,5)
        finally:
            if process.poll() is None:process.kill();process.wait()
            if guard:guard.close()

    def worker(self,folder):
        item,data=self.item(folder)
        worker=u.Uploader(TOKEN,[item],Path(folder)/'audit',transport='windows-curl')
        worker.delay=lambda *args:None
        return worker,item,data

    def test_native_success_requires_size_and_md5_not_progress(self):
        for valid in (True,False):
            with self.subTest(valid=valid),tempfile.TemporaryDirectory() as folder,contextlib.redirect_stdout(io.StringIO()):
                worker,item,data=self.worker(folder)
                def transfer(url,path,token,agent,report):
                    report(100)
                    self.assertEqual(worker.state['completed'],[])
                    return {'http_status':201,'sent_bytes':len(data),'seconds':1,'exit_code':0,
                            'response':{'size':len(data),'checksum':hashlib.md5(data).hexdigest() if valid else '0'*32}}
                with mock.patch.object(native,'upload',side_effect=transfer):
                    if valid:
                        worker.upload_one('https://zenodo.org/api/files/b',item)
                        self.assertEqual(worker.state['completed'],[item['name']])
                    else:
                        with self.assertRaises(u.UploadError):worker.upload_one('https://zenodo.org/api/files/b',item)
                        self.assertEqual(worker.state['completed'],[])
                logs=''.join(p.read_text(encoding='utf-8') for p in worker.audit.glob('*.json*'))
                self.assertNotIn(TOKEN,logs)

    def test_native_lost_reply_reconciles_before_any_second_upload(self):
        with tempfile.TemporaryDirectory() as folder,contextlib.redirect_stdout(io.StringIO()):
            worker,item,data=self.worker(folder)
            def recovered(bucket,entry,md5):
                worker.record_receipt(entry,md5,'recovered_verified');return True
            worker.reconcile_upload=mock.Mock(side_effect=recovered)
            result={'http_status':0,'sent_bytes':len(data),'seconds':1,'exit_code':56,'response':None}
            with mock.patch.object(native,'upload',return_value=result) as transfer:
                worker.upload_one('https://zenodo.org/api/files/b',item)
                self.assertEqual(transfer.call_count,1)
                self.assertEqual(worker.state['completed'],[item['name']])

    def test_native_failure_stops_after_two_attempts_and_never_resends_protected_zip(self):
        with tempfile.TemporaryDirectory() as folder,contextlib.redirect_stdout(io.StringIO()):
            worker,item,data=self.worker(folder)
            worker.reconcile_upload=mock.Mock(return_value=False)
            result={'http_status':0,'sent_bytes':120,'seconds':1,'exit_code':56,'response':None}
            with mock.patch.object(native,'upload',return_value=result) as transfer:
                with self.assertRaisesRegex(u.UploadError,'failed twice'):
                    worker.upload_one('https://zenodo.org/api/files/b',item)
                self.assertEqual(transfer.call_count,2)
                self.assertEqual(worker.state['completed'],[])
                worker.plan={'mode':'gh146-chunked','file_names':[]}
                with self.assertRaisesRegex(u.UploadError,'will not re-upload'):
                    worker.upload_one('https://zenodo.org/api/files/b',item)
                self.assertEqual(transfer.call_count,2)

    def test_interim_100_with_send_error_reconciles_and_retries(self):
        with tempfile.TemporaryDirectory() as folder,contextlib.redirect_stdout(io.StringIO()):
            worker,item,data=self.worker(folder)
            worker.reconcile_upload=mock.Mock(return_value=False)
            partial={'http_status':100,'sent_bytes':7929856,'seconds':147.49815,'exit_code':55,'response':None}
            success={'http_status':201,'sent_bytes':len(data),'seconds':1,'exit_code':0,
                     'response':{'size':len(data),'checksum':hashlib.md5(data).hexdigest()}}
            with mock.patch.object(native,'upload',side_effect=[partial,success]) as transfer:
                worker.upload_one('https://zenodo.org/api/files/b',item)
                self.assertEqual(transfer.call_count,2)
                self.assertGreaterEqual(worker.reconcile_upload.call_count,2)
                self.assertEqual(worker.state['completed'],[item['name']])

    def test_interim_only_is_never_success_even_if_curl_exits_zero(self):
        with tempfile.TemporaryDirectory() as folder,contextlib.redirect_stdout(io.StringIO()):
            worker,item,data=self.worker(folder)
            worker.reconcile_upload=mock.Mock(return_value=False)
            partial={'http_status':100,'sent_bytes':len(data),'seconds':1,'exit_code':0,'response':None}
            with mock.patch.object(native,'upload',return_value=partial) as transfer:
                with self.assertRaises(u.TransientUploadError):worker.upload_one('https://zenodo.org/api/files/b',item)
                self.assertEqual(transfer.call_count,2)
                self.assertEqual(worker.state['completed'],[])

    @unittest.skipUnless(os.name=='nt','Native Windows integration')
    def test_real_interim_continue_then_disconnect_retries_without_false_receipt(self):
        outcomes=[];calls=[]
        class Handler(BaseHTTPRequestHandler):
            protocol_version='HTTP/1.1'
            def do_PUT(self):
                calls.append(self.path)
                if len(calls)==1:
                    self.rfile.read(1024)
                    self.connection.shutdown(socket.SHUT_RDWR)
                    self.close_connection=True
                    return
                body=self.rfile.read(int(self.headers['Content-Length']))
                payload=json.dumps({'size':len(body),'checksum':hashlib.md5(body).hexdigest()}).encode()
                self.send_response(201);self.send_header('Content-Length',str(len(payload)))
                self.end_headers();self.wfile.write(payload)
            def log_message(self,*args):pass
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler);server.daemon_threads=True
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            with tempfile.TemporaryDirectory() as folder,contextlib.redirect_stdout(io.StringIO()):
                worker,item,data=self.worker(folder)
                worker.reconcile_upload=mock.Mock(return_value=False)
                def transfer(url,path,token,agent,callback):
                    cfg=native.configuration(url,path,token,agent)
                    cfg=cfg.replace(url.encode(),('http://127.0.0.1:%s/upload'%server.server_port).encode())
                    cfg=cfg.replace(b'proto = "=https"',b'proto = "=http"')+b'header = "Expect: 100-continue"\n'
                    result=native._run(cfg,callback);outcomes.append(result);return result
                with mock.patch.object(native,'upload',side_effect=transfer):
                    worker.upload_one('https://zenodo.org/api/files/b/test.zip',item)
                self.assertEqual(len(outcomes),2)
                self.assertEqual(outcomes[0]['http_status'],100)
                self.assertNotEqual(outcomes[0]['exit_code'],0)
                self.assertEqual(outcomes[1]['http_status'],201)
                self.assertEqual(worker.state['completed'],[item['name']])
        finally:
            server.shutdown();server.server_close();thread.join(timeout=2)

    def test_server_failure_is_not_reported_as_local_network_fault(self):
        with tempfile.TemporaryDirectory() as folder,contextlib.redirect_stdout(io.StringIO()):
            worker,item,data=self.worker(folder)
            worker.reconcile_upload=mock.Mock(return_value=False)
            result={'http_status':502,'sent_bytes':120,'seconds':1,'exit_code':0,'response':None}
            with mock.patch.object(native,'upload',return_value=result) as transfer:
                with self.assertRaisesRegex(u.UploadError,'Wait for the service to recover') as error:
                    worker.upload_one('https://zenodo.org/api/files/b',item)
                self.assertNotIn('Test another network',str(error.exception))
                self.assertEqual(transfer.call_count,2)
                self.assertEqual(worker.state['completed'],[])


if __name__=='__main__':unittest.main()
