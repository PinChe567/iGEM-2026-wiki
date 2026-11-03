import{m as n,s as r,l as c,w as p,a as m,b as g,c as d}from"./mount-BbDhTzp0.js";const t=document.querySelector("#app");if(!t)throw new Error("#app missing");const i=t,l=n(i,{homeHref:"../index.html",onLocaleChange:()=>s()});function s(){const e=l.getCopy();document.title=e.legal.title;const a=r(i);a.innerHTML=`
    <section class="hub-intro">
      <div class="eyebrow"><span></span> SUITE</div>
      <h1>${e.legal.title}</h1>
    </section>
    <div class="legal-page" id="legalRoot" style="max-width:40rem;margin-bottom:3rem">
      ${c(e,l.getLocale())}
    </div>
  `;const o=a.querySelector("#legalRoot");o&&p(o),m(g(d(),"suite"))}s();
