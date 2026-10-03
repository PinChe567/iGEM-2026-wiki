(() => {
 const host=document.querySelector('[data-component-explorer]'),map=document.querySelector('[data-pcb-map]');if(!host||!map)return;
 const boardRoot='hardware%20information/pcb%20v2/';
 const select=host.querySelector('select'),detail=host.querySelector('.hw-component-explorer__detail'),plate=map.querySelector('.hw-pcb-map__image'),img=plate.querySelector('img');let side=0,etch=false,activeRef="U4";
 const parts={
 U1:['Boost converter','TPS61023','The battery supply is raised to the reader rail. Select the inductor and current limit from the peak rail load, efficiency and input-voltage range.','https://www.ti.com/lit/ds/symlink/tps61023.pdf'],
 U2:['Battery charging / power path','BQ24074','The power-path charger supports the single-cell battery and external supply. Charge current and thermal dissipation follow the programmed resistance and input-to-battery voltage drop.','https://www.ti.com/lit/gpn/bq24074'],
 U4:['Controller','ESP32-WROOM-32E','The controller schedules the four excitation channels and reads the ADC. Digital timing, buffering and interface bandwidth connect optical acquisition to demodulation.','https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32e_esp32-wroom-32ue_datasheet_en.pdf'],
 U6:['Analog supply','LP5907','The 3.3 V low-noise analog rail separates the receiver supply from digital switching. The LDO load budget and dropout margin must cover the analog chain.','https://www.ti.com/lit/ds/symlink/lp5907.pdf'],
 U7:['Voltage reference','LTC6655, 2.5 V','The reference sets the ADC full-scale range. For a 16-bit conversion, 2.5 V / 65,536 = 38.15 µV per ideal code. Reference noise and drift contribute to the input-referred error.','https://www.analog.com/media/en/technical-documentation/data-sheets/ltc6655-6655ln.pdf'],
 U8:['Transimpedance amplifier','LMP7721','The low-input-bias amplifier converts photodiode current into voltage. In the design scenario, 0.678 nW × 0.3 A/W = 0.203 nA; a 100 MΩ feedback resistance gives an ideal 20.3 mV. These are calculated design values.','https://www.ti.com/lit/ds/symlink/lmp7721.pdf'],
 U9:['Analog-to-digital converter','ADS8866','A 16-bit SAR converter samples the conditioned signal. Its 100 kSPS rated throughput provides headroom over the 4 kHz design sampling schedule; settling and noise determine useful resolution.','https://www.ti.com/lit/ds/symlink/ads8866.pdf'],
 D1:['Excitation LED 1','155124BS73200','Four blue excitation LEDs illuminate the channels. Wavelength, optical power and drive current are selected together with the reporter spectrum and excitation-rejection optics.','https://www.we-online.com/components/products/datasheet/155124BS73200.pdf'],
 D5:['Photodiode','VEMD5060X01','The detector converts collected fluorescence into photocurrent. Responsivity at the emission wavelength, active area, capacitance and dark current define the receiver budget.','https://www.vishay.com/doc?84278=']
 };
 for (const ref of ['D2','D3','D4']) parts[ref] = ['Excitation LED '+ref.slice(1), ...parts.D1.slice(1)];
 const sourcesByPart={U1:['tps61023',2],U2:['bq24074',3],U4:['esp32',4],U6:['lp5907',5],U7:['ltc6655',6],U8:['lmp7721',7],U9:['ads8866',8],D1:['excitation-led',9],D2:['excitation-led',9],D3:['excitation-led',9],D4:['excitation-led',9],D5:['vemd5060',10]};
 Object.entries(parts).forEach(([ref,p])=>{const o=document.createElement('option');o.value=ref;o.textContent=`${p[0]} · ${p[1]} (BOM ${ref})`;select.append(o);});
 // Verified against the supplied TOP/BOT manufacturing PDFs and the two PNG
 // exports. The PDF bottom view is mirrored horizontally relative to the PNG.
 // Coordinates identify footprint centres in the untrimmed PNG, not label text.
 const pins=[
  {side:0,ref:'U1',x:32.4,y:38.0,lx:28,ly:31,label:'Boost'},
  {side:0,ref:'U4',x:48.1,y:87.8,lx:63,ly:86,label:'MCU'},
  {side:0,ref:'U6',x:38.7,y:41.7,lx:29,ly:43,label:'LDO'},
  {side:0,ref:'U7',x:38.3,y:53.6,lx:30,ly:54,label:'Ref'},
  {side:0,ref:'U9',x:42.0,y:64.9,lx:32,ly:68,label:'ADC'},
  {side:1,ref:'U2',x:30.4,y:24.0,lx:39,ly:20,label:'Charger'},
  {side:1,ref:'U8',x:45.2,y:49.4,lx:32,ly:49,label:'TIA'},
  {side:1,ref:'D5',x:49.9,y:49.3,lx:65,ly:49,label:'PD'},
  {side:1,ref:'D1',x:51.9,y:55.3,lx:65,ly:64,label:'LED 1'},
  {side:1,ref:'D2',x:48.5,y:55.3,lx:39,ly:65,label:'LED 2'},
  {side:1,ref:'D3',x:48.2,y:43.7,lx:39,ly:34,label:'LED 3'},
  {side:1,ref:'D4',x:51.7,y:43.7,lx:65,ly:34,label:'LED 4'}
 ];
 const schematicBlocks={U1:'Sheet 1 · TPS61023 boost stage beside SW1 and L1',U2:'Sheet 1 · BQ24074 battery charger / power path',U4:'Sheet 2 · ESP32 / UART block',U6:'Sheet 2 · 3V3 LDO, analog supply output',U7:'Sheet 2 · 2V5_REF block',U8:'Sheet 2 · TIA block, between PD_SUM and ADC_AINP',U9:'Sheet 2 · ADC 3-Wire CS Mode block',D1:'Sheet 2 · LEDs, LED1_GATE / Q1 branch',D2:'Sheet 2 · LEDs, LED2_GATE / Q2 branch',D3:'Sheet 2 · LEDs, LED3_GATE / Q3 branch',D4:'Sheet 2 · LEDs, LED4_GATE / Q4 branch',D5:'Sheet 2 · Photo Diod block, feeding PD_SUM'};
 function para(label,text){const p=document.createElement('p'),b=document.createElement('strong');b.textContent=label+' ';p.append(b,document.createTextNode(text));return p;}
 function link(url,label){const a=document.createElement('a');a.href=url;a.textContent=label;a.target='_blank';a.rel='noopener';return a;}
 function show(ref){
  const p=parts[ref];if(!p)return;
  activeRef=ref;
  const location=pins.find(pin=>pin.ref===ref);
  if(location && side!==location.side){side=location.side;flip();}
  select.value=ref;detail.replaceChildren();
  plate.querySelectorAll('button').forEach(b=>{const on=b.dataset.ref===ref;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});
  plate.querySelectorAll('[data-marker-ref]').forEach(el=>el.classList.toggle('is-active',el.dataset.markerRef===ref));
  const h=document.createElement('h3');h.textContent=p[0]+' · '+p[1];
  detail.append(h,para('BOM reference:',ref),para('Function and specification:',p[2]),para('Board position:',(location.side?'Back':'Front')+' face · highlighted footprint'),para('Schematic location:',schematicBlocks[ref]));
  const sources=document.createElement('p'),citation=document.createElement('a'),source=sourcesByPart[ref];citation.href='#ref-'+source[0];citation.textContent='Reference ['+source[1]+']';citation.setAttribute('aria-label','Read manufacturer reference '+source[1]+' for '+p[1]);sources.append(citation,document.createTextNode(' · '),link(p[3],'Manufacturer datasheet ↗'),document.createTextNode(' · '),link(boardRoot+'NTHU_TEST_BOARD_Schematic.pdf#page='+(['U1','U2'].includes(ref)?1:2),'Open corresponding schematic sheet ↗'));detail.append(sources);
  window.AeroSenseGlossary?.enhance(detail);
 }
 function flip(){
  const filename=`PCB_${side?'BTM':'TOP'}${etch?'_Etch':''}.png`;
  img.src=boardRoot+filename;img.alt=`Reader PCB ${side?'back':'front'} ${etch?'copper routing':'component layout'} from the supplied board source`;
  map.querySelector('[data-board-side]').textContent=`${side?'Back':'Front'} · ${etch?'copper routing':'component layout'}`;
  map.querySelector('[data-board-source]').href=boardRoot+filename;
  const etchButton=map.querySelector('[data-board-etch]');etchButton.setAttribute('aria-pressed',String(etch));etchButton.textContent=etch?'Hide copper traces':'Show copper traces';
  plate.querySelectorAll('button,.hw-pcb-leaders').forEach(b=>b.remove());map.querySelector('.hw-pcb-legend')?.remove();
  const legend=document.createElement('p');legend.className='hw-pcb-legend';legend.textContent=side?'LED 1–4 · excitation  /  PD · photodiode  /  TIA · current-to-voltage amplifier  /  Charger · battery power':'Boost · reader supply  /  MCU · controller  /  LDO · analog supply  /  Ref · ADC reference  /  ADC · conversion';
  map.querySelector('.hw-pcb-map__viewport').after(legend);
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('hw-pcb-leaders');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
  pins.filter(p=>p.side===side).forEach(p=>{
   const line=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1:p.x,y1:p.y,x2:p.lx,y2:p.ly,stroke:'#9de9ff','stroke-width':.2}))line.setAttribute(k,v);line.dataset.markerRef=p.ref;line.classList.toggle('is-active',p.ref===activeRef);
   const dot=document.createElementNS(ns,'circle');for(const [k,v] of Object.entries({cx:p.x,cy:p.y,r:.45,fill:'#ffdb60'}))dot.setAttribute(k,v);dot.dataset.markerRef=p.ref;dot.classList.toggle('is-active',p.ref===activeRef);svg.append(line,dot);
   const b=document.createElement('button');b.type='button';b.className='hw-pcb-map__pin';b.textContent=p.label;b.dataset.ref=p.ref;b.style.left=p.lx+'%';b.style.top=p.ly+'%';b.setAttribute('aria-label','Inspect '+p.ref+' · '+parts[p.ref][0]);b.setAttribute('aria-pressed',String(p.ref===activeRef));b.classList.toggle('is-active',p.ref===activeRef);b.addEventListener('click',()=>show(p.ref));plate.append(b);
  });plate.prepend(svg);
 }
 map.querySelector('[data-board-flip]').addEventListener('click',()=>{side=1-side;flip();if(pins.find(p=>p.ref===activeRef)?.side!==side)show(pins.find(p=>p.side===side).ref);if(!matchMedia('(prefers-reduced-motion:reduce)').matches)plate.animate([{opacity:.35,transform:'rotateY(-8deg)'},{opacity:1,transform:'rotateY(0deg)'}],{duration:350});});
 map.querySelector('[data-board-etch]').addEventListener('click',()=>{etch=!etch;flip();});
 select.addEventListener('change',()=>show(select.value));flip();show('U4');
 const schematic=document.querySelector('[data-schematic]');
 schematic?.querySelectorAll('[data-schematic-page]').forEach(button=>button.addEventListener('click',()=>{
  const page=button.dataset.schematicPage;
  schematic.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const preview=schematic.querySelector('.hw-schematic__preview');preview.href=boardRoot+'NTHU_TEST_BOARD_Schematic.pdf#page='+page;
  const image=preview.querySelector('img');image.src='fig/hardware/schematics/reader-schematic-'+page+'.png';
  image.alt=page==='1'?'Reader schematic sheet 1: battery, charging, USB and boost supply':'Reader schematic sheet 2: analog supplies, ESP32, LEDs, photodiode, TIA, voltage reference and ADC';
 }));
})();
