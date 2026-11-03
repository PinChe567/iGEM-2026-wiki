"""Local token entry. Credentials stay in memory and go to the uploader via stdin."""
from pathlib import Path
import json
import os
import subprocess
import sys
import time
import tkinter as tk
from tkinter import ttk, messagebox
import webbrowser
from upload_to_zenodo import collect_files, selected_files, DEFAULT_ROOT

HERE = Path(__file__).resolve().parent
TOKEN_URL = 'https://zenodo.org/account/settings/applications/tokens/new/'
plan_path=HERE/'approved-replacements.json'
plan=json.loads(plan_path.read_text(encoding='utf-8')) if plan_path.exists() else None
upload_scope='full-record'
update_mode=False
upload_files=selected_files(collect_files(DEFAULT_ROOT),scope=upload_scope)
upload_count=len(upload_files)
upload_bytes=sum(item['bytes'] for item in upload_files)
file_sizes={item['name']:item['bytes'] for item in upload_files}
receipt_path=HERE/'upload-receipts.json'
previous_receipts=json.loads(receipt_path.read_text(encoding='utf-8')).get('files',{}) if receipt_path.exists() else {}
previous_verified=[item for item in upload_files if previous_receipts.get(item['name'],{}).get('verified')
                   and previous_receipts[item['name']].get('sha256')==item['sha256']
                   and previous_receipts[item['name']].get('bytes')==item['bytes']]
remaining_bytes=upload_bytes-sum(item['bytes'] for item in previous_verified)
root = tk.Tk()
root.title('AeroSense｜完整資料續傳（13 檔）')
root.geometry('790x720')
root.minsize(700, 550)
root.configure(bg='#f1f5f3')
# Present this app's newly created window prominently so it is easy to find.
root.attributes('-topmost', True)
root.after(15000, lambda: root.attributes('-topmost', False))
style = ttk.Style()
style.configure('TLabel', font=('Microsoft JhengHei', 11), background='#f1f5f3')
style.configure('TButton', font=('Microsoft JhengHei', 11), padding=8)
frame = ttk.Frame(root, padding=24)
frame.pack(fill='both', expand=True)
ttk.Label(frame, text='接續上傳完整資料：核對並補齊 13 個必需檔案', font=('Microsoft JhengHei', 17, 'bold')).pack(anchor='w')
ttk.Label(frame, text=f'DOI：10.5281/zenodo.23469212　｜　整套 {upload_bytes/1e9:.2f} GB\n上次紀錄已驗證 {len(previous_verified)}／{upload_count} 檔；連線後重新核對，預估尚需傳 {remaining_bytes/1e9:.2f} GB。', padding=(0, 10)).pack(anchor='w')
instructions = ('1. 先在瀏覽器停止原本卡住的上傳，避免同時傳同名檔案。\n'
                '2. 開啟下方授權頁，登入 Zenodo；找不到舊授權碼時建立新的一組。\n'
                '   Name 填 AeroSense upload，只勾 deposit:write，再按 Create。\n'
                '3. 複製新產生的完整授權碼，貼到下方，再按「開始上傳」。\n'
                '   授權碼不要貼到聊天室；原有 DOI 與草稿保持不變。')
ttk.Label(frame, text=instructions, wraplength=700, justify='left').pack(anchor='w', pady=(5, 10))
ttk.Button(frame, text='開啟 Zenodo 授權頁', command=lambda: webbrowser.open(TOKEN_URL)).pack(anchor='w')
ttk.Label(frame, text='授權碼僅暫存於此視窗記憶體，失敗可直接重試；完成或關閉後清除。', padding=(0, 14)).pack(anchor='w')
token = ttk.Entry(frame, show='●', font=('Consolas', 11))
token.pack(fill='x', pady=(0, 12))
status = tk.StringVar(value='等待授權碼。已完成檔案會核對後跳過；先傳較小的待傳檔案。')
ttk.Label(frame, textvariable=status, wraplength=700, justify='left').pack(anchor='w', pady=10)
progress = ttk.Progressbar(frame, mode='indeterminate')
progress.pack(fill='x', pady=8)
detail = tk.Text(frame, height=7, wrap='word', font=('Consolas', 10), state='disabled', relief='flat', bg='white')
detail.pack(fill='both', expand=True, pady=8)
bar = ttk.Frame(frame)
bar.pack(fill='x')
process = None
log_handle = None
last_content = None
run_started_at = None
session_secret = None

def show_detail(value):
    detail.configure(state='normal')
    detail.delete('1.0', 'end')
    detail.insert('end', value)
    detail.configure(state='disabled')

