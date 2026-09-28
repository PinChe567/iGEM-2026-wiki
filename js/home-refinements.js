/* An intentionally illustrative code. No sensor measurements are implied. */
(() => {
 const demo=document.querySelector('[data-odor-demo]');if(!demo)return;
 const cells=[...demo.querySelectorAll('.home-odor-code i')];
 const patterns={banana:[0,2,5],coffee:[1,4,6,7]};
 demo.querySelectorAll('[data-odor]').forEach(button=>button.addEventListener('click',()=>{
   const key=button.dataset.odor;
   demo.querySelectorAll('[data-odor]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   cells.forEach((cell,i)=>cell.classList.toggle('is-on',patterns[key].includes(i)));
   demo.dataset.activeOdor=key;
   demo.querySelector('[data-odor-result]').textContent=`${key==='banana'?'Banana':'Coffee'} selected. A different odor, a different illustrative pattern.`;
 }));
})();
