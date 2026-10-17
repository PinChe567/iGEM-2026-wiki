/* BEGIN IGEM STATIC MEDIA MAP __igem_media_js_hardware_pcb_flow_js */
function __igem_media_js_hardware_pcb_flow_js(value) {
  var original = value, text = String(value), split = text.search(/[?#]/);
  var key = split < 0 ? text : text.slice(0, split), suffix = split < 0 ? "" : text.slice(split);
  try { key = decodeURIComponent(key); } catch (_) { return original; }
  key = key.replace(/^(?:\.\/)+/, "");
  var urls = {"../assets/hardware/pcb-flow-v32/pcb-flow-stacked-en.svg":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/7bccc8568c57-pcb-flow-stacked-en.svg","../assets/hardware/pcb-flow-v32/pcb-flow-stacked-zh-Hant.svg":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/d1e75e21fc26-pcb-flow-stacked-zh-hant.svg","../assets/hardware/pcb-flow-v32/pcb-flow-wide-en.svg":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/8b9a9220e30d-pcb-flow-wide-en.svg","../assets/hardware/pcb-flow-v32/pcb-flow-wide-zh-Hant.svg":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/a84d576e5069-pcb-flow-wide-zh-hant.svg","assets/hardware/pcb-flow-v32/pcb-flow-stacked-en.svg":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/7bccc8568c57-pcb-flow-stacked-en.svg","assets/hardware/pcb-flow-v32/pcb-flow-stacked-zh-Hant.svg":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/d1e75e21fc26-pcb-flow-stacked-zh-hant.svg","assets/hardware/pcb-flow-v32/pcb-flow-wide-en.svg":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/8b9a9220e30d-pcb-flow-wide-en.svg","assets/hardware/pcb-flow-v32/pcb-flow-wide-zh-Hant.svg":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/a84d576e5069-pcb-flow-wide-zh-hant.svg"};
  var target = urls[key]; if (!target) return original;
  var hashAt = target.indexOf("#"), savedHash = hashAt < 0 ? "" : target.slice(hashAt);
  if (hashAt >= 0) target = target.slice(0, hashAt);
  var suffixHash = suffix.indexOf("#"), query = suffixHash < 0 ? suffix : suffix.slice(0, suffixHash);
  if (query) target += (target.indexOf("?") < 0 ? "?" : "&") + query.slice(1);
  return target + (suffixHash < 0 ? savedHash : suffix.slice(suffixHash));
}
/* END IGEM STATIC MEDIA MAP __igem_media_js_hardware_pcb_flow_js */
/* Localized schematic artwork; responsive source selection is handled by picture. */
(() => {
  const picture = document.querySelector('[data-pcb-flow]');
  if (!picture) return;
  const source = picture.querySelector('source');
  const image = picture.querySelector('img');
  const link = document.querySelector('[data-pcb-flow-link]');
  function update() {
    const lang = document.documentElement.lang === 'zh-Hant' ? 'zh-Hant' : 'en';
    const base = 'assets/hardware/pcb-flow-v32/pcb-flow-';
    const wide = __igem_media_js_hardware_pcb_flow_js(base + 'wide-' + lang + '.svg');
    const stacked = __igem_media_js_hardware_pcb_flow_js(base + 'stacked-' + lang + '.svg');
    if (source.getAttribute('srcset') !== stacked) source.setAttribute('srcset', stacked);
    if (image.getAttribute('src') !== wide) image.setAttribute('src', wide);
    if (link.getAttribute('href') !== wide) link.setAttribute('href', wide);
  }
  document.addEventListener('aerosense:languagechange', update);
  update();
})();
