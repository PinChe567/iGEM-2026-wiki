const{chromium}=require('../game/node_modules/playwright'),fs=require('fs'),path=require('path');
const out=path.resolve(__dirname,'../reports/review-v25/root');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),rows=[];
for(const width of[1440,390])for(const lang of['en','zh-Hant']){
 const p=await b.newPage({viewport:{width,height:900},hasTouch:width===390,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8011/description.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.AeroSenseI18n&&!document.querySelector('[data-language-toggle]').disabled);await p.evaluate(x=>window.AeroSenseI18n.setLanguage(x),lang);await p.evaluate(()=>document.fonts.ready);
 const back=p.locator('#ref-harvie-2023 .ref-backlink'),pop=p.locator('#return-ref-harvie-2023');await back.scrollIntoViewIfNeeded();
 if(width===390)await back.tap();else await back.hover();await p.waitForTimeout(80);
 const row={width,lang,opened:await pop.isVisible(),links:await pop.locator('li a').count(),title:await pop.locator('p').innerText(),noSelect:await p.locator('.ref-citation-picker select').count()===0,errors};
 await p.screenshot({path:path.join(out,`references-final-${width}-${lang}.png`)});
 await back.focus();await p.keyboard.press('ArrowDown');row.arrowFocus=await pop.locator('li a').first().evaluate(e=>e===document.activeElement);await p.keyboard.press('Escape');row.escapeClosed=!await pop.isVisible();row.focusReturned=await back.evaluate(e=>e===document.activeElement);
 await back.click();const target=await pop.locator('li a').last().getAttribute('href');await pop.locator('li a').last().click();row.returned=(await p.evaluate(()=>location.hash))===target;row.highlight=await p.locator('.is-citation-highlight').count()>0;
 row.pass=row.opened&&row.links>1&&row.noSelect&&row.arrowFocus&&row.escapeClosed&&row.focusReturned&&row.returned&&row.highlight&&!errors.length&&(lang==='en'||row.title==='引用段落');rows.push(row);await p.close();
}await b.close();fs.writeFileSync(path.join(out,'references-final.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;})();
