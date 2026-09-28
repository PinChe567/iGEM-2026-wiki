(() => {
  const host=document.querySelector('[data-component-explorer]'),map=document.querySelector('[data-pcb-map]');
  const sourceRows=window.AEROSENSE_HW_BOM?.v2;
  const rows=sourceRows?.flatMap(row=>row.ref.split(',').map(ref=>({...row,ref:ref.trim(),groupRef:row.ref})));
  if(!host||!map||!rows?.length)return;
  const select=host.querySelector('select'),detail=host.querySelector('.hw-component-explorer__detail'),image=map.querySelector('.hw-pcb-map__image');
  const schematic='hardware%20information/pcb%20v2/NTHU_TEST_BOARD_Schematic.pdf';
  const datasheets={
    U1:'https://www.ti.com/product/TPS61023',U2:'https://www.ti.com/product/BQ24074',U4:'https://documentation.espressif.com/esp32-wroom-32e_esp32-wroom-32ue_datasheet_en.html',
    U6:'https://www.ti.com/product/LP5907',U7:'https://www.analog.com/en/products/LTC6655.html',U8:'https://www.ti.com/product/LMP7721',U9:'https://www.ti.com/product/ADS8866'
  };
  const reasons={
    U1:'Boost conversion supplies the reader from its battery path. The output voltage, inductor and thermal margin must be checked against the final rail load.',
    U2:'Power-path charging allows a single-cell battery and external input to support the reader while charging.',
    U4:'The controller times four LED gates and acquires serial ADC data for the proposed I/Q decoder.',
    U6:'A separate 3.3 V low-noise analog rail helps keep digital supply disturbance away from the high-impedance receiver.',
    U7:'A 2.5 V precision reference defines the ADC conversion scale. An ideal 16-bit step is 2.5 V / 65,536 ≈ 38.15 µV.',
    U8:'The photodiode current is small: using the stated 0.678 nW optical scenario and assumed 0.3 A/W responsivity gives ≈0.203 nA. The low-input-bias amplifier is intended for this high-impedance TIA; 100 MΩ ideal gain gives ≈20.3 mV.',
    U9:'The 16-bit SAR converter digitizes the conditioned fluorescence signal. Its published 100 kSPS capability exceeds the proposed 4 kHz sample schedule; that does not prove system SNR or settling.',
    R27:'The 100 MΩ feedback resistor converts photodiode current to voltage. For 0.203 nA the ideal transimpedance output is about 20.3 mV; leakage and noise require board measurement.'
  };
  const pins=[['U4',39,69],['U2',61,43],['U5',59,32],['Q1',53,36],['Q2',47,36],['Q3',53,64],['Q4',47,64]];
  const options=rows.slice().sort((a,b)=>a.ref.localeCompare(b.ref,undefined,{numeric:true}));
  options.forEach(row=>{const option=document.createElement('option');option.value=row.ref;option.textContent=`${row.ref} · ${row.value||row.function||'BOM entry'}`;select.append(option);});
  const markers=new Map();
  pins.forEach(([ref,x,y])=>{if(!rows.some(row=>row.ref===ref))return;const button=document.createElement('button');button.type='button';button.className='hw-pcb-map__pin';button.textContent=ref;button.style.left=x+'%';button.style.top=y+'%';button.setAttribute('aria-label',`Inspect ${ref} on PCB`);button.addEventListener('click',()=>show(ref));image.append(button);markers.set(ref,button);});
  function fact(label,value){const line=document.createElement('p'),strong=document.createElement('strong');strong.textContent=label+' ';line.append(strong,document.createTextNode(value));return line;}
  function show(ref){const row=rows.find(item=>item.ref===ref);if(!row)return;select.value=ref;markers.forEach((button,key)=>button.classList.toggle('is-active',key===ref));detail.replaceChildren();
    const title=document.createElement('h3');title.textContent=`${row.ref} · ${row.value||'Component'}`;detail.append(title);
    detail.append(fact('Function:',row.function||'See the original schematic.'));
    if(row.mpn && !row.mpn.startsWith('Not frozen'))detail.append(fact('Specified part:',row.mpn));
    if(row.qty)detail.append(fact(row.groupRef.includes(',')?'BOM group / total quantity:':'Quantity:',row.groupRef.includes(',')?`${row.groupRef} / ${row.qty}`:row.qty));
    detail.append(fact('Why this part / sizing:',reasons[ref]||'The original BOM lists the value and designator. Component-level sizing is documented in the linked schematic and manufacturer data where a specific part is supplied.'));
    const source=document.createElement('p'),schem=document.createElement('a');schem.href=schematic+'#page='+(row.category==='power'?1:2);schem.textContent=`Schematic · ${row.category==='power'?'power':'signal / control'} sheet ↗`;source.append(schem);
    if(datasheets[ref]){const sep=document.createTextNode(' · '),sheet=document.createElement('a');sheet.href=datasheets[ref];sheet.target='_blank';sheet.rel='noopener noreferrer';sheet.textContent='Manufacturer datasheet ↗';source.append(sep,sheet);}
    else source.append(document.createTextNode(' · Manufacturer datasheet: no verified part-specific link in the supplied BOM.'));
    detail.append(source);
    detail.append(fact('Board location:',markers.has(ref)?'Highlighted on the supplied top-layout rendering.':'Reference position cannot be confirmed from the supplied top/bottom renderings. Use the schematic designator; no pin has been guessed.'));
  }
  select.addEventListener('change',()=>show(select.value));show(rows.some(row=>row.ref==='U8')?'U8':options[0].ref);
})();
