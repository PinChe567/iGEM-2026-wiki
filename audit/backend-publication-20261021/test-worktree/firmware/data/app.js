let language=localStorage.getItem('aeroLanguage')||'zh',key='',latest=null,records=[],timer=null,currentMode=null,connected=false,deviceStatus=null,historyToken='',refreshing=false,pendingDelete=null;
const $=s=>document.getElementById(s);
const UI_REVISION='2026-10-21-continuous1',archive=AeroHistory.archive();
let selectedRecordId='',directDevice=false,archiveOK=archive.available,historyReady=Promise.resolve();
const visibleRecord=()=>selectedRecordId?records.find(r=>r.id===selectedRecordId)||null:latest;
const sessionContexts=new Map();let pendingRunContext=null;
try{for(const [k,c] of JSON.parse(localStorage.getItem('aeroSessionContexts')||'[]'))sessionContexts.set(k,c);}catch{}
function bindSession(st){if(!pendingRunContext||pendingRunContext.waitingForReply)return;if(pendingRunContext.requireAck){if(st.lastAck?.id!==pendingRunContext.commandId)return;if(!st.lastAck.ok){pendingRunContext=null;return;}}const k=AeroSession.key(st);if(!k||k===pendingRunContext.previousKey)return;sessionContexts.set(k,pendingRunContext.snapshot);pendingRunContext=null;try{localStorage.setItem('aeroSessionContexts',JSON.stringify([...sessionContexts].slice(-20)));}catch{message('correction_storage_full');}}
function savedSessionContext(r){if(!AeroSession.key(r))return null;return r.sessionContext||sessionContexts.get(AeroSession.key(r))||records.find(x=>AeroSession.key(x)===AeroSession.key(r)&&x.sessionContext)?.sessionContext||null;}
function storeRecord(r){if(!archive.available)return Promise.resolve();return archive.put(r).catch(()=>{archiveOK=false;storageNotice();});}
function storageNotice(){$('storageStatus').textContent=archiveOK?say('本瀏覽器會保存紀錄；請仍匯出備份。原始 CSV 最多保存最近 60 筆。','This browser saves records. Export a backup. Raw CSV is retained for up to 60 recent records.'):say('瀏覽器無法永久保存。此頁關閉前請匯出 JSON／CSV。','Browser storage is unavailable. Export JSON/CSV before closing this page.');}
function trimArchive(){while(records.length>1000){const old=records.shift();processedHistory=processedHistory.filter(x=>x.sourceRecordId!==old.id);if(archive.available)archive.remove(old.id).catch(()=>{});}const rawRecords=records.filter(r=>r.rawCsv);for(const r of rawRecords.slice(0,-60)){delete r.rawCsv;r.rawUnavailableReason='browser_raw_limit';storeRecord(r);}}
async function loadArchive(){if(!archive.available){storageNotice();return;}try{const saved=await archive.all();records=saved.filter(AeroHistory.validRecord);records.sort((a,b)=>a.bootId===b.bootId&&Number.isFinite(a.deviceTimeMs)&&Number.isFinite(b.deviceTimeMs)?a.deviceTimeMs-b.deviceTimeMs:String(a.receivedAt||'').localeCompare(String(b.receivedAt||'')));trimArchive();latest=records.at(-1)||null;}catch{archiveOK=false;}storageNotice();renderResult();}
function makeSnapshot(r){return {uiRevision:UI_REVISION,calibration:Object.fromEntries(Object.entries(cal).map(([k,rs])=>[k,rs.map(AeroHistory.measurement)])),measuredCalibration:{...AeroHistory.clone(correction),blank:correction.blank.map(AeroHistory.measurement),phase:correction.phase.map(AeroHistory.measurement)},normalization:AeroCalibration.normalize(r,cal),processing:processedHistory.findLast(x=>x.sourceRecordId===r.id)||null};}
function viewRecord(id){selectedRecordId=id;const r=visibleRecord();$('chartMode').value=r?.rawCsv?'raw':'mean';renderResult();$('resultsPanel').scrollIntoView({behavior:'smooth',block:'start'});}
async function fetchRawRecord(r){
 if(!r)throw Error('raw_unavailable');if(r.rawCsv)return r.rawCsv;
 if(!connected||!directDevice||deviceStatus?.rawRecordId!==r.id||!deviceStatus.rawAvailable)throw Error('raw_unavailable');
 const response=await fetch('/api/raw.csv?id='+encodeURIComponent(r.id),{headers:{'X-Aero-Key':key}});
 if(!response.ok)throw Error('raw_unavailable');const csv=await response.text();AeroHistory.parseRaw(csv,r);
 r.rawCsv=csv;delete r.rawUnavailableReason;trimArchive();await storeRecord(r);return csv;
}
async function captureLatestRaw(st){const ds=st.reportedDeviceStatus||st;
 if(st.reportedDeviceStatus||st.mode!=='hardware'||!ds.rawAvailable||ds.state==='measuring'||!latest||latest.rawCsv||ds.rawRecordId!==latest.id)return;
 try{await fetchRawRecord(latest);}catch(e){latest.rawUnavailableReason=e.message;}
}
function settingsText(r){if(!r)return '';const leds=[0,1,2,3].filter(j=>r.ledMask&(1<<j)).map(j=>'D'+(j+1)).join(', ')||say('全部關閉','All off');return [say('樣本：','Sample: ')+(r.conditionTag||'—'),say('LED：','LEDs: ')+leds,say('亮燈比例：','On-time: ')+r.dutyPercent+'%',say('取樣：','Acquisition: ')+r.samples+' / 8000 · '+r.sampleRateHz+' Hz',say('排程：','Schedule: ')+(r.blockIndex??'—')+' / '+(r.plannedBlocks??'—')+say(' 次；開始間隔 ','; start period ')+(r.periodSec??'—')+' s',say('記錄 ID：','Record ID: ')+r.id,say('韌體：','Firmware: ')+(r.firmwareRevision||'—'),say('當時註記：','Saved notes: ')+(r.notes||'—')].join('\n');}
function reportData(single=false){const view=visibleRecord(),rs=single&&view?[view]:records;return {schema:'aerosense-session-2',uiRevision:UI_REVISION,deviceStatus,selectedRecordId:view?.id||null,exportScope:single?'Selected record with saved settings, processing snapshot and captured raw CSV.':'Browser archive; raw CSV is included only when actually captured.',exported:new Date().toISOString(),notes:$('notes').value,calibration:cal,normalizationReferenceRecords,measuredCalibration:correction,measuredCalibrationHistory:correctionHistory,measuredProcessing:processedHistory.filter(x=>rs.some(r=>r.id===x.sourceRecordId)),records:rs.map(r=>({...r,browserReview:AeroHistory.review(r),normalization:r.viewSnapshot?.normalization||r.normalization||null}))};}
function exportReport(single=false){download(JSON.stringify(reportData(single),null,2),'application/json',AeroHistory.filename(visibleRecord(),single?'report':'session','json'));}
async function importReport(data){await historyReady;const incoming=AeroHistory.importSession(data);
 for(const r of incoming){const old=records.find(x=>x.id===r.id);if(old){const fields=new Set([...Object.keys(odorMeasurement(old)),...Object.keys(odorMeasurement(r)),'meanV','rmsV']);
 if([...fields].some(k=>old[k]!==undefined&&r[k]!==undefined&&JSON.stringify(old[k])!==JSON.stringify(r[k])))throw Error('import_conflict');
 const a=AeroSession.context(old.sessionContext||old.viewSnapshot),b=AeroSession.context(r.sessionContext||r.viewSnapshot);
 if(a&&b&&JSON.stringify(a)!==JSON.stringify(b))throw Error('import_conflict');}}
 for(const r of incoming){const old=records.find(x=>x.id===r.id);if(old){if(!old.rawCsv&&r.rawCsv)old.rawCsv=r.rawCsv;for(const k of Object.keys(odorMeasurement(r)))if(old[k]===undefined)old[k]=r[k];if(!old.sessionContext&&r.sessionContext)old.sessionContext=AeroHistory.clone(r.sessionContext);if((!old.viewSnapshot||old.viewSnapshot.legacy)&&r.viewSnapshot&&!r.viewSnapshot.legacy)old.viewSnapshot=AeroHistory.clone(r.viewSnapshot);if(!old.sessionAnalysis&&r.sessionAnalysis)old.sessionAnalysis=AeroHistory.clone(r.sessionAnalysis);if(!old.odorAnalysis&&r.odorAnalysis)old.odorAnalysis=AeroHistory.clone(r.odorAnalysis);await storeRecord(old);}else{records.push(r);await storeRecord(r);}}
 trimArchive();if(incoming.length)viewRecord(incoming.at(-1).id);$('historyPanel').open=true;message(say(`已載入 ${incoming.length} 筆；相同紀錄不重複加入。`,`Loaded ${incoming.length} records. Duplicate IDs are merged.`));return incoming.length;
}
let cal={dark:[],baseline:[],reference:[]};try{const saved=JSON.parse(localStorage.getItem('aeroCal')||'null');if(saved&&['dark','baseline','reference'].every(k=>Array.isArray(saved[k])))cal=saved;}catch{}
const normalizationReferenceRecords=Object.fromEntries([...cal.dark,...cal.baseline,...cal.reference].map(r=>[r.id,JSON.parse(JSON.stringify(r))]));
const newCalibrationId=()=>globalThis.crypto?.randomUUID?.()||`cal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
let correction=AeroCorrection.create('',newCalibrationId()),correctionHistory={},correctionCapture=null;
try{const x=JSON.parse(localStorage.getItem('aeroCorrection')||'null');if(x?.version===AeroCorrection.VERSION&&Array.isArray(x.blank)&&Array.isArray(x.phase))correction=x;const h=JSON.parse(localStorage.getItem('aeroCorrectionHistory')||'{}');if(h&&typeof h==='object'&&!Array.isArray(h))correctionHistory=h;}catch{}
const processor=new AeroCorrection.Processor();let processedHistory=[],lastProcessingKey='';
function saveCorrection(){correctionHistory[correction.id]=JSON.parse(JSON.stringify(correction));try{localStorage.setItem('aeroCorrection',JSON.stringify(correction));localStorage.setItem('aeroCorrectionHistory',JSON.stringify(correctionHistory));}catch{message('correction_storage_full');}}
function resetCorrection(reason){saveCorrection();const context=$('correctionContext').value.trim(),tau=Number($('correctionTau').value);correction=AeroCorrection.create(context,newCalibrationId());correction.tauSec=Number.isFinite(tau)?tau:2;correctionCapture=null;processor.reset();lastProcessingKey='';$('enableCorrection').checked=false;saveCorrection();drawCal();if(reason)message(reason);}
function captureCorrectionBlock(stage){const e=AeroCorrection.captureError(latest,correction,stage);if(e)throw Error(human(e));correction[stage].push(AeroHistory.measurement(latest));saveCorrection();}
function measuredNormalization(){return correction.enabled?AeroCorrection.normalize(latest,cal,correction):AeroCalibration.normalize(latest,cal);}
function drawCorrection(){
 $('correctionStatus').textContent=(language==='zh'?`亮燈空白 ${correction.blank.length}/5 · 螢光相位參考 ${correction.phase.length}/5 · `:`Illuminated blank ${correction.blank.length}/5 · Phase reference ${correction.phase.length}/5 · `)+(correction.enabled?(language==='zh'?'已啟用':'enabled'):(language==='zh'?'關閉':'off'));
 const d=processor.update(latest,correction);
 if(d.error){$('corrected').textContent=human(d.error);return;}
 $('corrected').textContent=d.channels.map((v,j)=>{const sm=d.smoothed?.channels[j],fmt=x=>x===null?'—':(x*1000).toFixed(4);return `D${j+1} | ${language==='zh'?'背景扣除幅度':'blank-corrected magnitude'} ${fmt(v.amplitudeV)} mV | ${language==='zh'?'有號投影':'signed projection'} ${fmt(v.projectionV)} mV | EMA(τ=${correction.tauSec}s) ${fmt(sm?.projectionV??null)} mV${v.phaseReferenceError?' · '+human(v.phaseReferenceError):v.warning?' · '+human(v.warning):''}`;}).join('\n');
 const pk=JSON.stringify([latest.id,correction.id,correction.tauSec,correction.blank.map(x=>x.id),correction.phase.map(x=>x.id)]);
 if(pk!==lastProcessingKey){processedHistory.push({sourceRecordId:latest.id,processedAt:new Date().toISOString(),...d,normalization:AeroCorrection.normalize(latest,cal,correction)});lastProcessingKey=pk;}
}
const errorZH={invalid_measurement:'目前沒有有效量測；請先完成一組。',need_5_dark_and_5_baseline:'需要 5 組有效暗訊號與 5 組有效基線。',normalization_requires_all_LEDs:'目前為暗訊號或單燈測試；正規化需要 D1–D4 全開。',calibration_conditions_changed:'校正條件已改變，請清除後重做。',invalid_calibration_records:'校正資料無效，請清除後重做。',baseline_below_noise:'基線太接近雜訊，不能可靠相除。',reference_response_below_noise:'標準刺激反應太小。',valid_result_required:'只能加入有效的完整量測組。',dark_requires_all_LEDs_off:'暗訊號需要選擇 Dark／全關。',baseline_and_reference_require_all_LEDs:'基線與標準刺激需要選擇 D1–D4。',block_already_added:'這一組已加入，請等待下一組。',clear_calibration_after_conditions_change:'裝置或條件改變，請清除校正。',board_not_validated:'實板檢查鎖定：目前只允許暗訊號。',ADC_rail:'ADC 接近上下限；不可視為可靠訊號。',sample_timing_or_overrun:'取樣時序失敗；請保存記錄並檢查。',sample_jitter:'取樣時間抖動超標。',upload_queue_full:'上傳佇列已滿，請恢復網路再量測。',session_stopped_partial_block_discarded:'已停止；進行中的不完整組未保留。'};
Object.assign(errorZH,{ADC_constant:'8,000 筆 ADC 讀值完全相同，無法確認感光；請檢查 ADC 供電、訊號線與讀取。',raw_record_changed:'原始資料屬於另一筆量測，未儲存。',raw_invalid:'原始 CSV 不完整或格式不正確。',import_invalid:'無法辨識此 AeroSense JSON，或紀錄格式不完整。',import_conflict:'同一紀錄 ID 的內容不同，已停止匯入。'});
const errorEN={invalid_measurement:'No valid measurement yet. Complete one block first.',need_5_dark_and_5_baseline:'Collect 5 valid dark blocks and 5 valid baseline blocks.',normalization_requires_all_LEDs:'This is a dark or single-LED test. Normalization requires all four LEDs (D1–D4).',calibration_conditions_changed:'Calibration conditions changed. Clear calibration and repeat it.',invalid_calibration_records:'Calibration records are invalid. Clear calibration and repeat it.',baseline_below_noise:'The baseline is too close to noise for reliable division.',reference_response_below_noise:'The reference response is too small for reliable normalization.',valid_result_required:'Only a valid, complete measurement block can be added.',dark_requires_all_LEDs_off:'Choose Dark / all LEDs off before collecting dark blocks.',baseline_and_reference_require_all_LEDs:'Choose D1–D4 before collecting baseline or reference blocks.',block_already_added:'This block was already added. Wait for the next block.',clear_calibration_after_conditions_change:'The device or measurement conditions changed. Clear calibration first.',board_not_validated:'Bring-up lock: only dark measurements are allowed until the board is validated.',ADC_rail:'The ADC is near its lower or upper limit. The signal is not reliable.',sample_timing_or_overrun:'Sampling timing failed. Save the record and investigate.',sample_jitter:'Sampling time jitter exceeded the allowed limit.',upload_queue_full:'The upload queue is full. Restore the network before measuring again.',session_stopped_partial_block_discarded:'Stopped. The incomplete block in progress was discarded.'};
Object.assign(errorEN,{ADC_constant:'All 8,000 ADC codes are identical. Light response is unconfirmed. Check ADC power, signal connections and readout.',raw_record_changed:'Raw data belongs to a different measurement and was not saved.',raw_invalid:'Raw CSV is incomplete or invalid.',import_invalid:'This is not a supported AeroSense report, or its records are incomplete.',import_conflict:'An existing record ID has different contents. Import stopped.'});
Object.assign(errorZH,{correction_off:'實測背景校正未啟用；原始訊號保留。',correction_context_required:'先輸入條件代碼；換 well、液量、濾片或細胞條件後改代碼並重做。',correction_valid_all_LED_block_required:'需要全四燈、無截波且時序有效的完整量測。',correction_firmware_metadata_required:'需要新版韌體的開機識別、取樣設定與裝置時間；舊資料仍可看原始值。',correction_conditions_changed:'背景校正條件或裝置開機已改變，請重做亮燈空白與相位參考。',correction_collect_blank_first:'先完成 5 組亮燈空白。',correction_need_5_blank:'需要至少 5 組有效亮燈空白。',correction_invalid_calibration:'背景校正記錄無效或重複，請重新收集。',correction_need_5_phase:'尚無 5 組有效螢光相位參考；保留扣背景幅度。',correction_phase_reference_below_noise:'螢光參考太弱，不能設定可靠相位；保留扣背景幅度。',correction_need_5_living_baseline:'請放入未受刺激細胞，再收集 5 組 F0 基線。',correction_recollect_living_baseline:'背景／相位校正已改變；重新收集細胞 F0 與標準刺激。',correction_invalid_tau:'τ 請填 0–120 秒；0 表示不平滑。',correction_nonmonotonic_time:'裝置時間不是遞增；平滑已停止，請重新連線並檢查資料。',phase_deviation_gt_15deg:'相位偏離參考超過 15°；請檢查，勿只相信投影值。',correction_storage_full:'瀏覽器儲存失敗，請立即匯出 JSON。',correction_capture_complete:'已收集 5 組；確認樣本條件，再進行下一步。',correction_capture_started:'正在收集 5 組，請保持此頁開啟。',correction_connect_first:'請先連線。',correction_model_feature_mismatch:'新校正的特徵未對應現有研究模型；請匯出後以相同流程重新訓練／驗證。'});
Object.assign(errorEN,{correction_off:'Measured correction is off; raw signals are retained.',correction_context_required:'Enter a condition ID. Change it and recalibrate after changing wells, fill, filters or sample conditions.',correction_valid_all_LED_block_required:'A complete valid four-LED block with no clipping or timing failure is required.',correction_firmware_metadata_required:'Correction requires new firmware boot ID, acquisition metadata and device time. Older raw values remain usable.',correction_conditions_changed:'The calibration conditions or device boot changed. Recollect illuminated blank and phase reference.',correction_collect_blank_first:'Collect five illuminated blank blocks first.',correction_need_5_blank:'At least five valid illuminated blank blocks are required.',correction_invalid_calibration:'Calibration records are invalid or duplicated. Collect them again.',correction_need_5_phase:'Five valid fluorescence-reference blocks are still needed. Corrected magnitude remains available.',correction_phase_reference_below_noise:'Fluorescence reference is too weak to define phase. Corrected magnitude remains available.',correction_need_5_living_baseline:'Insert unstimulated cells and collect five F0 baseline blocks.',correction_recollect_living_baseline:'Blank or phase calibration changed. Recollect living-cell F0 and reference stimulus.',correction_invalid_tau:'Enter τ between 0 and 120 seconds; 0 disables smoothing.',correction_nonmonotonic_time:'Device timestamps are not increasing. Smoothing stopped; reconnect and inspect records.',phase_deviation_gt_15deg:'Phase differs by more than 15 degrees. Investigate; do not rely only on the projection.',correction_storage_full:'Browser storage failed. Export JSON now.',correction_capture_complete:'Five blocks captured. Verify sample conditions before the next step.',correction_capture_started:'Collecting five blocks. Keep this page open.',correction_connect_first:'Connect first.',correction_model_feature_mismatch:'The new corrected features do not match the existing research model. Export and retrain/validate with the same preprocessing.'});
const human=s=>(language==='zh'?errorZH: errorEN)[s]||s;
function captureBlock(stage){if(selectedRecordId)throw Error(say('請先回到最新結果，再加入校正。','Return to the latest result before calibration.'));const e=AeroCalibration.addError(latest,cal,stage);if(e)throw Error(human(e));const snapshot={...AeroHistory.measurement(latest),...(correction.enabled?{captureCorrectionId:correction.id,captureContext:correction.context}:{})};cal[stage].push(snapshot);normalizationReferenceRecords[snapshot.id]=JSON.parse(JSON.stringify(snapshot));save();}

function translate(){document.querySelectorAll('[data-zh]').forEach(e=>e.textContent=e.dataset[language]);$('lang').textContent=language==='zh'?'English':'繁體中文';document.documentElement.lang=language==='zh'?'zh-Hant':'en';}
function message(s){$('error').textContent=human(s);}
async function api(path,body){const r=await fetch(path,{method:body?'POST':'GET',headers:{'X-Aero-Key':key,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});if(!r.ok){let s=await r.text();try{const e=JSON.parse(s);if(e.error)s=human(e.error);}catch{}throw new Error(s.slice(0,180));}return r.json();}
function save(){localStorage.setItem('aeroCal',JSON.stringify(cal));drawCal();}
function drawCal(){
 $('cal').textContent=`Dark: ${cal.dark.length} / 5 · Baseline: ${cal.baseline.length} / 5 · Reference: ${cal.reference.length} / 5`;
 const norm=measuredNormalization();
 $('normalized').textContent=norm.error?human(norm.error):norm.channels.map(x=>x.error?`D${x.channel}: ${human(x.error)}`:`D${x.channel}: ΔF/F0 = ${x.deltaFOverF0.toFixed(4)} · Ref = ${x.referenceNormalized===null?'—':x.referenceNormalized.toFixed(4)}${x.referenceError?` (${human(x.referenceError)})`:''}`).join(' | ');
 drawCorrection();
}
const say=(zh,en)=>language==='zh'?zh:en;
Object.assign(errorZH,{adc_diagnostic_busy:'ADC 診斷進行中，請等候完成。',end_schedule_before_diagnostic:'請先結束排程，再執行 ADC 診斷。'});
Object.assign(errorEN,{adc_diagnostic_busy:'ADC diagnostics are running. Wait until they finish.',end_schedule_before_diagnostic:'End the schedule before running ADC diagnostics.'});
Object.assign(errorZH,{authentication_required:'控制密碼不正確，請使用 config 中的 API_KEY。',busy:'裝置正在量測。請等候完成。',no_active_schedule:'目前沒有可暫停的排程。',no_paused_schedule:'目前沒有可繼續的排程。',end_schedule_before_delete:'請先在進階設定結束排程，再刪除紀錄。',invalid_settings:'請檢查次數、間隔、LED 與亮燈比例。',raw_unavailable:'目前沒有原始 ADC 資料。請完成一次量測。'});
Object.assign(errorEN,{authentication_required:'The control password is incorrect. Use API_KEY from the configuration.',busy:'The device is measuring. Wait until it finishes.',no_active_schedule:'There is no active schedule to pause.',no_paused_schedule:'There is no paused schedule to resume.',end_schedule_before_delete:'End the schedule in Advanced settings before deleting records.',invalid_settings:'Check the count, period, LED selection and on-time.',raw_unavailable:'No raw ADC data is available. Complete a measurement first.'});
function settings(){
 const continuous=$('runMode').value==='continuous',durationSec=Number($('durationSec').value),repeat=$('runMode').value==='repeat',blocks=continuous?durationSec/2:repeat?Number($('blocks').value):1,periodSec=continuous?2:repeat?Math.round(Number($('periodMinutes').value)*60):5;
 const dutyPercent=Number($('duty').value),ledMask=Number($('mask').value);
 if(!Number.isInteger(blocks)||blocks<1||blocks>60||!Number.isFinite(periodSec)||periodSec<(continuous?2:5)||periodSec>3600||(continuous&&(!Number.isInteger(durationSec)||durationSec<10||durationSec>120||durationSec%2))||!Number.isInteger(dutyPercent)||dutyPercent<1||dutyPercent>50||![0,1,2,4,8,15].includes(ledMask))throw Error(human('invalid_settings'));
 return {blocks,periodSec,dutyPercent,ledMask,conditionTag:$('conditionTag').value.trim(),...(continuous?{acquisitionMode:'continuous',durationSec}:{})};
}
function scheduleSummary(){
 const repeat=$('runMode').value==='repeat',continuous=$('runMode').value==='continuous';$('repeatSettings').hidden=!repeat;$('continuousSettings').hidden=!continuous;
 try{const c=settings();$('scheduleSummary').textContent=continuous?say(`連續取樣 ${c.durationSec} 秒，每 2 秒更新四受器曲線，整段存成一次量測。`,`Acquire continuously for ${c.durationSec} s. Update all four receptors every 2 s and save as one session.`):repeat?say(`每 ${c.periodSec} 秒開始一次，共 ${c.blocks} 次。每次取樣 2 秒，其餘時間關燈。預計約 ${(c.blocks-1)*c.periodSec+2} 秒完成。`,`Start every ${c.periodSec} s, for ${c.blocks} measurements. Each takes 2 s. LEDs are off between measurements. About ${(c.blocks-1)*c.periodSec+2} s in total.`):say('單次取樣 2 秒，完成後自動關燈。','Measure for 2 s, then turn the LEDs off.');}catch(e){$('scheduleSummary').textContent=e.message;}
}
function plotRaw(r){
 const c=$('plot');c.width=Math.max(300,c.clientWidth||1000);const ctx=c.getContext('2d');c.hidden=false;$('plotEmpty').hidden=true;ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#617181';ctx.font='14px system-ui';
 $('plotHelp').textContent=say('原始 ADC 波形：橫軸為秒，縱軸為 ADC 輸入電壓 V。失敗紀錄也可查看，不代表訊號有效。','Raw ADC waveform: seconds on X, ADC input voltage in V on Y. Failed records remain viewable and are not valid measurements.');
 if(!r?.rawCsv){c.hidden=true;$('plotEmpty').hidden=false;$('plotEmpty').textContent=say('此筆沒有保存原始 CSV，無法重建逐點波形。','No saved raw CSV for this record. A waveform cannot be reconstructed.');return;}
 let samples;try{samples=AeroHistory.parseRaw(r.rawCsv,r);}catch(e){ctx.fillText(human(e.message),30,140);return;}
 const vs=samples.map(x=>x.voltage),low=Math.min(...vs),high=Math.max(...vs),pad=Math.max(.0001,(high-low)*.1),lo=low-pad,hi=high+pad,span=hi-lo,end=Math.max(1,samples.at(-1).timeUs);
 for(let k=0;k<=4;k++){const y=30+k*50;ctx.strokeStyle='#e6ebef';ctx.beginPath();ctx.moveTo(90,y);ctx.lineTo(c.width-20,y);ctx.stroke();ctx.fillText((hi-k*span/4).toFixed(5),3,y+4);}
 ctx.strokeStyle=AeroHistory.review(r).usable?'#168b80':'#b25822';ctx.lineWidth=1;ctx.beginPath();samples.forEach((s,i)=>{const x=90+s.timeUs/end*(c.width-110),y=30+(hi-s.voltage)/span*200;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.stroke();ctx.fillText('V',5,15);ctx.fillText('0 s',90,278);ctx.fillText((end/1e6).toFixed(3)+' s',c.width-85,278);
}
function plot(){
 if($('chartMode').value==='raw'){plotRaw(visibleRecord());return;}
 const c=$('plot');c.width=Math.max(300,c.clientWidth||1000);c.hidden=false;$('plotEmpty').hidden=true;const ctx=c.getContext('2d'),colors=['#168b80','#6b61b7','#b66a28','#3575b0'],mean=$('chartMode').value==='mean',rs=selectedRecordId?[visibleRecord()].filter(Boolean):records.slice(-90),w=c.width,h=c.height;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.font='14px system-ui';ctx.fillStyle='#617181';
 $('plotHelp').textContent=mean?say('橫軸：依量測順序排列。縱軸：ADC 平均電壓（V）。遮光與照光請比較這張圖。無效紀錄不畫成有效訊號。','X: measurement order. Y: mean ADC voltage (V). Use this view to compare covered and illuminated PD measurements. Invalid records are not plotted as valid signals.'):say('橫軸：依量測順序排列。縱軸：LED 頻率振幅（mV）。尚未扣背景，也未換算濃度；未啟用的 LED 通道不畫。','X: measurement order. Y: LED-frequency amplitude (mV). Values have no background subtraction or concentration conversion. Inactive LED channels are not plotted.');
 const value=(r,j)=>!AeroHistory.review(r).usable?null:mean?(Number.isFinite(r.meanV)?r.meanV:null):((r.ledMask&(1<<j))?r.amplitudeV[j]*1000:null);
 const values=rs.flatMap(r=>Array.from({length:mean?1:4},(_,j)=>value(r,j))).filter(x=>x!==null&&Number.isFinite(x));
 if(!values.length){c.hidden=true;$('plotEmpty').hidden=false;$('plotEmpty').textContent=say('這裡沒有可判讀的量測，因此不繪製有效訊號。原始資料仍保留在報告。','No interpretable measurement is available for this chart. Raw results remain in the report.');return;}
 let lo=mean?Math.min(...values):0,hi=Math.max(...values),span=Math.max(hi-lo,mean?.002:.001);lo=Math.max(0,lo-span*.15);hi+=span*.15;span=hi-lo;
 ctx.strokeStyle='#e6ebef';ctx.lineWidth=1;
 for(let k=0;k<=4;k++){const y=35+k*52;ctx.beginPath();ctx.moveTo(78,y);ctx.lineTo(w-25,y);ctx.stroke();ctx.fillText((hi-k*span/4).toFixed(mean?4:3),5,y+5);}
 ctx.fillText(mean?'V':'mV',5,17);
 for(let j=0;j<(mean?1:4);j++){ctx.strokeStyle=colors[j];ctx.fillStyle=colors[j];ctx.lineWidth=2;ctx.beginPath();let pen=false;rs.forEach((r,i)=>{const v=value(r,j),x=80+i/Math.max(1,rs.length-1)*(w-110);if(v===null){pen=false;return;}const y=35+(hi-v)/span*208;if(pen)ctx.lineTo(x,y);else ctx.moveTo(x,y);ctx.fillRect(x-3,y-3,6,6);pen=true;});ctx.stroke();}
 ctx.fillStyle='#617181';ctx.fillText(say('第 1 筆','Record 1'),78,280);ctx.fillText(String(rs.length),w-42,280);
}
function addRecord(r,recovered=false){
 if(!r||records.some(x=>x.id===r.id))return false;
 records.push({...r,conditionTag:r.conditionTag??(recovered?'':$('conditionTag').value.trim()),notes:recovered?'':$('notes').value,receivedAt:new Date().toISOString(),recoveredFromDeviceHistory:recovered});
 const saved=records.at(-1),ctx=savedSessionContext(saved);if(ctx)saved.sessionContext=AeroHistory.clone(ctx);saved.viewSnapshot=ctx?{...AeroHistory.clone(ctx),uiRevision:UI_REVISION}:recovered?{legacy:true,normalization:null,processing:null}:makeSnapshot(saved);storeRecord(saved);trimArchive();return true;
}
async function recoverHistory(st){
 const ds=st.reportedDeviceStatus||st,token=(ds.historyLatestId||st.latest?.id||'')+'|'+(ds.historyCompleteAvailable===false?'partial':ds.state);
 if((ds.state==='measuring'&&ds.acquisitionMode!=='continuous')||!token.split('|')[0]||token===historyToken)return;
 try{const rs=await api('/api/history');if(Array.isArray(rs)){rs.forEach(r=>addRecord(r,true));historyToken=token;}}catch{/* Status and JSON already received remain usable on older firmware. */}
}
function renderResult(){
 const r=visibleRecord(),review=AeroHistory.review(r),good=review.usable,flat=review.constantCode;
 $('viewLabel').textContent=selectedRecordId?say('正在查看歷史紀錄：','Viewing saved record: ')+(r?.conditionTag||r?.id||'—'):say('最近一次結果','Latest result');
 $('returnLive').hidden=!selectedRecordId;$('applySettings').hidden=!selectedRecordId;$('applySettings').disabled=!!deviceStatus?.remaining;
 $('recordSettings').textContent=settingsText(r);
 $('qc').textContent=!r?say('尚無結果','No result'):flat?say('讀值固定，需檢查','Constant reading — check ADC'):good?say('取樣完整','Complete acquisition'):say('不能判讀','Cannot interpret');
 $('qc').className='badge'+(r?(good?' good':' bad'):'');
 $('mean').textContent=(good||flat)&&Number.isFinite(r.meanV)?r.meanV.toFixed(5)+' V':'—';$('sampleCount').textContent=r?`${r.samples??0} / 8,000`:'—';$('recordCount').textContent=String(records.length);
 $('analysis').textContent=!r?say('完成量測或載入 JSON 後，這裡會顯示結果。','Complete a measurement or load a JSON report to see results.'):flat?say(`本次 8,000 筆 ADC 全部固定為 ${r.adcMin}。${r.meanV.toFixed(5)} V 是此代碼的換算值，不能據此確認 PD 已感光。舊韌體的 valid=true 僅通過舊版檢查；此筆不可用於校正。`,`All 8,000 ADC codes equal ${r.adcMin}. ${r.meanV.toFixed(5)} V is the converted code, not proof of PD response. An older valid=true field passed the old checks only. Do not use this record for calibration.`):!good?say(`本次只有 ${r.samples??0} 筆或未通過檢查，不能確認 PD 感光。${human(r.error||'invalid_measurement')}`,`This record has ${r.samples??0} samples or failed checks. PD response is unconfirmed. ${human(r.error||'invalid_measurement')}`):r.mode==='demo'?say('這是示範資料，不能作為 PD 或細胞實驗結果。','These are demonstration data, not PD or cell results.'):r.ledMask===0?say('已取得完整 LED 全關紀錄。比較相同設定下遮光、弱光、再次遮光的電壓；重複變化才支持感光反應。','A complete LEDs-off record is available. Compare covered, weakly illuminated and covered-again readings at the same settings. Repeatable changes support light response.'):say('取樣檢查通過，尚未證明螢光。請比較相同設定的空白與樣本；藍光漏光也可能產生訊號。','Acquisition checks passed; fluorescence is not established. Compare blank and sample at identical settings. Blue-light leakage can also produce a signal.');
 $('channels').replaceChildren(...[0,1,2,3].map(j=>{const e=document.createElement('div');e.className='channel';const l=document.createElement('span');l.textContent=`D${j+1} · ${[41,67,89,113][j]} Hz`;const n=document.createElement('strong');n.textContent=good&&(r.ledMask&(1<<j))?(r.amplitudeV[j]*1000).toFixed(3)+' mV':'—';e.append(l,n);return e;}));
 $('diagnosticText').textContent=r?JSON.stringify({...r,rawCsv:r.rawCsv?say('已保存；請使用 CSV 或 JSON 匯出查看。','Saved; export CSV or JSON to inspect.'):undefined,browserReview:review},null,2):say('尚無資料。','No data.');
 $('historyRows').replaceChildren(...records.slice().reverse().map((item,i)=>{const tr=document.createElement('tr');tr.className=item.id===selectedRecordId?'selected-record':'';const q=AeroHistory.review(item);[records.length-i,item.conditionTag||'—',q.constantCode?say('固定值','Constant'):q.usable?say('完整','Complete'):say('無效','Invalid'),Number.isFinite(item.meanV)?item.meanV.toFixed(5):'—',item.samples??'—'].forEach(v=>{const td=document.createElement('td');td.textContent=String(v);tr.append(td);});const td=document.createElement('td'),button=document.createElement('button');button.className='secondary';button.textContent=say('查看','View');button.onclick=()=>viewRecord(item.id);td.append(button);tr.append(td);return tr;}));
 const rawReady=!!r?.rawCsv,rawFetchable=connected&&directDevice&&deviceStatus?.rawAvailable&&deviceStatus.rawRecordId===r?.id;
 $('raw').disabled=!rawReady&&!rawFetchable;
 $('rawHelp').textContent=rawReady?say('此筆原始 CSV 已保存。匯出檔名使用當次樣本名稱與紀錄 ID。JSON 同時保留當時設定與已保存的原始 CSV。','Raw CSV is saved for this record. Filenames use its saved sample name and record ID. JSON retains saved settings and captured raw CSV.'):say('此筆尚無原始 CSV。直連裝置且此筆仍是最近一次時可以下載；舊摘要無法補出原始波形。','No raw CSV is saved for this record. It can be fetched only while it remains the latest record on the directly connected device. Old summaries cannot recreate raw waveforms.');
 const snapshot=r?.viewSnapshot,norm=snapshot?.normalization;$('savedProcessing').textContent=flat?human('ADC_constant'):!snapshot?say('沒有當時的校正快照。','No saved calibration snapshot.'):(snapshot.legacy?say('舊檔沒有當時校正快照；僅顯示檔案已保存的分析。\n','This old file has no calibration snapshot. Only saved analysis is shown.\n'):'')+(norm?.error?human(norm.error):norm?.channels?norm.channels.map(x=>x.error?`D${x.channel}: ${human(x.error)}`:`D${x.channel}: ΔF/F0 = ${x.deltaFOverF0.toFixed(4)}`).join('\n'):say('尚無正規化結果。','No normalization result.')); 
 drawCal();plot();storageNotice();renderOdor();
}
function renderStatus(st){
 const ds=st.reportedDeviceStatus||st;deviceStatus=ds;bindSession({...ds,lastAck:st.lastAck||ds.lastAck});currentMode=st.mode;directDevice=st.mode==='hardware'&&!st.reportedDeviceStatus;const state=ds.state||st.state,active=Number(ds.remaining)>0;
 const states={idle:say('待機','Ready'),waiting:say('等待下次量測','Waiting'),measuring:say('量測中','Measuring'),paused:say('已暫停','Paused'),fault:say('量測中止','Measurement stopped'),offline:say('裝置離線','Device offline'),online:say('裝置在線','Device online')};
 $('state').textContent=states[state]||state;$('mode').textContent=st.mode==='demo'?say('示範資料','DEMO DATA'):say('實機','DEVICE');$('mode').className='badge'+(st.mode==='demo'?' demo':'');
 const fresh=st.reportedStatusAgeSec==null||st.reportedStatusAgeSec<=15;
 $('start').disabled=!connected||!!pendingRunContext||active||state==='measuring'||!fresh||st.state==='offline';$('pause').disabled=!connected||!active||!fresh;$('pause').textContent=state==='paused'?say('繼續測試','Resume test'):say('暫停測試','Pause test');
 if(ds.adcDiagnosticRunning)$('start').disabled=true;
 $('adcDiagnostic').disabled=!connected||!directDevice||ds.adcDiagnosticVersion!==1||active||state==='measuring'||!!ds.adcDiagnosticRunning;
 $('exportAdcDiagnostic').disabled=!ds.adcDiagnostic||!!ds.adcDiagnosticRunning;
 const diagnostic=ds.adcDiagnostic;
 $('adcDiagnosticResult').textContent=ds.adcDiagnosticRunning?say('正在比較兩種 ADC 讀取方式，LED 保持關閉。','Comparing two ADC readers. All LEDs remain off.'):diagnostic?say('診斷完成。原始碼範圍：','Diagnostic complete. Raw code ranges: ')+['spiBefore','gpioSlow','spiAfter'].map((k,i)=>`${['SPI A','GPIO','SPI B'][i]} ${diagnostic[k]?.min}–${diagnostic[k]?.max}`).join(' / ')+say('。請下載診斷 JSON。這不是光學通過判定。','. Download the diagnostic JSON. This is not an optical pass result.'):say('只在直連新版裝置時可用。診斷全程關燈，保留原有量測與 CSV。','Available on a directly connected updated device. LEDs stay off. Existing measurements and CSV are retained.');
 $('raw').disabled=!connected||st.mode==='demo'||!!st.reportedDeviceStatus||!ds.rawAvailable;
 ['runMode','periodMinutes','blocks','durationSec','conditionTag','duty','mask'].forEach(id=>$(id).disabled=active);
 $('progress').textContent=state==='paused'?say('已關燈。按「繼續測試」後等待 3 秒，重新量測未完成的那一次。','LEDs are off. Resume waits 3 s, then repeats the unfinished measurement.'):active?say(`已完成 ${ds.completedBlocks??0} / ${ds.plannedBlocks??'—'} 次。${state==='measuring'?'正在取樣 2 秒。':`約 ${Math.ceil(ds.nextStartInSec??0)} 秒後開始。`}`,`Completed ${ds.completedBlocks??0} / ${ds.plannedBlocks??'—'}. ${state==='measuring'?'Collecting a 2 s block.':`Next start in about ${Math.ceil(ds.nextStartInSec??0)} s.`}`):state==='fault'?say('排程已停止，請先保存 JSON 並處理錯誤。','Schedule stopped. Save JSON and resolve the error.'):say('可開始新的量測。請在重新啟動裝置前匯出資料。','Ready for a new measurement. Export data before restarting the device.');
 $('endContinuous').hidden=ds.acquisitionMode!=='continuous'||!active;$('endContinuous').disabled=!connected||!fresh;if(active&&ds.acquisitionMode==='continuous')$('progress').textContent=state==='paused'?say('已暫停；曲線會保留這段缺口。','Paused; the curve will retain this gap.'):say('連續量測中 · 已保存 ','Continuous acquisition · ')+(ds.completedBlocks??0)+' / '+(ds.plannedBlocks??'—')+say(' 組',' blocks');
 if(!fresh)$('progress').textContent=say('裝置狀態已過期。不能確認是否已停止；請恢復連線。','Device status is stale. Stop is not confirmed. Restore the connection.');
 $('bringup').textContent=ds.boardValidated===false?say('開發者尚未解除實板檢查鎖定，只能選「全部關閉」。','The board is locked for initial checks. Select All off.'):say('若 PCB 發燙或有異味，請關閉 SW1，拔除 J2 與 USB-to-TTL，並斷開 J1 電池。','If the PCB gets hot or smells abnormal, turn SW1 off, unplug J2 and USB-to-TTL, and disconnect the J1 battery.');
 if(st.error||ds.error)message(ds.error||st.error);
}
async function refresh(){
 if(refreshing)return;refreshing=true;
 try{
 await historyReady;const st=await api('/api/status');connected=true;renderStatus(st);
 if(pendingDelete&&st.lastAck?.id===pendingDelete){if(st.lastAck.ok)await clearLocalHistory();else message(st.lastAck.error);pendingDelete=null;}
 // Add the live result before recovering older summaries so current notes are retained.
 const fresh=addRecord(st.latest);await recoverHistory(st);
 records.sort((a,b)=>(a.bootId===b.bootId&&Number.isFinite(a.deviceTimeMs)&&Number.isFinite(b.deviceTimeMs))?a.deviceTimeMs-b.deviceTimeMs:0);
 latest=st.latest?(records.find(r=>r.id===st.latest.id)||st.latest):null;
 if(fresh&&latest){
  if(correctionCapture&&latest.id!==correctionCapture.skipId&&(!correctionCapture.requireAck||(st.lastAck?.id===correctionCapture.commandId&&st.lastAck.ok))){try{captureCorrectionBlock(correctionCapture.stage);if(correction[correctionCapture.stage].length>=5){correctionCapture=null;message('correction_capture_complete');}}catch(e){correctionCapture=null;message(e.message);}}
  const stage=$('capture').value;if(stage!=='off'&&cal[stage].length<5){try{captureBlock(stage);if(cal[stage].length>=5)$('capture').value='off';}catch(e){message(e.message);}}
 }
 if(fresh&&latest&&!latest.recoveredFromDeviceHistory){drawCal();latest.viewSnapshot=latest.sessionContext?{...AeroHistory.clone(latest.sessionContext),uiRevision:UI_REVISION}:makeSnapshot(latest);storeRecord(latest);}
 await captureLatestRaw(st);renderResult();
 if(st.lastAck&&!st.lastAck.ok&&(!correctionCapture||st.lastAck.id===correctionCapture.commandId)){correctionCapture=null;message(st.lastAck.error);}
 }catch(e){connected=false;message(e.message);$('state').textContent=say('連線中斷','Disconnected');$('start').disabled=true;$('pause').disabled=true;$('raw').disabled=!visibleRecord()?.rawCsv;$('progress').textContent=say('手機無法確認裝置狀態。裝置端已接受的排程仍可能繼續。','The phone cannot verify device state. A schedule already accepted by the device may continue.');}finally{refreshing=false;}
}
$('lang').onclick=()=>{language=language==='zh'?'en':'zh';localStorage.setItem('aeroLanguage',language);message('');translate();scheduleSummary();renderResult();if(key)refresh();};
$('connect').onclick=async()=>{key=$('key').value;message('');clearInterval(timer);historyToken='';await refresh();if(connected)$('connectionPanel').open=false;timer=setInterval(refresh,1000);};
async function command(c){if(!connected)throw Error(say('請先連線。','Connect first.'));const result=await api('/api/command',c);message(say('指令已送出，正在確認裝置狀態。','Command sent. Checking device state.'));await refresh();return result;}
$('start').onclick=async()=>{if(pendingRunContext){message(say('正在等待開始指令確認。','Waiting for the start acknowledgement.'));return;}try{if(!connected)throw Error(say('請先連線。','Connect first.'));const c=settings();selectedRecordId='';if($('runMode').value==='repeat'&&deviceStatus?.scheduleVersion!==1)throw Error(say('定時功能需要更新韌體及網頁檔案。','Update firmware and web files to use the interval schedule.'));
 if(c.acquisitionMode==='continuous'&&(!directDevice||deviceStatus?.continuousVersion!==1))throw Error(say('連續量測需要新版韌體，並以裝置直連或電腦後端連線。','Continuous acquisition requires updated firmware and a direct or host-bridge connection.'));
 pendingRunContext={waitingForReply:true,previousKey:AeroSession.key(deviceStatus),snapshot:{calibration:AeroHistory.clone(cal),measuredCalibration:AeroHistory.clone(correction)}};
 const pending=pendingRunContext,needsAck=currentMode==='hardware'&&!directDevice;const reply=await api('/api/command',{action:'start',...c});if(pendingRunContext===pending){pending.commandId=reply.command?.id;pending.requireAck=!!reply.command?.id&&needsAck;pending.waitingForReply=false;}message(say('指令已送出，正在確認裝置狀態。','Command sent. Checking device state.'));await refresh();}catch(e){pendingRunContext=null;message(e.message);}};
$('pause').onclick=async()=>{try{correctionCapture=null;processor.reset();await command({action:deviceStatus?.state==='paused'?'resume':'pause'});}catch(e){message(e.message);}};
$('stop').onclick=async()=>{try{correctionCapture=null;processor.reset();await command({action:'stop'});}catch(e){message(e.message);}};
$('endContinuous').onclick=()=>$('stop').onclick();
$('adcDiagnostic').onclick=async()=>{try{
 if(!directDevice||deviceStatus?.adcDiagnosticVersion!==1)throw Error(say('請直連裝置，並更新韌體與網頁檔案。','Connect directly to the device and update firmware and web files.'));
 if(deviceStatus?.remaining||deviceStatus?.state==='measuring')throw Error(human('end_schedule_before_diagnostic'));
 $('adcDiagnostic').disabled=true;await command({action:'diagnoseAdc',conditionTag:$('conditionTag').value.trim()});
 }catch(e){message(e.message);}};
$('exportAdcDiagnostic').onclick=()=>{const d=deviceStatus?.adcDiagnostic;if(!d||deviceStatus.adcDiagnosticRunning)return;download(JSON.stringify({...d,deviceId:deviceStatus.deviceId,uiRevision:UI_REVISION,exported:new Date().toISOString()},null,2),'application/json',AeroHistory.filename(d,'adc-diagnostic','json'));};
$('calibrate').onclick=()=>{$('calibrationPanel').open=!$('calibrationPanel').open;if($('calibrationPanel').open)$('calibrationPanel').scrollIntoView({behavior:'smooth',block:'start'});};
$('historyButton').onclick=()=>{$('historyPanel').open=true;$('historyPanel').scrollIntoView({behavior:'smooth',block:'start'});};
async function clearLocalHistory(){if(archive.available)await archive.clear().catch(()=>{archiveOK=false;});selectedRecordId='';records=[];latest=null;sessionContexts.clear();pendingRunContext=null;localStorage.setItem('aeroSessionContexts','[]');processedHistory=[];historyToken='';lastProcessingKey='';processor.reset();renderResult();}
$('deleteRecords').onclick=async()=>{try{
 if(!connected)throw Error(say('請先連線，避免裝置紀錄稍後重新出現。','Connect first so device history can also be cleared.'));
 if(deviceStatus?.remaining>0)throw Error(human('end_schedule_before_delete'));
 if(!confirm(say('刪除本頁與裝置／伺服器歷史紀錄？先匯出 CSV 與 JSON。已收集的校正參考會保留。','Delete page and device/server history? Export CSV and JSON first. Saved calibration references will remain.')))return;
 const reply=await api('/api/command',{action:'clearHistory'});
 if(currentMode==='hardware'&&reply.command?.id)pendingDelete=reply.command.id;else await clearLocalHistory();
 await refresh();message(say('已送出刪除要求。請確認歷史紀錄為空。校正參考保留。','Delete requested. Confirm history is empty. Calibration references are retained.'));
 }catch(e){message(e.message);}};
['runMode','periodMinutes','blocks','durationSec'].forEach(id=>$(id).addEventListener('change',scheduleSummary));$('chartMode').onchange=plot;

for(const stage of ['dark','baseline','reference'])$(stage).onclick=()=>{try{captureBlock(stage);message('');}catch(e){message(e.message);}};
$('reset').onclick=()=>{$('capture').value='off';cal.dark=[];cal.baseline=[];cal.reference=[];resetCorrection('');save();};
function download(data,type,name){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([data],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);}
$('export').onclick=()=>exportReport(!!selectedRecordId);
$('exportAll').onclick=()=>exportReport(false);
$('returnLive').onclick=()=>{selectedRecordId='';renderResult();};
$('applySettings').onclick=()=>{const r=visibleRecord();if(!r||deviceStatus?.remaining)return;const repeat=(r.plannedBlocks||1)>1;$('runMode').value=r.acquisitionMode==='continuous'?'continuous':repeat?'repeat':'single';$('durationSec').value=String((r.plannedBlocks||30)*2);$('blocks').value=String(r.plannedBlocks||1);$('periodMinutes').value=String((r.periodSec||60)/60);$('duty').value=String(r.dutyPercent);$('mask').value=String(r.ledMask);$('conditionTag').value=r.conditionTag||'';$('notes').value=r.notes||'';correction.enabled=false;$('enableCorrection').checked=false;processor.reset();saveCorrection();scheduleSummary();message(say('已填入當次設定，尚未啟動量測；背景校正已停用，請確認後再開始。','Saved settings are filled in. No measurement has started. Background correction is disabled; check before starting.'));$('measurementPanel').scrollIntoView({behavior:'smooth',block:'start'});};
$('importJson').onchange=async()=>{try{for(const file of $('importJson').files||[]){if(file.size>40*1024*1024)throw Error('import_invalid');await importReport(JSON.parse(await file.text()));}}catch(e){message(e.message);}finally{$('importJson').value='';}};
$('importRaw').onchange=async()=>{try{await historyReady;for(const file of $('importRaw').files||[]){if(file.size>2000000)throw Error('raw_invalid');const csv=await file.text(),id=csv.trim().split(/\r?\n/)[1]?.split(',')[0],r=records.find(x=>x.id===id);if(!r)throw Error(say('找不到 CSV 對應的紀錄，請先載入那次的 JSON。','Load the matching JSON record before its raw CSV.'));AeroHistory.parseRaw(csv,r);r.rawCsv=csv;delete r.rawUnavailableReason;trimArchive();await storeRecord(r);viewRecord(r.id);}message(say('已依紀錄 ID 配對並載入原始波形。','Raw waveform loaded and matched by record ID.'));}catch(e){message(e.message);}finally{$('importRaw').value='';}};
$('csv').onclick=()=>{
 const head=['id','mode','valid','deviceTimeMs','calibrationId','conditionTag','notes','browserUsable','meanV','adcMin','adcMax','samples','sampleRateHz','ledMask','dutyPercent','periodSec','blockIndex','firmwareRevision','error'];for(let j=1;j<=4;j++)head.push(`D${j}_rawI_V`,`D${j}_rawQ_V`,`D${j}_rawMagnitude_V`,`D${j}_correctedI_V`,`D${j}_correctedQ_V`,`D${j}_correctedMagnitude_V`,`D${j}_signedProjection_V`,`D${j}_EMA_projection_V`);
 const quote=x=>`"${String(x??'').replaceAll('"','""')}"`;
 const lines=(selectedRecordId?[visibleRecord()].filter(Boolean):records).map(r=>{const pr=r.viewSnapshot?.processing||processedHistory.findLast(x=>x.sourceRecordId===r.id),row=[r.id,r.mode,r.valid,r.deviceTimeMs,pr?.calibrationId,r.conditionTag,r.notes,AeroHistory.review(r).usable,r.meanV,r.adcMin,r.adcMax,r.samples,r.sampleRateHz,r.ledMask,r.dutyPercent,r.periodSec,r.blockIndex,r.firmwareRevision,AeroHistory.review(r).reason];for(let j=0;j<4;j++){const c=pr?.channels?.[j];row.push(r.inPhaseV[j],r.quadratureV[j],r.amplitudeV[j],c?.inPhaseV,c?.quadratureV,c?.amplitudeV,c?.projectionV,pr?.smoothed?.channels?.[j]?.projectionV);}return row.map(quote).join(',');});download([head.join(','),...lines].join('\n'),'text/csv',AeroHistory.filename(visibleRecord(),'channels','csv'));
};
$('raw').onclick=async()=>{try{const r=visibleRecord(),csv=await fetchRawRecord(r);download(csv,'text/csv',AeroHistory.filename(r,'raw','csv'));renderResult();}catch(e){message(e.message);}};
const predictButton=document.createElement('button');predictButton.dataset.zh='分析氣味';predictButton.dataset.en='Analyze odor';predictButton.className='secondary';$('odorActions').append(predictButton);
// The host analysis service checks source records for both single records and runs.
// Send source records so the backend checks QC and recomputes unsmoothed features.
function odorMeasurement(r){
 const keys=['id','sessionId','blockIndex','plannedBlocks','periodSec','acquisitionMode','windowStartDeviceTimeMs','windowEndDeviceTimeMs','gapBeforeUs','continuousSegment','sessionComplete','sessionInterrupted','droppedPartialSamples','conditionTag','mode','valid','deviceId','bootId','firmware','firmwareRevision','processingSchema','iqConvention','acquisitionSignature','deviceTimeMs','samples','sampleRateHz','dutyPercent','ledMask','frequenciesHz','railSamples','lowRailSamples','highRailSamples','adcMin','adcMax','adcConstant','timingFault','maxIntervalErrorUs','rmsIntervalErrorUs','inPhaseV','quadratureV','amplitudeV','error','captureCorrectionId','captureContext'];
 return Object.fromEntries(keys.filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));
}
function odorRequest(r){
 if(!r||r.mode!=='hardware'||!AeroHistory.review(r).usable)throw Error(say('需要有效的實機量測；示範或失敗資料不能判讀。','A valid hardware measurement is required. Demo and failed data cannot be analyzed.'));
 const snapshot=selectedRecordId?r.viewSnapshot:null;
 if(selectedRecordId&&(!snapshot?.calibration||snapshot.legacy))throw Error(say('這筆歷史資料沒有保存當時的完整校正，不能套用現在的校正。','This record has no saved calibration. Current calibration cannot be substituted.'));
 const base=snapshot?snapshot.calibration:cal,measured=snapshot?snapshot.measuredCalibration:correction;
 return {receptorOrder:['Or22a','Or35a','Or85b','Or98a'],record:odorMeasurement(r),
  calibration:Object.fromEntries(['dark','baseline','reference'].map(k=>[k,(base[k]||[]).map(odorMeasurement)])),
  measuredCalibration:measured?{version:measured.version,id:measured.id,context:measured.context,enabled:measured.enabled,blank:(measured.blank||[]).map(odorMeasurement),phase:(measured.phase||[]).map(odorMeasurement)}:null};
}
let odorBusy=false,odorViewKey='',odorEpoch=0,odorAutoAttempt='',odorTransient='';
function odorSelection(){const r=visibleRecord(),session=$('odorScope').value!=='record'&&!!AeroSession.key(r),rs=session?AeroSession.group(records,r):r?[r]:[];return {r,session,rs,key:session?'session:'+AeroSession.key(r):'record:'+r?.id};}
function odorWindow(){const a=$('odorWindowStart').value,b=$('odorWindowEnd').value;if(a===''&&b==='')return null;const startSec=Number(a),endSec=Number(b);if(a===''||b===''||!Number.isFinite(startSec)||!Number.isFinite(endSec)||startSec>=endSec)throw Error(say('請填入有效的開始與結束秒數。','Enter valid start and end times.'));return {startSec,endSec};}
function odorStamp(selection){return selection.key+'|'+selection.rs.map(r=>r.id).join(',')+'|'+$('odorWindowStart').value+'|'+$('odorWindowEnd').value;}
function odorSaved(selection){return selection.session?selection.rs[0]?.sessionAnalysis:selection.r?.odorAnalysis;}
function odorCurrent(selection,saved){const w=saved?.input?.responseWindow;return saved&&(!selection.session||(JSON.stringify(saved.sourceRecordIds)===JSON.stringify(selection.rs.map(r=>r.id))&&String(w?.startSec??'')===String($('odorWindowStart').value)&&String(w?.endSec??'')===String($('odorWindowEnd').value)));}
function renderOdor(){
 const sel=odorSelection();
 if(sel.key!==odorViewKey){odorViewKey=sel.key;odorEpoch++;odorTransient='';const saved=odorSaved(sel);$('odorWindowStart').value=saved?.input?.responseWindow?.startSec??'';$('odorWindowEnd').value=saved?.input?.responseWindow?.endSec??'';}
 const saved=odorSaved(sel),result=odorCurrent(sel,saved)?saved:null;
 $('odorSessionLabel').textContent=!sel.r?say('完成量測後顯示結果。','Results appear after acquisition.'):(sel.r.conditionTag||sel.r.sessionId||sel.r.id)+' · '+(sel.session?sel.rs.length+say(' 組，合併為一次量測',' blocks in one session'):say('單筆 2 秒','Single 2 s record'));
 $('exportOdorSession').disabled=!sel.r;predictButton.disabled=odorBusy||!sel.r;
 const local=AeroSession.curve(sel.rs,(r,c)=>{if(!AeroHistory.review(r).usable)return {error:'invalid'};if(c.measuredCalibration?.enabled){const d=AeroCorrection.derive(r,c.measuredCalibration);if(d.error||d.channels?.some(x=>x.warning))return {error:'phase'};return AeroCorrection.normalize(r,c.calibration,c.measuredCalibration);}return AeroCalibration.normalize(r,c.calibration);});
 if(sel.session)$('odorSessionLabel').textContent+=result?say(' · 有效 ',' · Valid ')+result.validRecordCount+'/'+result.recordCount:say(' · 曲線待後端檢查',' · Curve awaiting backend checks');
 const curve=result?.curve||local,drawn=AeroOdorUI.curve($('odorCurve'),curve,sel.rs,language);
 $('odorCurveEmpty').hidden=drawn;$('odorCurveEmpty').textContent=sel.r?say('需要本次量測保存的完整校正，才能顯示 ΔF/F₀ 曲線。','A saved calibration is required to show the response curve.'):say('四個受器的反應曲線將顯示在這裡。','Four receptor response curves will appear here.');
 const p2=$('odorReference').value==='p2',comparison=result?.aggregate?(p2?result.aggregate.p2Diagnostics:result.aggregate.literatureReference):(p2?result:result?.literatureReference||result);
 const scores=comparison?.scores||[],quality=result?.aggregate?.quality,enabled=!!result&&(quality?quality.signalGuardPassed&&quality.patternContrastGuardPassed:result.status!=='insufficient_signal');
 const sorted=scores.filter(x=>Number.isFinite(x.pearsonR)).slice().sort((a,b)=>b.pearsonR-a.pearsonR),positive=sorted[0]?.pearsonR>0,ambiguous=comparison?.status==='ambiguous'||(positive&&sorted.length>1&&sorted[0].pearsonR-sorted[1].pearsonR<=.05);
 AeroOdorUI.bars($('odorBars'),scores,enabled,language);
 $('odorSummary').textContent=odorTransient||(!result?(odorBusy?say('分析中…','Analyzing…'):say('按「分析氣味」取得參考相似度。','Select Analyze odor for reference similarity.')):!enabled?say('訊號或通道差異不足，暫時無法判讀。','Insufficient signal or contrast to interpret.'):!positive?say('與這些參考氣味沒有正相關。','No positive match to these references.'):ambiguous?say('前兩個候選相近，無法明確區分。','The leading candidates are too similar to distinguish.'):say('最接近的參考：','Closest reference: ')+sorted[0].compound);
 $('odorDetails').textContent=result?JSON.stringify({status:result.status,window:result.aggregate?.window,usableWindows:result.validRecordCount,totalWindows:result.recordCount,aggregateQuality:quality,gaps:result.curve?.gaps,similaritySemantics:result.similaritySemantics,warnings:result.warnings,provenance:result.provenance},null,2):'';
 if(sel.session&&sel.r?.acquisitionMode==='continuous'&&deviceStatus?.odorBackend?.mode==='exploratory_reference_similarity'&&!odorBusy&&!result&&odorAutoAttempt!==odorStamp(sel)){
  odorAutoAttempt=odorStamp(sel);void analyzeOdor(true);
 }
}
async function analyzeOdor(automatic=false){
 if(odorBusy)return;const sel=odorSelection(),epoch=odorEpoch;
 odorBusy=true;odorTransient='';predictButton.disabled=true;
 try{
  const payload=sel.session?AeroSession.request(sel.rs,odorMeasurement,odorWindow()):odorRequest(sel.r);
  let capability;try{capability=await api('/api/odor-model');}catch{throw Error(say('請先啟動電腦的 start_odor_backend.cmd，再開啟 127.0.0.1:8765。','Start start_odor_backend.cmd and open 127.0.0.1:8765.'));}
  if(capability.mode!=='exploratory_reference_similarity')throw Error('odor_backend_version_mismatch');
  const result=await api(sel.session?'/api/predict-session':'/api/predict',payload);
  if(!records.includes(sel.rs[0]))return;
  if(sel.session){sel.rs[0].sessionAnalysis={...result,analyzedAt:new Date().toISOString(),sourceRecordIds:sel.rs.map(r=>r.id),input:payload};await storeRecord(sel.rs[0]);}
  else{sel.r.odorAnalysis={...result,analyzedAt:new Date().toISOString(),sourceRecordId:sel.r.id,input:payload};await storeRecord(sel.r);}
  if(epoch===odorEpoch&&!automatic)message('');
 }catch(e){if(epoch===odorEpoch){odorTransient=human(e.message);if(!automatic)message(e.message);}}
 finally{odorBusy=false;predictButton.disabled=false;renderOdor();}
}
predictButton.onclick=()=>analyzeOdor();
globalThis.addEventListener?.('resize',()=>renderOdor());
$('odorWindowStart').onchange=()=>renderOdor();$('odorWindowEnd').onchange=()=>renderOdor();
$('odorScope').onchange=()=>renderOdor();$('odorReference').onchange=()=>renderOdor();
function odorSessionReport(){const sel=odorSelection(),rs=sel.session?sel.rs:sel.r?[sel.r]:[];return {...reportData(false),exportScope:'One acquisition session; each two-second record is retained.',selectedRecordId:sel.r?.id,sessionId:sel.r?.sessionId||null,sessionContext:rs[0]?.sessionContext||null,records:rs.map(r=>({...r,browserReview:AeroHistory.review(r)}))};}
$('exportOdorSession').onclick=()=>{const sel=odorSelection();if(sel.r)download(JSON.stringify(odorSessionReport(),null,2),'application/json',AeroHistory.filename({...sel.r,id:sel.r.sessionId||sel.r.id},'measurement','json'));};
Object.assign(errorZH,{session_calibration_missing:'這次量測沒有保存完整校正，不能套用現在的校正。',session_calibration_changed:'這段資料使用不同校正，請分開分析。',session_calibration_must_precede_response:'需要先完成未刺激基線，再開始這次量測。',session_metadata_required:'這段資料缺少裝置或實驗識別資訊，請更新韌體。',session_requires_all_LEDs:'四受器分析需要四燈全開。',mixed_session_context:'這段資料混用了不同設定，不能一起分析。',response_window_outside_session:'分析區間超出這次量測，請檢查秒數。',session_no_records:'尚無量測資料。',session_identity_mismatch:'不能合併不同次量測。',session_response_window_empty:'選取的區間沒有完整有效的量測。'});
$('correctionContext').value=correction.context;$('correctionTau').value=correction.tauSec;$('enableCorrection').checked=correction.enabled;
$('correctionContext').onchange=()=>{cal={dark:[],baseline:[],reference:[]};resetCorrection('correction_conditions_changed');save();};
$('correctionTau').onchange=()=>{const tau=Number($('correctionTau').value);if(!Number.isFinite(tau)||tau<0||tau>120){message('correction_invalid_tau');return;}correction.tauSec=tau;processor.reset();saveCorrection();drawCal();};
$('clearCorrection').onclick=()=>resetCorrection('');
$('enableCorrection').onchange=()=>{if($('enableCorrection').checked){const s=AeroCorrection.summarize(correction,latest);if(s.error){$('enableCorrection').checked=false;message(s.error);return;}}correction.enabled=$('enableCorrection').checked;processor.reset();saveCorrection();drawCal();};
$('duty').addEventListener('change',()=>{correction.enabled=false;$('enableCorrection').checked=false;processor.reset();saveCorrection();drawCal();message('correction_conditions_changed');});
$('mask').addEventListener('change',()=>{processor.reset();drawCal();});
async function startCorrectionCapture(stage){try{
 if(!key)throw Error(human('correction_connect_first'));
 if(!$('correctionContext').value.trim())throw Error(human('correction_context_required'));
 if(stage==='phase'&&correction.blank.length<5)throw Error(human('correction_collect_blank_first'));
 // Command validation occurs before replacing any existing calibration.
 const reply=await api('/api/command',{action:'start',blocks:5,periodSec:5,conditionTag:$('conditionTag').value.trim(),dutyPercent:Number($('duty').value),ledMask:15});
 saveCorrection();const previous=JSON.parse(JSON.stringify(correction));correction=AeroCorrection.create($('correctionContext').value.trim(),newCalibrationId());correction.tauSec=previous.tauSec;if(stage==='phase')correction.blank=previous.blank;
 cal.baseline=[];cal.reference=[];$('capture').value='off';$('mask').value='15';$('enableCorrection').checked=false;processor.reset();correctionCapture={stage,skipId:latest?.id,commandId:reply.command?.id,requireAck:!!reply.command?.id&&currentMode==='hardware'};saveCorrection();save();message('correction_capture_started');await refresh();
 }catch(e){correctionCapture=null;message(e.message);}}
$('collectBlank').onclick=()=>startCorrectionCapture('blank');$('collectPhase').onclick=()=>startCorrectionCapture('phase');
translate();drawCal();scheduleSummary();renderResult();historyReady=loadArchive();
