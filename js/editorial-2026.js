/* Decorative field-notebook drawings. No scientific data or controls are replaced. */
(function () {
  'use strict';
  var body=document.body;
  if(!body||body.classList.contains('page-home'))return;
  var groups={blue:['page-hardware'],violet:['page-model'],amber:['page-entrepreneurship','page-notebook','page-attributions'],teal:['page-human-practices','page-sustainability'],rose:['page-education','page-learning']};
  var color='green';
  Object.keys(groups).forEach(function(key){if(groups[key].some(function(name){return body.classList.contains(name);}))color=key;});
  body.classList.add('editorial-2026','ed-'+color);

  // Section folios use the existing TOC, never a competing navigation scheme.
  if(!body.classList.contains('page-members'))document.querySelectorAll('.page-article > .section-block').forEach(function(section){
    var id=section.id,label=null;
    if(!id||section.querySelector(':scope > .ed-section-index'))return;
    document.querySelectorAll('.page-toc a').forEach(function(link){if(link.getAttribute('href')==='#'+id)label=link.querySelector('.tech-label');});
    if(!label)return;
    var badge=document.createElement('span');badge.className='ed-section-index';badge.setAttribute('aria-hidden','true');badge.textContent=label.textContent.trim();section.prepend(badge);
  });
  var line=function(shapes){return '<g class="ed-sketch-line">'+shapes+'</g>';};
  var soft=function(shapes){return '<g class="ed-sketch-soft">'+shapes+'</g>';};
  var fine=function(shapes){return '<g class="ed-sketch-fine">'+shapes+'</g>';};
  var icons={
    members:soft('<path d="M47 70h71l8 7 8-7h71v122h-71l-8 7-8-7H47Z"/><rect x="56" y="91" width="50" height="64" rx="3"/>')+
      line('<path d="M47 70h71l8 7 8-7h71v122h-71l-8 7-8-7H47V70Zm79 7v122M55 63l58-5 12 6 11-6 58 5"/><rect x="56" y="91" width="50" height="64" rx="3"/><circle cx="81" cy="113" r="9"/><path d="M65 144v-8a16 16 0 0 1 32 0v8M144 96h42m-42 15h33m-33 15h40M61 172h39"/><path class="ed-sketch-draw" d="m148 154 9 9 22-25M89 85l5-19 23 4-5 19"/>'),
    entrepreneurship:soft('<path d="M53 111h146v79H53Z"/><circle cx="165" cy="66" r="26"/>')+
      line('<path d="M53 111h146v79H53v-79Zm-8 0 15-34h132l15 34M77 79v32m30-32v32m29-32v32M65 134h52v56m15-56h53v31h-53z"/><circle cx="165" cy="66" r="26"/><path class="ed-sketch-draw" d="m150 77 12-13 9 6 12-18m-13 0h13v13"/><path d="M56 206h143M76 152h18"/>'),
    // Four wet-lab report pages have different roles and different pictograms.
    results:soft('<rect x="56" y="74" width="139" height="107" rx="8"/>')+
      line('<path d="M48 58v125h157M57 162h140"/><path class="ed-sketch-draw" d="M57 150c16 0 18-1 26-27s13-40 23-14 16 37 27 2 18-12 24 7 21 19 39 18"/><path d="M67 73h19m8 0h16M161 63v17m-6-17h12m-12 17h12M188 48v19m-6-19h12m-12 19h12"/><circle cx="161" cy="71" r="3"/><circle cx="188" cy="57" r="3"/>')+
      fine('<path d="M61 195h32m10 0h32m10 0h33"/>'),
    experiments:soft('<path d="M55 115h29v44a14.5 14.5 0 0 1-29 0ZM108 126h29v33a14.5 14.5 0 0 1-29 0Z"/>')+
      line('<path d="M51 91h37M55 91v68a14.5 14.5 0 0 0 29 0V91M104 100h37m-33 0v59a14.5 14.5 0 0 0 29 0v-59M44 141h105v44H44M55 115h29m24 11h29"/><path d="m162 45 21 13-42 63-13-8 34-68Z"/><path d="m164 44 7-11 16 10-7 11m-51 59-8 12 8 5 11-9"/><path class="ed-sketch-draw" d="M176 117c-7 10-10 15-10 20a10 10 0 0 0 20 0c0-5-3-10-10-20Z"/>'),
    parts:soft('<rect x="48" y="155" width="44" height="28" rx="5"/><rect x="108" y="155" width="37" height="28" rx="5"/><rect x="163" y="155" width="38" height="28" rx="5"/>')+
      line('<path class="ed-sketch-draw" d="M70 48c103 18 14 76 110 90M180 48c-103 18-14 76-110 90"/><path d="M84 54h81M105 68h40m-40 19h40m-59 36h78m-59-17h40"/><rect x="48" y="155" width="44" height="28" rx="5"/><rect x="108" y="155" width="37" height="28" rx="5"/><rect x="163" y="155" width="38" height="28" rx="5"/><path d="M92 169h16m37 0h18m-40-28v14"/>'),
    design:soft('<path d="M102 81h42v62h-42z"/><circle cx="171" cy="179" r="18"/>')+
      line('<path d="M40 101h57m52 0h60M40 115h57m52 0h60"/><path d="M102 81h15v62h-15zm27 0h15v62h-15zM102 81l-8-14m50 14 8-14"/><path d="m124 44 10 6v12l-10 6-10-6V50Z"/><path class="ed-sketch-draw" d="M123 74v57m-5-6 5 6 5-6M128 156c12 15 15 19 24 21"/><circle cx="121" cy="151" r="4"/><circle cx="136" cy="148" r="3"/><circle cx="171" cy="179" r="18"/><path d="m170 166-7 14h8l-2 11 10-17h-8Z"/>'),
    description:soft('<path d="M51 143h59v45H51z"/><circle cx="180" cy="99" r="20"/>')+
      line('<path d="M56 142c-19-10-10-31 3-31 14-15 35-7 35 6 16 4 24 24 6 29v36H56zM65 145v23m16-25v24m15-23v24"/><path class="ed-sketch-draw" d="M81 103c-19-23 24-25 8-48M112 119c-5-22 29-17 27-39"/><path d="M149 55c17 5 15 23 12 35l-8 15 12 4c-3 16 3 25 16 26M190 97h12m-9-6 9 6-9 6"/><circle cx="178" cy="94" r="3"/><circle cx="114" cy="69" r="4"/><circle cx="138" cy="50" r="3"/>'),
    hardware:soft('<path d="m57 91 69-36 70 36-69 37Z"/>')+
      line('<path d="m57 91 69-36 70 36v76l-70 31-69-31V91Zm0 0 69 35 70-35m-70 35v72"/><path d="m88 80 38-19 38 19-38 20-38-20Zm-17 52 16 8v20l-16-8v-20Zm71 19 33-16v18l-33 16v-18Z"/><path class="ed-sketch-draw" d="m93 148 18 8m-18 5 18 8"/><circle cx="150" cy="176" r="3"/>'),
    model:fine('<path d="m54 72 66 18 74-38M54 72l66 73 74-40M54 125l66-35 74 63M54 175l66-85 74 112M54 175l66-30 74 8M54 125l66 20 74 57"/>')+
      soft('<circle cx="120" cy="90" r="17"/><circle cx="120" cy="145" r="17"/>')+
      line('<circle cx="54" cy="72" r="11"/><circle cx="54" cy="125" r="11"/><circle cx="54" cy="175" r="11"/><circle cx="120" cy="90" r="17"/><circle cx="120" cy="145" r="17"/><circle cx="194" cy="52" r="7"/><circle cx="194" cy="105" r="7"/><circle cx="194" cy="153" r="7"/><circle cx="194" cy="202" r="7"/>'),
    engineering:soft('<circle cx="95" cy="97" r="36"/><circle cx="160" cy="151" r="27"/>')+
      line('<path d="m82 51 1 11-14 8-10-5-11 19 9 6v15l-9 6 11 19 10-5 14 8-1 11h23l1-11 14-8 10 5 11-19-9-6V90l9-6-11-19-10 5-14-8-1-11Z"/><circle cx="94" cy="98" r="18"/><path d="m151 117 1 8-10 5-8-3-8 14 6 5v11l-6 5 8 14 8-3 10 5-1 8h17l1-8 10-5 8 3 8-14-6-5v-11l6-5-8-14-8 3-10-5-1-8Z"/><circle cx="160" cy="152" r="13"/><path class="ed-sketch-draw" d="M51 169c11 20 29 30 52 30m-8-6 8 6-9 5M175 63c14 8 21 22 22 39m-6-8 6 8 6-8"/>'),
    contribution:soft('<path d="m53 111 70-29 73 30-72 29Z"/>')+
      line('<path d="m53 111 70-29 73 30-72 29-71-30Zm0 0v60l71 28 72-29v-58M124 141v58M53 111l-12-22 71-29 11 22m0 0 13-23 73 30-13 23"/><path class="ed-sketch-draw" d="M123 103V39m-13 13 13-13 13 13M92 168l-20-8m87 7 21-8"/>'),
    safety:soft('<path d="M125 48c21 17 44 20 65 24v53c-1 34-26 55-65 72-39-17-64-38-65-72V72c21-4 44-7 65-24Z"/>')+
      line('<path d="M125 48c21 17 44 20 65 24v53c-1 34-26 55-65 72-39-17-64-38-65-72V72c21-4 44-7 65-24Z"/><path class="ed-sketch-draw" d="m93 121 21 20 44-47"/><path d="M90 65v-9m70 9v-9M79 161l-9 7m110-7 9 7"/>'),
    notebook:soft('<rect x="59" y="61" width="142" height="125" rx="7"/>')+
      line('<rect x="48" y="53" width="145" height="129" rx="7"/><path d="M48 87h145M80 43v22m81-22v22M73 108h17m18 0h17m18 0h17M73 133h17m18 0h17m18 0h17M73 158h17"/><path class="ed-sketch-draw" d="m109 157 8 8 15-19"/><path d="m160 172 24-32 11 9-24 32-13 4Z"/>'),
    attributions:soft('<rect x="50" y="48" width="131" height="145" rx="7"/>')+
      line('<rect x="48" y="46" width="133" height="147" rx="7"/><circle cx="79" cy="85" r="10"/><path d="M62 115v-9a17 17 0 0 1 34 0v9M112 78h45m-45 16h33M65 138h87M65 153h61"/><path class="ed-sketch-draw" d="m122 183 52-59 17 15-52 59-20 6Z"/><path d="m172 126 17 15m-51 55-15-13"/>'),
    'human-practices':soft('<path d="M49 53h99v66H99l-25 18v-18H49Z"/>')+
      line('<path d="M49 53h99v66H99l-25 18v-18H49Z"/><path d="M155 90h45v60h-22l-12 16v-16h-43v-22M69 77h55m-55 17h39"/><circle cx="79" cy="168" r="11"/><path d="M57 201v-12a22 22 0 0 1 44 0v12"/><circle cx="166" cy="182" r="9"/><path d="M149 207v-8a17 17 0 0 1 34 0v8"/>'),
    education:soft('<path d="M47 105c27-10 49-4 78 12 29-16 51-22 78-12v74c-27-10-49-4-78 12-29-16-51-22-78-12Z"/>')+
      line('<path d="M47 105c27-10 49-4 78 12 29-16 51-22 78-12v74c-27-10-49-4-78 12-29-16-51-22-78-12V105Zm78 12v74M62 125c18-2 29 3 47 13m-47 7c18-2 29 3 47 13m32-20c18-10 29-15 47-13m-47 33c18-10 29-15 47-13"/><path class="ed-sketch-draw" d="M114 87c0-10-9-14-9-24a20 20 0 0 1 40 0c0 10-9 14-9 24h-22Zm0 7h22m-17 7h12M125 34v-9m32 27 8-4m-72 4-8-4"/>'),
    sustainability:soft('<circle cx="126" cy="125" r="61"/>')+
      line('<path class="ed-sketch-draw" d="M61 88a70 70 0 0 1 128 6m-1 59a70 70 0 0 1-128 0"/>'+'<path d="m176 89 13 9 7-14M72 154l-13-7-6 15M127 171v-70"/><path d="M127 133c-42 4-49-22-49-39 27-1 49 9 49 39Zm0-15c40 1 48-26 48-43-28 2-48 18-48 43Z"/><path d="m93 108 34 26m0-16 31-29M94 171h65"/>'),
    glossary:soft('<path d="M47 68c23-8 53-4 78 12 25-16 55-20 78-12v108c-23-8-53-4-78 12-25-16-55-20-78-12Z"/>')+
      line('<path d="M47 68c23-8 53-4 78 12 25-16 55-20 78-12v108c-23-8-53-4-78 12-25-16-55-20-78-12V68Zm78 12v108"/><path d="m66 120 14-35 14 35m-22-12h17M150 91h28l-28 33h28"/>'+'<path d="M64 142c15-1 28 3 44 10m-44 6c15-1 28 3 44 10m34-17c14-7 27-10 44-10m-44 26c14-7 27-10 44-10"/>'),
    learning:soft('<circle cx="73" cy="153" r="17"/><circle cx="175" cy="77" r="17"/>')+
      line('<path class="ed-sketch-draw" d="M58 190c-32-45 42-39 55-68s-54-51-7-68 52 31 81 7"/><circle cx="58" cy="190" r="8"/><circle cx="73" cy="153" r="8"/><circle cx="111" cy="122" r="8"/><circle cx="88" cy="82" r="8"/><circle cx="136" cy="52" r="8"/><path d="M184 59V35l24 7-24 8M145 177h48m-10-8 10 8-10 8"/>'),
    smell:soft('<circle cx="76" cy="117" r="46"/>')+
      line('<path d="M147 48c20 4 34 16 32 35l-3 24 14 24-16 8c2 25-6 44-29 53M152 107h9"/><path class="ed-sketch-draw" d="M43 92c30-27 27 31 63 4M39 121c28-24 39 30 71 1M49 150c28-19 34 19 56 4"/><circle cx="119" cy="87" r="4"/><circle cx="127" cy="123" r="5"/><circle cx="118" cy="153" r="3"/>'),
    mold:soft('<path d="M57 104c-27-47 54-70 73-39 42-18 70 21 46 42v76H57Z"/>')+
      line('<path d="M57 104c-27-47 54-70 73-39 42-18 70 21 46 42v76H57v-79Z"/><path d="M71 119h24m-24 17h17m-17 17h25"/><circle cx="153" cy="137" r="33"/><path d="m177 161 26 27M143 152v-24m0 0-9-8m9 8 10-11m2 32v-13m0 0 8-8"/><circle cx="133" cy="118" r="4"/><circle cx="153" cy="115" r="4"/><circle cx="164" cy="126" r="3"/>'),
    synbio:soft('<ellipse cx="126" cy="128" rx="76" ry="56"/>')+
      line('<ellipse cx="126" cy="128" rx="76" ry="56"/><path d="M76 85V60h13v32M99 79V60h13v17"/><path d="m88 42 8-5 8 5v9l-8 5-8-5Z"/><path class="ed-sketch-draw" d="M102 109c61 15 2 43  60 55M162 109c-61 15-2 43-60 55"/>'+'<path d="M117 116h30m-24 16h17m-17 14h17m-29 13h40"/><path d="M172 95v16m-8-8h16"/>'),
    decode:soft('<rect x="49" y="77" width="31" height="31" rx="3"/><rect x="82" y="110" width="31" height="31" rx="3"/><rect x="49" y="143" width="31" height="31" rx="3"/>')+
      line('<path d="M47 74h68v102H47zM81 74v102M47 108h68m-68 34h68"/><path class="ed-sketch-draw" d="M129 126h29m-8-7 8 7-8 7M169 147v-29h10v29h10V88h10v59"/><path d="M165 166h40M62 56h137"/>'),
    act:soft('<path d="m123 71  30 30-30 30-30-30Z"/>')+
      line('<path d="m123 71 30 30-30 30-30-30 30-30Zm0-29v29m-30 30H 60v54m94-54h34v54"/>'+'<rect x="41" y="156" width="39" height=" 30" rx="5"/>'+'<rect x="169" y="156" width="39" height="30" rx="5"/><path d="m50 170 7 7 13-15M179 166h19m-19 9h14M119 95h8v13h-8z"/>')
  };
  var key='description';
  Object.keys(icons).forEach(function(name){if(body.classList.contains('page-'+name))key=name;});
  if(body.classList.contains('page-learning')){
    var moduleId=body.getAttribute('data-learn-module');
    key=({'01':'smell','02':'mold','03':'synbio','04':'decode','05':'act'})[moduleId]||'learning';
  }

  // Glossary keeps the same nodes, IDs and search bindings; only its cover is grouped.
  if(body.classList.contains('page-glossary')&&!document.querySelector('.ed-glossary-hero,.glossary-conversation-hero')){
    var glossary=document.querySelector('.glossary-page');
    if(glossary){
      var title=glossary.querySelector('h1'),intro=glossary.querySelector('.glossary-page__intro'),eyebrow=glossary.querySelector('.glossary-page__eyebrow');
      if(title){var cover=document.createElement('header');cover.className='page-hero ed-glossary-hero';glossary.insertBefore(cover,eyebrow||title);[eyebrow,title,intro].forEach(function(node){if(node)cover.append(node);});}
    }
  }
  function attach(){
    var hero=document.querySelector('.page-hero,.members-intro,.learn-hero,.lm-hero');
    if(!hero||hero.querySelector(':scope > .ed-vignette'))return !!hero;
    var sketch=document.createElement('div');sketch.className='ed-vignette ed-vignette--'+key;sketch.setAttribute('aria-hidden','true');
    sketch.innerHTML='<svg viewBox="0 0 250 240" xmlns="http://www.w3.org/2000/svg" focusable="false">'+
      '<path d="M13 25 225 10 238 219 28 232Z" class="ed-sketch-soft"/><path d="M14 14H231V224H14Z" class="ed-sketch-sheet"/>'+
      '<path d="M79 5 163 10 160 31 78 25Z" class="ed-sketch-tape"/>'+icons[key]+'</svg>';
    hero.classList.add('ed-has-vignette');hero.dataset.edSubject=key;hero.append(sketch);
    if('IntersectionObserver'in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){sketch.classList.add('is-seen');observer.disconnect();}});},{threshold:.25});observer.observe(sketch);
    }
    return true;
  }
  if(!attach()&&body.classList.contains('page-learn-module')){
    // Module markup is created after defer scripts; observe only until its hero exists.
    var root=document.querySelector('[data-learn-root]');
    if(root&&'MutationObserver'in window){var moduleObserver=new MutationObserver(function(){if(attach())moduleObserver.disconnect();});moduleObserver.observe(root,{childList:true,subtree:true});}
  }
}());
