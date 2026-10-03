import"./index-CXh1DE2f.js";import{m,d as p,s as h,t as u}from"./mount-D2POQTHj.js";import{p as d,P as b}from"./storage-D1ThGdN-.js";import"./map-BktXfWpY.js";import{p as $,L as y}from"./storage-CmXva9Kt.js";import{a as g,S as f}from"./storage-BgjRJnVt.js";/* empty css              */const n=document.querySelector("#app");if(!n)throw new Error("#app missing");const l=n,x=m(l,{homeHref:"./index.html",onLocaleChange:()=>c()});function S(t,e){const i=[t.tutorialDone?"T":"·",t.practiceDone?"P":"·",t.dailyOrCampaignDone?"M":"·",t.scienceDone?"S":"·"],s=[t.tutorialDone,t.practiceDone,t.dailyOrCampaignDone,t.scienceDone].filter(Boolean).length;return`${e.hub.localProgress}: ${s}/4 (${i.join("")})`}function c(){const t=x.getLocale(),e=u(t);document.title=e.meta.title;const i=document.querySelector('meta[name="description"]');i&&i.setAttribute("content",e.meta.description);const s=p({pixelKey:b,labyrinthKey:y,spectrumKey:f,parsePixel:d,parseLabyrinth:$,parseSpectrum:g}),o=[{step:"01",href:"./games/pixel/index.html",scienceHref:"./games/pixel/index.html#science",meta:e.hub.games.pixel,progress:s.pixel,testid:"card-pixel",game:"pixel"},{step:"02",href:"./games/labyrinth/index.html",scienceHref:"./games/labyrinth/index.html#science",meta:e.hub.games.game2,progress:s.labyrinth,testid:"card-labyrinth",game:"labyrinth"},{step:"03",href:"./games/spectrum/index.html",scienceHref:"./games/spectrum/index.html#science",meta:e.hub.games.game3,progress:s.spectrum,testid:"card-spectrum",game:"spectrum"}];h(l).innerHTML=`
    <section class="hub-intro">
      <div class="eyebrow"><span></span> ${e.hub.eyebrow}</div>
      <h1>${e.hub.heading}</h1>
      <p>${e.hub.lead}</p>
    </section>

    <section class="hub-educators" data-testid="hub-educators" aria-labelledby="hub-educators-title">
      <h2 id="hub-educators-title">${e.hub.educatorsTitle}</h2>
      <p>${e.hub.educatorsLead}</p>
      <a class="text-button" href="./education/index.html#for-educators">${e.hub.educatorsLink}</a>
    </section>

    <section class="hub-grid" aria-label="${e.hub.heading}">
      ${o.map(a=>{const r=`hub-title-${a.game}`;return`
        <article class="game-card-link hub-card" data-testid="${a.testid}" aria-labelledby="${r}">
          <span class="section-label">${e.hub.gameLabel} ${a.step}</span>
          <h2 id="${r}">${a.meta.title}</h2>
          <p>${a.meta.blurb}</p>
          <ul class="hub-card-meta">
            <li><span>${e.hub.duration}</span> ${a.meta.duration}</li>
            <li><span>${e.hub.level}</span> ${a.meta.level}</li>
            <li><span>${e.hub.concept}</span> ${a.meta.concept}</li>
            <li>${S(a.progress,e)}</li>
          </ul>
          <div class="hub-card-actions">
            <a class="primary-button" href="${a.href}" data-game="${a.game}" data-testid="play-${a.game}" aria-label="${e.hub.playAria}: ${a.meta.title}">${e.hub.play}</a>
            <a class="ghost-button" href="${a.scienceHref}" data-testid="science-${a.game}" aria-label="${e.hub.scienceAria}: ${a.meta.title}">${e.hub.science}</a>
          </div>
        </article>`}).join("")}
    </section>
  `}c();
