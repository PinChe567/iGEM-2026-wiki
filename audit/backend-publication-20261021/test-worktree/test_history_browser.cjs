// Optional: install Playwright; start the demo server on localhost:8876.
const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict');
const evidence=__dirname+'/evidence/';
const supplied=process.argv.slice(2);
const sample=(i)=>({id:`browser-fixture-${i}`,mode:'hardware',valid:true,conditionTag:['Test01','Dark','Light_1'][i-1],samples:8000,sampleRateHz:4000,ledMask:[0,15,1][i-1],dutyPercent:25,adcMin:32767,adcMax:32767,meanV:1.249961853,rmsV:0,railSamples:0,maxIntervalErrorUs:10,inPhaseV:[0,0,0,0],quadratureV:[0,0,0,0],amplitudeV:[0,0,0,0],bootId:'browser-fixture',deviceTimeMs:i*5000,firmwareRevision:'synthetic-adc2-fixture',periodSec:5,blockIndex:1,plannedBlocks:1});
// Default inputs are synthetic fixtures, not hardware measurements.
const reports=supplied.length?supplied.map(p=>JSON.parse(fs.readFileSync(p,'utf8'))):[1,2,3].map(n=>({schema:'aerosense-session-1',records:Array.from({length:n},(_,i)=>sample(i+1))}));
const firstId=reports.at(-1).records[0].id,lastId=reports.at(-1).records.at(-1).id;
(async()=>{
const browser=await chromium.launch({...(process.env.AEROSENSE_BROWSER_EXE?{executablePath:process.env.AEROSENSE_BROWSER_EXE}:process.platform==='win32'?{channel:'msedge'}:{}),headless:true});
const context=await browser.newContext({viewport:{width:1100,height:900},acceptDownloads:true});const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));let commands=0;page.on('request',r=>{if(r.url().endsWith('/api/command'))commands++;});
await page.goto('http://127.0.0.1:8876/');await page.evaluate(()=>historyReady);
await page.locator('#historyPanel').evaluate(e=>e.open=true);
await page.locator('#importJson').setInputFiles(reports.map((r,i)=>({name:`regression-${i}.json`,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(r))}))); 
await page.waitForFunction(id=>records.length===3&&selectedRecordId===id,lastId);
assert.match(await page.locator('#qc').innerText(),/固定/);
assert.equal(await page.locator('#raw').isDisabled(),true);
await page.locator('#historyRows tr').filter({hasText:'Test01'}).getByRole('button',{name:'查看'}).click();
assert.match(await page.locator('#recordSettings').textContent(),/全部關閉/);
assert.match(await page.locator('#analysis').innerText(),/32767/);
const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;
assert.equal(download.suggestedFilename(),`Test01_report_${firstId}.json`);
const file=await download.path();const report=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(report.records.length,1);assert.equal(report.records[0].valid,true);assert.equal(report.records[0].browserReview.usable,false);assert.equal(report.records[0].rawCsv,undefined);
await page.locator('#applySettings').click();assert.equal(await page.locator('#mask').inputValue(),'0');assert.equal(commands,0);
await page.reload();await page.evaluate(()=>historyReady);assert.equal(await page.evaluate(()=>records.length),3);
await page.locator('#historyPanel').evaluate(e=>e.open=true);
await page.locator('#historyRows tr').filter({hasText:'Light_1'}).getByRole('button',{name:'查看'}).click();
await page.locator('#resultsPanel .inset').first().evaluate(e=>e.open=true);
await page.locator('#resultsPanel').screenshot({path:evidence+'history_review_desktop.png'});
await page.setViewportSize({width:390,height:844});await page.locator('#resultsPanel').screenshot({path:evidence+'history_review_mobile.png'});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await page.locator('#lang').click();assert.match(await page.locator('#qc').innerText(),/Constant/);assert.match(await page.locator('#recordSettings').textContent(),/D1/);
// Exercise actual IndexedDB retention and raw CSV round trip with clearly
// identified synthetic data, separate from the three supplied hardware records.
await page.evaluate(async()=>{const r={...records[0],id:'synthetic-browser-raw',mode:'demo',conditionTag:'Synthetic raw archive test',samples:8000,adcMin:100,adcMax:101};delete r.viewSnapshot;r.rawCsv='record_id,sample,time_us,adc_counts,voltage_V\n'+Array.from({length:8000},(_,i)=>`${r.id},${i},${i*250},${100+i%2},${((100+i%2)*2.5/65536).toFixed(9)}`).join('\n')+'\n';await importReport({schema:'aerosense-session-2',records:[r]});});
await page.reload();await page.evaluate(()=>historyReady);await page.evaluate(()=>viewRecord('synthetic-browser-raw'));
assert.equal(await page.locator('#raw').isDisabled(),false);assert.equal(await page.locator('#chartMode').inputValue(),'raw');
const rawPromise=page.waitForEvent('download');await page.locator('#raw').click();const rawDownload=await rawPromise;assert.equal(rawDownload.suggestedFilename(),'Synthetic raw archive test_raw_synthetic-browser-raw.csv');
assert.equal(fs.readFileSync(await rawDownload.path(),'utf8').trim().split('\n').length,8001);
// Mock device responses for the new diagnostic controls. No PCB is contacted.
const diag={schema:'aerosense-adc-diagnostic-1',id:'synthetic-adc-1',conditionTag:'ADC_room',spiBefore:{min:32767,max:32767,rawCodes:[32767]},gpioSlow:{min:123,max:125,rawCodes:[123,125]},spiAfter:{min:32767,max:32767,rawCodes:[32767]},dataLine:{cnvHighPullUp:[1],cnvHighPullDown:[0]}};
let requested=false;
await page.route('**/api/status',r=>r.fulfill({json:{mode:'hardware',state:'idle',remaining:0,adcDiagnosticVersion:1,adcDiagnosticRunning:false,adcDiagnostic:requested?diag:null}}));
await page.route('**/api/history',r=>r.fulfill({json:[]}));
await page.route('**/api/command',r=>{const c=r.request().postDataJSON();assert.equal(c.action,'diagnoseAdc');assert.equal(c.conditionTag,'ADC_room');requested=true;return r.fulfill({json:{ok:true}});});
await page.locator('#connectionPanel').evaluate(e=>e.open=true);await page.locator('#key').fill('synthetic-key');await page.locator('#connect').click();
await page.locator('#conditionTag').fill('ADC_room');await page.locator('#advanced').evaluate(e=>e.open=true);
await page.locator('#adcDiagnostic').click();await page.waitForFunction(()=>document.getElementById('adcDiagnosticResult').textContent.includes('123'));
const diagDownloadPromise=page.waitForEvent('download');await page.locator('#exportAdcDiagnostic').click();const diagDownload=await diagDownloadPromise;
assert.equal(diagDownload.suggestedFilename(),'ADC_room_adc-diagnostic_synthetic-adc-1.json');assert.deepEqual(JSON.parse(fs.readFileSync(await diagDownload.path(),'utf8')).gpioSlow.rawCodes,[123,125]);
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await page.locator('#lang').click();await page.evaluate(()=>refresh());
assert.match(await page.locator('#adcDiagnosticResult').innerText(),/診斷完成/);
await page.locator('#advanced').screenshot({path:require('path').join(require('os').tmpdir(),'aerosense-adc-diagnostic-mobile.png')});
assert.deepEqual(errors,[]);
const result={passed:true,method:'Headless browser via Playwright; local test server and isolated browser profile',inputKind:supplied.length?'User-supplied files':'Synthetic fixtures',checks:[supplied.length?'Supplied reports import and deduplication':'Synthetic legacy reports import and deduplication','Constant-code warning without changing source valid field','Selected-record JSON contents and saved-name filename','Read-only historical settings and explicit apply without command','IndexedDB reload persistence','390 px mobile overflow check','English and Chinese rendering','Synthetic raw CSV persistence, plotting and offline export'],physicalHardwareTest:false};
result.checks.push('ADC diagnostic controls and JSON download with mock device responses','ADC diagnostic mobile layout and bilingual labels');
fs.writeFileSync(evidence+'history_browser_checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