def start():
    global process, log_handle, run_started_at, session_secret
    if process is not None and process.poll() is None:
        return
    secret = token.get().strip() or session_secret
    if not secret or any(c.isspace() for c in secret):
        messagebox.showinfo('授權碼', '請貼上 Zenodo 產生的完整授權碼。')
        return
    uploader = HERE / 'upload_to_zenodo.py'
    if not uploader.is_file():
        status.set('上傳工具正在完成最後準備，請稍候再按一次。')
        return
    # Only nonsecret uploader messages are written to this log. The credential
    # is never put in arguments, environment variables, files or URLs.
    log_handle = (HERE/'uploader-console.log').open('a', encoding='utf-8')
    try:
        session_secret=secret
        run_started_at=time.time()
        process = subprocess.Popen([sys.executable, '-u', str(uploader), '--scope', upload_scope], cwd=HERE,
            stdin=subprocess.PIPE, stdout=log_handle, stderr=log_handle,
            text=True, encoding='utf-8', env={**os.environ, 'PYTHONUTF8':'1'},
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        process.stdin.write(secret+'\n')
        process.stdin.close()
    except Exception:
        status.set('無法啟動本機上傳程式，請回到聊天通知我。')
        log_handle.close()
        return
    finally:
        secret = None
        token.delete(0, 'end')
    begin.configure(state='disabled')
    token.configure(state='disabled')
    status.set('正在連線 Zenodo，確認原草稿後依序上傳。')
    progress.configure(mode='determinate',maximum=upload_bytes,value=0)
    (HERE/'window-started.json').write_text(json.dumps({'uploader_pid':process.pid,'credential_persisted':False}), encoding='utf-8')

def stop():
    if process is not None and process.poll() is None:
        if messagebox.askyesno('停止上傳', '停止目前這個檔案的上傳？已完成的檔案會保留，下次會核對後跳過。'):
            process.terminate()

def poll():
    global last_content, log_handle, session_secret
    p = HERE/'upload-progress.json'
    if p.exists() and run_started_at is not None:
        try:
            text = p.read_text(encoding='utf-8')
            data = json.loads(text)
            if data.get('updated_at_unix',0)>=run_started_at and text != last_content:
                last_content=text
                current=data.get('current') or {}
                done=len(data.get('completed', []))
                count=data.get('file_count',13)
                labels={'starting':'正在連線','checking_existing':'核對已上傳檔案',
                    'uploading':'正在上傳','retry_wait':'連線稍後重試',
                    'awaiting_confirmation':'資料已送出，等待 Zenodo 確認保存',
                    'checking_remote':'確認 Zenodo 是否已保存，避免重複傳送',
                    'complete':'本次範圍核對完成','failed':'需要處理，請回聊天通知我',
                    'interrupted':'已停止'}
                lines=[labels.get(data.get('status'), '正在準備'), f'必需檔案已保存並核對：{done} / {count}']
                if data.get('status')=='complete':
                    lines[0]='整套必需檔案核對完成' if data.get('full_collection_verified') else '僅本次更新範圍完成，整套資料尚未核對完成'
                extra=data.get('extra_remote_files',[])
                if extra:
                    lines.append('草稿另有額外項目（保持不動）：'+', '.join(extra))
                complete_bytes=sum(file_sizes.get(name,0) for name in data.get('completed',[]))
                in_flight=0 if current.get('name') in data.get('completed',[]) else current.get('sent_bytes',0)
                progress.configure(value=min(upload_bytes,complete_bytes+in_flight))
                if current.get('name'):
                    lines.append('目前檔案：'+current['name'])
                if current.get('bytes'):
                    sent=current.get('sent_bytes',0)
                    lines.append(f"本檔資料傳送：{sent/current['bytes']*100:.1f}%（{sent/1e6:.1f} / {current['bytes']/1e6:.1f} MB）")
                    if sent >= current['bytes'] and current.get('name') not in data.get('completed',[]):
                        lines.append('傳送 100% 尚未代表保存完成；須通過 Zenodo 的大小與校驗碼核對。')
                    if current.get('bytes_per_second'):
                        lines.append(f"傳輸速度：約 {current['bytes_per_second']/1e6:.1f} MB / 秒")
                if data.get('last_http_status'):
                    stage='上傳' if data.get('last_request_stage')=='upload_file' else '讀取草稿清單'
                    lines.append(f"最近一次{stage}回應：{data['last_http_status']}（不代表目前檔案已保存）")
                if data.get('error'):lines.append(data['error'])
                show_detail('\n'.join(lines))
        except (OSError, ValueError):
            pass
    if process is not None:
        code=process.poll()
        if code is not None and str(begin.cget('state'))=='disabled':
            progress.stop()
            begin.configure(state='normal')
            token.configure(state='normal')
            if log_handle: log_handle.close(); log_handle=None
            if code==0:
                session_secret=None
                begin.configure(text='開始上傳')
                status.set(f'13／13 個必需檔案已保存並核對。草稿中的額外項目另列下方；尚未 Publish。')
            else:
                begin.configure(text='重試上傳')
                status.set('上傳已停止；請回聊天通知我。此視窗仍保留授權，可直接重試，不必重貼。')
                try:
                    lines=(HERE/'uploader-console.log').read_text(encoding='utf-8').splitlines()
                    show_detail('\n'.join(lines[-10:]))
                except OSError: pass
    root.after(1500,poll)

def close():
    global session_secret
    if process is not None and process.poll() is None:
        messagebox.showinfo('上傳進行中', '請保留這個視窗。要停止上傳，請先按「停止上傳」。')
        return
    session_secret=None
    root.destroy()

begin = ttk.Button(bar,text='開始上傳',command=start)
begin.pack(side='left')
ttk.Button(bar,text='停止上傳',command=stop).pack(side='left',padx=8)
ttk.Label(frame,text='完成的檔案會保存並跳過；只補傳缺少或未完成的檔案。原有額外檔案保留；不會按 Publish。',wraplength=700).pack(anchor='w',pady=(12,0))
root.protocol('WM_DELETE_WINDOW',close)
root.after(1500,poll)
token.focus_set()
root.mainloop()
