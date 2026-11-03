import csv
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock
from contextlib import redirect_stdout

spec = importlib.util.spec_from_file_location("uploader", Path(__file__).with_name("upload_to_zenodo.py"))
uploader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(uploader)


class UploadTests(unittest.TestCase):
    def test_chunk_plan_requires_contiguous_parts_and_exact_runs(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            retired=['AeroSense-02c-lightsheet-GH146-run03-raw.zip','AeroSense-02d-lightsheet-GH146-run04-raw.zip']
            names={*uploader.ATTACHMENTS,uploader.CHUNK_MAP,
                'AeroSense-02c-lightsheet-GH146-run03-raw-part01-of01.zip',
                'AeroSense-02d-lightsheet-GH146-run04-raw-part01-of01.zip'}
            plan={'record_id':uploader.RECORD_ID,'doi':uploader.DOI,'mode':'gh146-chunked',
                'chunk_counts':{'02c':1,'02d':1},'retired_pending_files':retired,
                'file_names':list(names),'files':{name:{} for name in names}}
            path=root/'approved-replacements.json';path.write_text(json.dumps(plan))
            self.assertEqual(set(uploader.approved_plan(root)['file_names']),names)
            cleanup=json.loads(json.dumps(plan));cleanup['mode']='gh146-chunked-avi-cleanup'
            for name in ('AeroSense-00-guides-and-provenance.zip','AeroSense-02a-lightsheet-analysis-and-media.zip'):
                cleanup['file_names'].append(name);cleanup['files'][name]={}
            path.write_text(json.dumps(cleanup))
            self.assertEqual(len(uploader.approved_plan(root)['file_names']),len(names)+2)
            forbidden='AeroSense-02b-lightsheet-TH-raw.zip'
            cleanup['file_names'].append(forbidden);cleanup['files'][forbidden]={}
            path.write_text(json.dumps(cleanup))
            with self.assertRaises(uploader.UploadError):uploader.approved_plan(root)
            plan['file_names'].remove(next(n for n in names if 'part01' in n));path.write_text(json.dumps(plan))
            with self.assertRaises(uploader.UploadError):uploader.approved_plan(root)
            plan['file_names']=list(names);plan['chunk_counts']={'02c':50,'02d':50};path.write_text(json.dumps(plan))
            with self.assertRaises(uploader.UploadError):uploader.approved_plan(root)

    def cleanup_fixture(self,root):
        retired=['AeroSense-02c-lightsheet-GH146-run03-raw.zip','AeroSense-02d-lightsheet-GH146-run04-raw.zip']
        item={'name':'part.zip','bytes':2};md5=hashlib.md5(b'ok').hexdigest()
        remote={'part.zip':{'bytes':2,'md5':md5,'status':'completed'},
                **{n:{'bytes':0,'md5':'','status':'pending'} for n in retired}}
        worker=uploader.Uploader('secret-test-token-value',[item],root)
        worker.plan={'mode':'gh146-chunked','retired_pending_files':retired}
        worker.receipts={'part.zip':{'verified':True,'bytes':2,'md5':md5}}
        bucket='https://zenodo.org/api/files/test-bucket';calls=[]
        def draft():
            return {'id':uploader.RECORD_ID,'submitted':False,'state':'unsubmitted',
                'metadata':{'prereserve_doi':{'doi':uploader.DOI}},'links':{'bucket':bucket},
                'files':[{'filename':n,'filesize':v['bytes'],'checksum':v['md5'],'status':v['status']} for n,v in remote.items()]}
        class Response:
            status=204
            def read(self,limit):return b''
        class Connection:
            def request(self,method,path,headers):
                calls.append((method,path));name=path.rsplit('/',1)[1]
                self_outer.assertEqual(method,'DELETE');self_outer.assertIn(name,retired)
                remote.pop(name)
            def getresponse(self):return Response()
            def close(self):pass
        self_outer=self;worker.get_draft=draft;worker.connection=Connection
        return worker,bucket,remote,calls

    def test_cleanup_removes_only_empty_retired_placeholders_after_all_parts_saved(self):
        with tempfile.TemporaryDirectory() as directory,redirect_stdout(io.StringIO()):
            worker,bucket,remote,calls=self.cleanup_fixture(Path(directory))
            result=worker.remove_retired_pending_files(bucket,remote.copy())
            self.assertEqual(set(result),{'part.zip'});self.assertEqual(len(calls),2)
            self.assertTrue(all(path.startswith('/api/records/23469212/draft/files/') for _,path in calls))

    def test_cleanup_refuses_completed_nonempty_or_unverified_files(self):
        for mode in ('completed','nonempty','missing_part'):
            with self.subTest(mode=mode),tempfile.TemporaryDirectory() as directory:
                worker,bucket,remote,calls=self.cleanup_fixture(Path(directory))
                old=worker.plan['retired_pending_files'][0]
                if mode=='completed':remote[old].update(bytes=5,md5='a'*32,status='completed')
                if mode=='nonempty':remote[old]['bytes']=5
                if mode=='missing_part':remote.pop('part.zip')
                with self.assertRaises(uploader.UploadError):worker.remove_retired_pending_files(bucket,remote.copy())
                self.assertEqual(calls,[])

    def test_lossless_repack_plan_allows_only_two_archives_and_indexes(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            names={'AeroSense-02c-lightsheet-GH146-run03-raw.zip',
                   'AeroSense-02d-lightsheet-GH146-run04-raw.zip',*uploader.ATTACHMENTS}
            plan={'record_id':uploader.RECORD_ID,'doi':uploader.DOI,'mode':'gh146-lossless-repack',
                  'file_names':sorted(names),'files':{name:{} for name in names}}
            path=root/'approved-replacements.json'
            path.write_text(json.dumps(plan),encoding='utf-8')
            self.assertEqual(set(uploader.approved_plan(root)['file_names']),names)
            worker=uploader.Uploader('secret-test-token-value',[],root)
            worker.connection=lambda:self.fail('Protected ZIP must never reach a network write.')
            with self.assertRaisesRegex(uploader.UploadError,'will not re-upload'):
                worker.upload_one('https://zenodo.org/api/files/test',{'name':'AeroSense-02b-lightsheet-TH-raw.zip'})
            plan['file_names'].append('AeroSense-02b-lightsheet-TH-raw.zip')
            plan['files']['AeroSense-02b-lightsheet-TH-raw.zip']={}
            path.write_text(json.dumps(plan),encoding='utf-8')
            with self.assertRaises(uploader.UploadError):uploader.approved_plan(root)

    def test_temporary_windows_replace_conflict_is_retried(self):
        with tempfile.TemporaryDirectory() as directory:
            worker=uploader.Uploader('secret-test-token-value', [], Path(directory))
            path=Path(directory)/'state.json'
            path.write_text('{"old": true}')
            original_replace=uploader.os.replace
            calls=[]
            def replace(source, target):
                calls.append(target)
                if len(calls)<3:
                    self.assertEqual(json.loads(path.read_text()), {'old':True})
                    raise PermissionError(13, 'reader holds destination')
                return original_replace(source,target)
            with mock.patch.object(uploader.os,'replace',side_effect=replace), mock.patch.object(uploader.time,'sleep'):
                worker.save_json(path,{'new':True})
            self.assertEqual(json.loads(path.read_text()),{'new':True})
            self.assertEqual(len(calls),3)

    def test_repack_preflight_stops_before_any_put_if_completed_zip_is_missing(self):
        with tempfile.TemporaryDirectory() as directory,redirect_stdout(io.StringIO()):
            root=Path(directory)
            names=['PACKAGE_INDEX.csv','AeroSense-02c-lightsheet-GH146-run03-raw.zip',
                   'AeroSense-02b-lightsheet-TH-raw.zip']
            files=[{'name':n,'bytes':index+1} for index,n in enumerate(names)]
            worker=uploader.Uploader('secret-test-token-value',files,root,scope='full-record')
            worker.plan={'mode':'gh146-lossless-repack','file_names':names[:2],'files':{}}
            worker.get_draft=lambda:{'id':uploader.RECORD_ID,'submitted':False,'state':'unsubmitted',
                'metadata':{'prereserve_doi':{'doi':uploader.DOI}},
                'links':{'bucket':'https://zenodo.org/api/files/test'},'files':[]}
            worker.upload_one=mock.Mock()
            with self.assertRaisesRegex(uploader.UploadError,'will not re-upload'):
                worker.run()
            worker.upload_one.assert_not_called()

    def test_blocked_progress_does_not_abort_upload_or_mark_file_complete(self):
        with tempfile.TemporaryDirectory() as directory, redirect_stdout(io.StringIO()) as output:
            worker=uploader.Uploader('secret-test-token-value', [], Path(directory))
            with mock.patch.object(uploader.os,'replace',side_effect=PermissionError(13,'reader lock')), mock.patch.object(uploader.time,'sleep'):
                worker.progress('uploading',{'name':'test.zip','sent_bytes':42})
            self.assertTrue(worker.progress_write_warning)
            self.assertEqual(worker.state['completed'],[])
            self.assertEqual(worker.receipts,{})
            worker.progress()
            self.assertFalse(worker.progress_write_warning)
            self.assertEqual(json.loads(worker.progress_path.read_text())['current']['sent_bytes'],42)
            self.assertIn('local_progress_delayed',output.getvalue())
            self.assertIn('local_progress_recovered',output.getvalue())
            self.assertNotIn('secret-test-token-value',output.getvalue())

    def test_blocked_receipt_is_fatal_and_preserves_previous_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            worker=uploader.Uploader('secret-test-token-value', [], Path(directory))
            worker.receipt_path.write_text('{"original": true}')
            with mock.patch.object(uploader.os,'replace',side_effect=PermissionError(13,'reader lock')), mock.patch.object(uploader.time,'sleep'):
                with self.assertRaises(uploader.LocalPersistenceError) as caught:
                    worker.save_json(worker.receipt_path,{'replacement':True})
            self.assertEqual(caught.exception.details['file'],'upload-receipts.json')
            self.assertEqual(caught.exception.details['operation'],'replace')
            self.assertEqual(json.loads(worker.receipt_path.read_text()),{'original':True})
            self.assertEqual(worker.state['completed'],[])

    def test_error_diagnostics_do_not_include_exception_message_or_locals(self):
        secret='secret-test-token-value'
        try:
            raise PermissionError(13,secret)
        except PermissionError as error:
            result=uploader.safe_error_details(error)
        self.assertEqual(result['error_class'],'PermissionError')
        self.assertEqual(result['errno'],13)
        self.assertTrue(result['frames'])
        self.assertNotIn(secret,json.dumps(result))

    @unittest.skipUnless(__import__('os').name=='nt','Windows file-sharing semantics')
    def test_real_windows_reader_lock_reproduces_and_recovers(self):
        import ctypes
        from ctypes import wintypes
        import threading
        kernel=ctypes.WinDLL('kernel32',use_last_error=True)
        kernel.CreateFileW.argtypes=[wintypes.LPCWSTR,wintypes.DWORD,wintypes.DWORD,
            ctypes.c_void_p,wintypes.DWORD,wintypes.DWORD,wintypes.HANDLE]
        kernel.CreateFileW.restype=wintypes.HANDLE
        kernel.CloseHandle.argtypes=[wintypes.HANDLE]
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);path=root/'status.json';path.write_text('{"old":true}')
            candidate=root/'candidate.json';candidate.write_text('{"probe":true}')
            handle=kernel.CreateFileW(str(path),0x80000000,3,None,3,0,None)
            self.assertNotEqual(handle,ctypes.c_void_p(-1).value)
            timer=None
            try:
                with self.assertRaises(PermissionError):uploader.os.replace(candidate,path)
                worker=uploader.Uploader('secret-test-token-value',[],root)
                timer=threading.Timer(0.15,lambda:kernel.CloseHandle(handle))
                timer.start()
                worker.save_json(path,{'new':True})
                self.assertEqual(json.loads(path.read_text()),{'new':True})
            finally:
                if timer:timer.join()
                else:kernel.CloseHandle(handle)

    def test_simulation_update_plan_allows_only_its_five_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            names={'AeroSense-00-guides-and-provenance.zip','AeroSense-03-hardware-design-and-calibration.zip',*uploader.ATTACHMENTS}
            plan={'record_id':uploader.RECORD_ID,'doi':uploader.DOI,'mode':'hardware-simulation-update',
                  'file_names':sorted(names),'files':{name:{} for name in names}}
            (root/'approved-replacements.json').write_text(json.dumps(plan),encoding='utf-8')
            self.assertEqual(set(uploader.approved_plan(root)['file_names']),names)
            plan['file_names'].append('unrelated.zip');plan['files']['unrelated.zip']={}
            (root/'approved-replacements.json').write_text(json.dumps(plan),encoding='utf-8')
            with self.assertRaises(uploader.UploadError):uploader.approved_plan(root)

    def interrupted_upload_fixture(self, root, remote_state, server_error=False):
        data=b'upload whose acknowledgement may be lost' * 100
        path=root/'target.zip';path.write_bytes(data)
        item={'name':path.name,'path':str(path),'bytes':len(data),
              'mtime_ns':path.stat().st_mtime_ns,'sha256':hashlib.sha256(data).hexdigest()}
        bucket='https://zenodo.org/api/files/test-bucket'
        worker=uploader.Uploader('secret-test-token-value',[item],root/'audit')
        calls={'puts':0,'reads':0,'phases':[],'delays':0}
        parent=self
        class Response:
            def __init__(self,status):self.status=status
            def getheader(self,name,default=None):return default
            def read(self,maximum):
                return json.dumps({'size':len(data),'checksum':'md5:'+hashlib.md5(data).hexdigest()}).encode()
        class Connection:
            def __init__(self):self.body=bytearray()
            def putrequest(self,method,target):
                parent.assertEqual(method,'PUT');calls['puts']+=1
                if calls['puts']>1:parent.assertGreaterEqual(calls['reads'],2)
            def putheader(self,*args):pass
            def endheaders(self):pass
            def send(self,block):self.body.extend(block)
            def getresponse(self):
                parent.assertEqual(self.body,data)
                calls['phases'].append(worker.state['status'])
                if calls['puts']==1:
                    if server_error:return Response(503)
                    raise uploader.ssl.SSLEOFError('simulated lost acknowledgement')
                return Response(201)
            def close(self):pass
        def draft():
            calls['reads']+=1
            if remote_state=='unavailable':raise uploader.UploadError('Simulated inventory read failure.')
            pending=remote_state=='pending'
            checksum=hashlib.md5(data if remote_state=='completed' else b'other remote content').hexdigest()
            return {'id':uploader.RECORD_ID,'submitted':False,'state':'unsubmitted',
                    'metadata':{'prereserve_doi':{'doi':uploader.DOI}},'links':{'bucket':bucket},
                    'files':[{'name':item['name'],'size':0 if pending else len(data),
                              'checksum':'' if pending else checksum,
                              'status':'pending' if pending else 'completed'}]}
        def delay(*args):calls['delays']+=1
        worker.connection=Connection;worker.get_draft=draft;worker.delay=delay
        return worker,bucket,item,calls

    def test_lost_acknowledgement_recovers_without_retransmitting(self):
        with tempfile.TemporaryDirectory() as directory,redirect_stdout(io.StringIO()):
            worker,bucket,item,calls=self.interrupted_upload_fixture(Path(directory),'completed')
            worker.upload_one(bucket,item)
            self.assertEqual(calls['puts'],1)
            self.assertEqual(calls['phases'],['awaiting_confirmation'])
            self.assertEqual(worker.state['completed'],[item['name']])
            self.assertEqual(worker.receipts[item['name']]['action'],'recovered_verified')
            events=(worker.audit/'upload-events.jsonl').read_text()
            self.assertIn('SSLEOFError',events)
            self.assertNotIn('secret-test-token-value',events)

    def test_server_error_after_save_recovers_without_retransmitting(self):
        with tempfile.TemporaryDirectory() as directory,redirect_stdout(io.StringIO()):
            worker,bucket,item,calls=self.interrupted_upload_fixture(Path(directory),'completed',server_error=True)
            worker.upload_one(bucket,item)
            self.assertEqual(calls['puts'],1)
            self.assertEqual(worker.receipts[item['name']]['action'],'recovered_verified')

    def test_confirmed_pending_file_is_retried_and_verified(self):
        with tempfile.TemporaryDirectory() as directory,redirect_stdout(io.StringIO()):
            worker,bucket,item,calls=self.interrupted_upload_fixture(Path(directory),'pending')
            worker.upload_one(bucket,item)
            self.assertEqual(calls['puts'],2)
            self.assertEqual(calls['reads'],2)
            self.assertEqual(worker.state['completed'],[item['name']])
            self.assertEqual(worker.receipts[item['name']]['action'],'uploaded_verified')

    def test_late_commit_during_retry_delay_is_not_retransmitted(self):
        with tempfile.TemporaryDirectory() as directory,redirect_stdout(io.StringIO()):
            worker,bucket,item,calls=self.interrupted_upload_fixture(Path(directory),'completed')
            complete_draft=worker.get_draft
            def delayed_commit():
                draft=complete_draft()
                if calls['reads']==1:draft['files'][0].update(status='pending',size=0,checksum='')
                return draft
            worker.get_draft=delayed_commit
            worker.upload_one(bucket,item)
            self.assertEqual(calls['reads'],2)
            self.assertEqual(calls['puts'],1)
            self.assertEqual(worker.receipts[item['name']]['action'],'recovered_verified')

    def test_retry_stops_if_remote_file_differs_or_cannot_be_checked(self):
        for remote_state in ('different','unavailable'):
            with self.subTest(remote_state=remote_state),tempfile.TemporaryDirectory() as directory,redirect_stdout(io.StringIO()):
                worker,bucket,item,calls=self.interrupted_upload_fixture(Path(directory),remote_state)
                with self.assertRaises(uploader.UploadError):worker.upload_one(bucket,item)
                self.assertEqual(calls['puts'],1)
                self.assertEqual(worker.state['completed'],[])
                self.assertNotIn(item['name'],worker.receipts)

    @unittest.skipUnless(__import__('os').name=='nt','Windows uploader process lock')
    def test_second_upload_is_blocked_until_first_exits(self):
        with tempfile.TemporaryDirectory() as directory:
            first=uploader.acquire_upload_lock(Path(directory))
            try:
                with self.assertRaises(uploader.UploadError):uploader.acquire_upload_lock(Path(directory))
            finally:first.close()
            again=uploader.acquire_upload_lock(Path(directory))
            again.close()

    def native_fixture(self):
        url=uploader.MODERN_DRAFT+'/files'
        draft={'id':str(uploader.RECORD_ID),'is_draft':True,'is_published':False,
               'pids':{'doi':{'identifier':uploader.DOI}},'links':{'files':url}}
        inventory={'links':{'self':url},'entries':[
            {'key':'existing.zip','bucket_id':'12345678-1234-5678-9012-123456789012',
             'size':42,'checksum':'md5:'+'a'*32,'status':'completed'},
            {'key':'pending.zip','status':'pending'}]}
        return draft,inventory

    def test_native_inventory_preserves_completed_and_pending_entries(self):
        draft,inventory=self.native_fixture()
        result=uploader.normalize_modern_draft(draft,inventory)
        self.assertEqual(uploader.check_draft(result),
                         'https://zenodo.org/api/files/12345678-1234-5678-9012-123456789012')
        self.assertEqual(uploader.remote_files(result),
                         {'existing.zip':{'bytes':42,'md5':'a'*32,'status':'completed'},
                          'pending.zip':{'bytes':0,'md5':'','status':'pending'}})

    def test_pending_file_with_checksum_is_not_complete(self):
        self.assertFalse(uploader.remote_complete({'bytes':42,'md5':'a'*32,'status':'pending'}))
        self.assertTrue(uploader.remote_complete({'bytes':42,'md5':'a'*32,'status':'completed'}))

    def test_full_resume_skips_saved_files_and_preserves_extra_entry(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);files=[];remote={};contents={}
            for index in range(13):
                path=root/f'file-{index:02}.zip';data=b'x'*(index+1);path.write_bytes(data)
                item={'name':path.name,'path':str(path),'bytes':len(data),
                      'mtime_ns':path.stat().st_mtime_ns,'sha256':hashlib.sha256(data).hexdigest()}
                files.append(item);contents[path.name]=data
                remote[path.name]={'filename':path.name,'filesize':len(data) if index>=7 else 0,
                                  'checksum':hashlib.md5(data).hexdigest() if index>=7 else '',
                                  'status':'completed' if index>=7 else 'pending'}
            extra={'filename':'START_HERE.html','filesize':3,'checksum':hashlib.md5(b'abc').hexdigest(),'status':'completed'}
            remote['START_HERE.html']=extra.copy()
            calls=[]
            def draft():
                return {'id':uploader.RECORD_ID,'submitted':False,'state':'unsubmitted',
                        'metadata':{'prereserve_doi':{'doi':uploader.DOI}},
                        'links':{'bucket':'https://zenodo.org/api/files/test-bucket'},
                        'files':[x.copy() for x in remote.values()]}
            def worker(interrupt=False):
                w=uploader.Uploader('secret-test-token-value',files,root/'audit',scope='full-record',expected_files=files)
                w.get_draft=draft
                def put(bucket,item):
                    self.assertGreaterEqual(len(w.state['completed']),6)
                    if interrupt and len(calls)==1:raise OSError('simulated interrupted connection')
                    calls.append(item['name']);md5=hashlib.md5(contents[item['name']]).hexdigest()
                    remote[item['name']]={'filename':item['name'],'filesize':item['bytes'],'checksum':md5,'status':'completed'}
                    w.record_receipt(item,md5,'uploaded_verified')
                w.upload_one=put
                return w
            first=worker(interrupt=True)
            with redirect_stdout(io.StringIO()),self.assertRaises(OSError):first.run()
            self.assertEqual(calls,['file-00.zip'])
            resumed=worker()
            with redirect_stdout(io.StringIO()):resumed.run()
            self.assertEqual(calls,[f'file-{i:02}.zip' for i in range(7)])
            self.assertEqual(len(resumed.state['completed']),13)
            self.assertTrue(resumed.state['full_collection_verified'])
            self.assertEqual(resumed.state['extra_remote_files'],['START_HERE.html'])
            self.assertEqual(remote['START_HERE.html'],extra)
            inventory=json.loads((root/'audit/remote-inventory.json').read_text())
            self.assertEqual(inventory['expected_pending_files'],[])
            self.assertNotIn('secret-test-token-value',json.dumps(inventory))

    def test_native_inventory_rejects_other_records_publications_and_buckets(self):
        draft,inventory=self.native_fixture()
        for change in ({'id':'different'},{'is_draft':False},{'is_published':True},
                       {'pids':{'doi':{'identifier':'different'}}},{'links':{'files':'https://example.com/files'}}):
            with self.assertRaises(uploader.UploadError):
                uploader.normalize_modern_draft({**draft,**change},inventory)
        other=json.loads(json.dumps(inventory))
        other['entries'][1]['bucket_id']='99999999-1234-5678-9012-123456789012'
        with self.assertRaises(uploader.UploadError):uploader.normalize_modern_draft(draft,other)
        for entries in ([],inventory['entries']*2):
            with self.assertRaises(uploader.UploadError):
                uploader.normalize_modern_draft(draft,{**inventory,'entries':entries})
        with self.assertRaises(uploader.UploadError):
            uploader.normalize_modern_draft(draft,{**inventory,'links':{'self':'https://zenodo.org/api/records/1/draft/files'}})

    def test_native_get_draft_avoids_failing_legacy_serializer(self):
        with tempfile.TemporaryDirectory() as directory:
            worker=uploader.Uploader('test-secret-token-value',[],Path(directory))
            draft,inventory=self.native_fixture()
            calls=[]
            def get(url,stage,optional=False):
                calls.append(url)
                return draft if url==uploader.MODERN_DRAFT else inventory
            worker.get_native_json=get
            worker.get_legacy_draft=lambda:self.fail('Legacy API should not be called')
            with redirect_stdout(io.StringIO()):result=worker.get_draft()
            self.assertTrue(worker.native_api)
            self.assertEqual(calls,[uploader.MODERN_DRAFT,uploader.MODERN_DRAFT+'/files'])
            self.assertEqual(result['id'],uploader.RECORD_ID)

    def test_approved_replacement_is_exactly_scoped(self):
        with tempfile.TemporaryDirectory() as directory:
            worker=uploader.Uploader('test-secret-token-value', [], Path(directory))
            item={'name':'target.zip','bytes':6,'sha256':'new-sha'}
            worker.plan={'files':{'target.zip':{'previous':{'bytes':5,'md5':'previous-md5'},
                'replacement':{'bytes':6,'sha256':'new-sha'}}}}
            self.assertTrue(worker.authorized_replacement(item,{'bytes':5,'md5':'previous-md5'}))
            self.assertFalse(worker.authorized_replacement(item,{'bytes':5,'md5':'different-file'}))
            self.assertFalse(worker.authorized_replacement({**item,'name':'unrelated.zip'},{'bytes':5,'md5':'previous-md5'}))
            self.assertFalse(worker.authorized_replacement({**item,'sha256':'changed-local-file'},{'bytes':5,'md5':'previous-md5'}))

    def test_partial_update_preserves_other_remote_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);path=root/'target.zip';path.write_bytes(b'new data')
            item={'name':path.name,'path':str(path),'bytes':8,'mtime_ns':path.stat().st_mtime_ns,
                  'sha256':hashlib.sha256(b'new data').hexdigest()}
            other={'name':'unrelated.zip','filesize':25,'checksum':'a'*32}
            remote=[{'name':'target.zip','filesize':3,'checksum':hashlib.md5(b'old').hexdigest()},other]
            worker=uploader.Uploader('test-secret-token-value',[item],root/'audit',scope='record19-update',
                                     expected_files=[item,{'name':'unrelated.zip'}])
            worker.plan={'files':{'target.zip':{'previous':{'bytes':3,'md5':hashlib.md5(b'old').hexdigest()},
                'replacement':{'bytes':8,'sha256':item['sha256']}}}}
            worker.get_draft=lambda:{'id':uploader.RECORD_ID,'submitted':False,'state':'unsubmitted',
                'metadata':{'prereserve_doi':{'doi':uploader.DOI}},
                'links':{'bucket':'https://zenodo.org/api/files/test-bucket'},'files':[dict(x) for x in remote]}
            def put_one(bucket,entry):
                self.assertEqual(entry['name'],'target.zip')
                md5=hashlib.md5(b'new data').hexdigest()
                remote[0]={'name':'target.zip','filesize':8,'checksum':md5}
                worker.record_receipt(entry,md5,'uploaded_verified')
            worker.upload_one=put_one
            with redirect_stdout(io.StringIO()):worker.run()
            self.assertEqual(remote[1],other)
            self.assertEqual(worker.state['completed'],['target.zip'])
            self.assertEqual(worker.state['status'],'complete')
            self.assertFalse(worker.state['full_collection_verified'])

    def test_url_guard(self):
        self.assertEqual(uploader.guarded_url("https://zenodo.org/api/files/bucket/file.zip"), "/api/files/bucket/file.zip")
        for url in ("http://zenodo.org/api/files/a", "https://zenodo.org.evil.test/api/files/a",
                    "https://x@zenodo.org/api/files/a", "https://zenodo.org/api/files/a?token=bad",
                    "https://zenodo.org:8443/api/files/a"):
            with self.assertRaises(uploader.UploadError):
                uploader.guarded_url(url)

    def test_draft_identity_and_published_guard(self):
        draft = {"id": uploader.RECORD_ID, "submitted": False, "state": "unsubmitted",
                 "metadata": {"prereserve_doi": {"doi": uploader.DOI}},
                 "links": {"bucket": "https://zenodo.org/api/files/real-bucket"}}
        self.assertTrue(uploader.check_draft(draft).endswith("real-bucket"))
        for change in ({"submitted": True}, {"id": 123}, {"metadata": {}}):
            with self.assertRaises(uploader.UploadError):
                uploader.check_draft({**draft, **change})

    def test_source_enumeration_and_escape_guard(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            rows = []
            for index in range(10):
                name = "package-%s.zip" % index
                (root / name).write_bytes(b"sample")
                rows.append({"zip_filename": name, "local_zip_path": name, "zip_bytes": 6,
                             "sha256": hashlib.sha256(b"sample").hexdigest()})
            def write_index():
                with (root / "PACKAGE_INDEX.csv").open("w", newline="") as fh:
                    writer = csv.DictWriter(fh, fieldnames=list(rows[0]))
                    writer.writeheader()
                    writer.writerows(rows)
            write_index()
            (root / "UPLOAD_README.txt").write_text("readme")
            (root / "ARCHIVE_CHECKSUMS.sha256").write_text("checksums")
            self.assertEqual(len(uploader.collect_files(root)), 13)
            rows[0]["zip_bytes"] = 7
            write_index()
            with self.assertRaises(uploader.UploadError):
                uploader.collect_files(root)

    def test_streamed_upload_checksums_and_secret_not_logged(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "small.zip"
            data = b"meaningful-stream-test" * 100003
            path.write_bytes(data)
            item = {"name": path.name, "path": str(path), "bytes": len(data),
                    "mtime_ns": path.stat().st_mtime_ns, "sha256": hashlib.sha256(data).hexdigest()}
            received = bytearray()
            headers = {}
            class Response:
                status = 201
                def read(self, maximum):
                    return json.dumps({"size": len(received), "checksum": "md5:" + hashlib.md5(received).hexdigest()}).encode()
            class Connection:
                def putrequest(self, method, target):
                    self.method = method
                def putheader(self, key, value):
                    headers[key] = value
                def endheaders(self):
                    pass
                def send(self, block):
                    received.extend(block)
                def getresponse(self):
                    return Response()
                def close(self):
                    pass
            token = "secret-test-token-never-persist"
            worker = uploader.Uploader(token, [item], root / "audit")
            worker.connection = Connection
            with redirect_stdout(io.StringIO()) as output:
                worker.upload_one("https://zenodo.org/api/files/test-bucket", item)
            self.assertEqual(received, data)
            self.assertEqual(headers["Content-Length"], str(len(data)))
            self.assertEqual(worker.receipts[path.name]["md5"], hashlib.md5(data).hexdigest())
            self.assertNotIn(token, output.getvalue())
            for output_file in (root / "audit").iterdir():
                self.assertNotIn(token, output_file.read_text())


if __name__ == "__main__":
    unittest.main()
