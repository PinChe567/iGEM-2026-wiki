import"./index-CXh1DE2f.js";import{m as n,s as r,l as c,w as p,a as m,b as g,c as d}from"./mount-D2POQTHj.js";const l=document.querySelector("#app");if(!l)throw new Error("#app missing");const i=l,t=n(i,{homeHref:"../index.html",onLocaleChange:()=>s()});function s(){const e=t.getCopy();document.title=e.legal.title;const o=r(i);o.innerHTML=`
    <section class="hub-intro">
      <div class="eyebrow"><span></span> SUITE</div>
      <h1>${e.legal.title}</h1>
    </section>
    <div class="legal-page" id="legalRoot" style="max-width:40rem;margin-bottom:3rem">
      ${c(e,t.getLocale())}
    </div>
  `;const a=o.querySelector("#legalRoot");a&&p(a),m(g(d(),"suite"))}s();
