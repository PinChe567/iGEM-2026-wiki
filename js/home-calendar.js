(() => {
 const host=document.querySelector('[data-home-calendar]'),data=window.AerosenseNotebook;if(!host||!data)return;
 const events=data.EVENTS.filter(e=>e.startDate&&e.status!=='planned');
 let month=events.map(e=>e.startDate.slice(0,7)).sort().at(-1)||'2026-09';
 function draw(){const [year,m]=month.split('-').map(Number),first=new Date(year,m-1,1),days=new Date(year,m,0).getDate();
  host.querySelector('[data-month-title]').textContent=first.toLocaleDateString('en',{month:'long',year:'numeric'});
  const grid=host.querySelector('.home-calendar__days');grid.replaceChildren();
  ['S','M','T','W','T','F','S'].forEach(d=>{const el=document.createElement('span');el.textContent=d;grid.append(el);});
  for(let n=0;n<first.getDay();n++)grid.append(document.createElement('span'));
  for(let d=1;d<=days;d++){const date=month+'-'+String(d).padStart(2,'0'),items=events.filter(e=>e.datePrecision==='day'&&e.startDate===date),el=document.createElement(items.length?'button':'span');el.textContent=d;if(items.length){el.type='button';el.className='has-note';el.setAttribute('aria-label',`${date}: ${items.length} notebook entries`);el.addEventListener('click',()=>notes(items));}grid.append(el);}
  notes(events.filter(e=>e.startDate.slice(0,7)===month));
 }
 function notes(items){const out=host.querySelector('.home-calendar__notes');out.replaceChildren();const h=document.createElement('h3');h.textContent='Inside the notebook';out.append(h);if(!items.length){const p=document.createElement('p');p.textContent='No dated entries in this month.';out.append(p);}
  items.slice(0,6).forEach(e=>{const a=document.createElement('a');a.href='notebook.html';const small=document.createElement('small');small.textContent=`${e.datePrecision==='month'?e.startDate.slice(0,7):e.startDate}${e.datePrecision==='range'?' – '+e.endDate:''} · ${e.substream||e.stream}`;const strong=document.createElement('strong');strong.textContent=e.title;a.append(small,strong);out.append(a);});
 }
 function shift(by){const [y,m]=month.split('-').map(Number),d=new Date(y,m-1+by,1);month=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');draw();}
 host.querySelector('[data-month-prev]').addEventListener('click',()=>shift(-1));host.querySelector('[data-month-next]').addEventListener('click',()=>shift(1));draw();
})();
