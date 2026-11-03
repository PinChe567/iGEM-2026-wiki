const fs = require('fs');
const path = require('path');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const out = __dirname;
  const browser = await chromium.launch({channel:'chrome',headless:true});
  const results = [];
  for (const width of [1440,390]) {
    const context = await browser.newContext({viewport:{width,height:900}, deviceScaleFactor:1});
    for (const name of ['hardware','model','engineering']) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:8011/'+name+'.html', {waitUntil:'domcontentloaded'});
      await page.waitForTimeout(1500);
      await page.evaluate(async () => {
        const pause = ms => new Promise(r => setTimeout(r,ms));
        const end = Math.min(document.body.scrollHeight,250000);
        for(let y=0;y<end;y+=1600){scrollTo(0,y);await pause(20);}
        scrollTo(0,0);
      });
      await page.waitForTimeout(1200);
      const info = await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map(e=>e.id);
        const duplicates = [...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
        const anchors = [...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(decodeURIComponent(h.slice(1))));
        return {
          width:innerWidth,documentWidth:document.documentElement.scrollWidth,duplicates,
          missingSamePageAnchors:[...new Set(anchors)],
          loadedImages:[...document.images].filter(i=>i.complete&&i.naturalWidth>0).length,
          images:document.images.length,
          brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),
          sections:[...document.querySelectorAll('main h2')].map(h=>h.textContent.trim()),
          figures:document.querySelectorAll('main figure').length,
          tables:document.querySelectorAll('main table').length
        };
      });
      const interactions=[];
      if(name==='model'){
        for(const tab of ['hardware','decoding','receptor']){
          const loc=page.locator('[data-model-tab="'+tab+'"]');
          if(await loc.count()){
            await loc.first().click();await page.waitForTimeout(250);
            interactions.push({tab,selected:await loc.first().getAttribute('aria-selected'),className:await loc.first().getAttribute('class')});
          }
        }
      }
      if(name==='engineering'){
        for(const id of ['wl-cycle-tab-2','wl-cycle-tab-3','receptor-loop-tab-6']){
          const loc=page.locator('#'+id);
          if(await loc.count()){
            await loc.click();await page.waitForTimeout(100);
            const target=await loc.getAttribute('aria-controls');
            interactions.push({id,selected:await loc.getAttribute('aria-selected'),panelVisible:await page.locator('#'+target).isVisible()});
          }
        }
      }
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:path.join(out,'qa-'+name+'-'+width+'.png'),timeout:10000});
      results.push({page:name,width,...info,interactions,errors});
      fs.writeFileSync(path.join(out,'owned-pages-browser-qa.json'),JSON.stringify(results,null,2)+'\n');
      console.log(JSON.stringify({page:name,width,overflow:info.documentWidth>width,errors,interactions}));
      await page.close();
    }
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(out,'owned-pages-browser-qa.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
