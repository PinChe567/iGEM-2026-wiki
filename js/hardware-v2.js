/* BEGIN IGEM STATIC MEDIA MAP __igem_media_js_hardware_v2_js */
function __igem_media_js_hardware_v2_js(value) {
  var original = value, text = String(value), split = text.search(/[?#]/);
  var key = split < 0 ? text : text.slice(0, split), suffix = split < 0 ? "" : text.slice(split);
  try { key = decodeURIComponent(key); } catch (_) { return original; }
  key = key.replace(/^(?:\.\/)+/, "");
  var urls = {"../assets/hardware/optics-v38/spectral-alignment-en.png":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/lossless-20261018/443ef7da647f-spectral-alignment-en.webp","../assets/hardware/optics-v38/spectral-alignment-en.svg":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/b71e81730052-spectral-alignment-en.svg","../assets/hardware/optics-v38/spectral-alignment-zh-Hant.png":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/lossless-part2-20261018/b8d2768f47d4-spectral-alignment-zh-hant.webp","../assets/hardware/optics-v38/spectral-alignment-zh-Hant.svg":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/42c3ac562435-spectral-alignment-zh-hant.svg","assets/hardware/optics-v38/spectral-alignment-en.png":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/lossless-20261018/443ef7da647f-spectral-alignment-en.webp","assets/hardware/optics-v38/spectral-alignment-en.svg":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/b71e81730052-spectral-alignment-en.svg","assets/hardware/optics-v38/spectral-alignment-zh-Hant.png":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/lossless-part2-20261018/b8d2768f47d4-spectral-alignment-zh-hant.webp","assets/hardware/optics-v38/spectral-alignment-zh-Hant.svg":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/42c3ac562435-spectral-alignment-zh-hant.svg"};
  var target = urls[key]; if (!target) return original;
  var hashAt = target.indexOf("#"), savedHash = hashAt < 0 ? "" : target.slice(hashAt);
  if (hashAt >= 0) target = target.slice(0, hashAt);
  var suffixHash = suffix.indexOf("#"), query = suffixHash < 0 ? suffix : suffix.slice(0, suffixHash);
  if (query) target += (target.indexOf("?") < 0 ? "?" : "&") + query.slice(1);
  return target + (suffixHash < 0 ? savedHash : suffix.slice(suffixHash));
}
/* END IGEM STATIC MEDIA MAP __igem_media_js_hardware_v2_js */
/* Rich previews are optional; all decisive evidence is already in the HTML. */
function revealLinkedAppendix() {
  let id;
  try { id=decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target=document.getElementById(id);
  if(!target)return;
  let opened=false;
  for(let ancestor=target;ancestor;ancestor=ancestor.parentElement){
    if(ancestor.tagName==='DETAILS'&&!ancestor.open){ancestor.open=true;opened=true;}
  }
  if(opened)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
}
window.addEventListener('hashchange',revealLinkedAppendix);
revealLinkedAppendix();

function updateOpticalSpectraLanguage() {
  const language = document.documentElement.lang === 'zh-Hant' ? 'zh-Hant' : 'en';
  const base = 'assets/hardware/optics-v38/spectral-alignment-' + language;
  document.querySelectorAll('[data-optics-spectral-image]').forEach(image => { image.src = __igem_media_js_hardware_v2_js(base + '.svg'); });
  document.querySelectorAll('[data-optics-spectral-link]').forEach(link => { link.href = __igem_media_js_hardware_v2_js(base + '.svg'); });
  document.querySelectorAll('[data-optics-spectral-png]').forEach(link => { link.href = __igem_media_js_hardware_v2_js(base + '.png'); });
}
document.addEventListener('aerosense:languagechange', updateOpticalSpectraLanguage);
updateOpticalSpectraLanguage();
document.querySelectorAll('details[data-hw-v2-preview]').forEach((details) => {
  details.addEventListener('toggle', () => {
    const frame = details.querySelector('iframe[data-src]');
    if (!frame) return;
    if (details.open) {
      if (!frame.hasAttribute('src')) frame.src = frame.dataset.src;
    } else {
      frame.removeAttribute('src');
    }
  });
});
document.querySelectorAll('[data-hw-v2-assembly]').forEach((host) => {
  let viewer, loading;
  async function loadAssembly() {
    if (viewer) return;
    if (loading) return;
    loading = true;
    const status = host.querySelector('[data-hw-v2-status]');
    status.textContent = 'Loading the eight current CAD parts…';
    try {
      const module = await import('./hardware-v2-viewer.js?v=8bd15c030e593776');
      viewer = await module.createViewer(host);
      host.classList.add('is-ready');
      status.textContent = 'Drag to rotate · arrow keys rotate · + / − zoom · separate parts with the slider.';
    } catch (error) {
      host.classList.add('is-unavailable');
      status.textContent = 'The 3D view is unavailable on this device. Use the assembly drawing and eight source STLs below.';
      console.warn('CAD preview unavailable', error);
    } finally { loading = false; }
  }
  // Show the product without an extra click; defer its geometry until the stage is nearby.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); loadAssembly(); }
    }, {rootMargin:'400px'});
    observer.observe(host);
  } else loadAssembly();
});
