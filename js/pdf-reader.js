/* AeroSense inline PDF reader. PDF.js 6.4.299 is vendored under Apache-2.0.
 * Upstream: https://github.com/mozilla/pdf.js/releases/tag/v6.4.299
 * The original PDF remains the document; only its current page is rendered.
 */
(function () {
  'use strict';
  var scriptUrl = document.currentScript.src;
  var libraryUrl = new URL('./vendor/pdfjs-6.4.299/pdf.mjs', scriptUrl).href;
  var workerUrl = new URL('./vendor/pdfjs-6.4.299/pdf.worker.mjs', scriptUrl).href;
  var libraryPromise;
  var readers = [];
  var words = {
    en: { previous: 'Previous', next: 'Next', page: 'Page', zoomOut: 'Zoom out', zoomIn: 'Zoom in', fit: 'Fit width', download: 'Download PDF', waiting: 'PDF preview loads when it comes into view.', loading: 'Loading PDF…', drawing: 'Rendering page…', failed: 'The preview could not load. Retry or open the original PDF.', retry: 'Retry', text: 'Page text', of: 'of' },
    zh: { previous: '上一頁', next: '下一頁', page: '頁碼', zoomOut: '縮小', zoomIn: '放大', fit: '符合寬度', download: '下載 PDF', waiting: '捲動至此處時載入 PDF 預覽。', loading: '正在載入 PDF…', drawing: '正在顯示頁面…', failed: '無法載入預覽。請重試或開啟原始 PDF。', retry: '重試', text: '本頁文字', of: '/' }
  };
  function language() { return /^zh/i.test(document.documentElement.lang || '') ? words.zh : words.en; }
  function library() {
    if (!libraryPromise) libraryPromise = import(libraryUrl).then(function (pdfjs) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    }).catch(function (error) { libraryPromise = null; throw error; });
    return libraryPromise;
  }
  function node(tag, className, parent) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (parent) parent.appendChild(element);
    return element;
  }
  function localDocumentLinks(container) {
    if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    container.querySelectorAll('a[data-pdf-preview-src]').forEach(function (link) {
      try {
        var preview = new URL(link.getAttribute('data-pdf-preview-src'), document.baseURI);
        if (preview.origin === location.origin && /\.pdf$/i.test(preview.pathname)) link.href = preview.href;
      } catch (_) { /* Keep the published link if the preview URL is invalid. */ }
    });
  }
  function enhance(frame) {
    if (frame._aeroSensePdfReader) return frame._aeroSensePdfReader;
    if (!frame.isConnected) return null;
    var source;
    try {
      source = new URL(frame.getAttribute('data-pdf-preview-src') || frame.getAttribute('src') || frame.getAttribute('data-src'), document.baseURI);
      if (!/\.pdf$/i.test(source.pathname) || source.origin !== location.origin) return;
      source.hash = '';
    } catch (_) { return; }
    frame.dataset.pdfReaderEnhanced = 'true';
    var documentCard = frame.closest('.hw-manual-document, .pdf-preview, .ent-document') || frame.parentElement;
    localDocumentLinks(documentCard);
    var downloadSource = documentCard.querySelector('a[download][href*=".pdf"], a[data-pdf-preview-src][href*=".pdf"]');
    var title = frame.getAttribute('title') || 'PDF';
    var root = node('div', 'pdf-reader');
    root.setAttribute('translate', 'no');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', title);
    root.dataset.pdfReaderSource = source.href;
    root.dataset.pdfReaderState = 'waiting';
    var toolbar = node('div', 'pdf-reader__toolbar', root);
    var navigation = node('div', 'pdf-reader__navigation', toolbar);
    function button(parent, key) {
      var control = node('button', 'pdf-reader__button', parent);
      control.type = 'button'; control.dataset.pdfLabel = key;
      return control;
    }
    var previous = button(navigation, 'previous');
    var pageLabel = node('label', 'pdf-reader__page-label', navigation);
    var labelText = node('span', '', pageLabel);
    var pageInput = node('input', 'pdf-reader__page-input', pageLabel);
    pageInput.type = 'number'; pageInput.min = '1'; pageInput.value = '1';
    pageInput.inputMode = 'numeric';
    var pageTotal = node('span', 'pdf-reader__total', pageLabel);
    var next = button(navigation, 'next');
    var zoomControls = node('div', 'pdf-reader__zoom', toolbar);
    var zoomOut = button(zoomControls, 'zoomOut'); zoomOut.textContent = '−';
    var fit = button(zoomControls, 'fit');
    var zoomIn = button(zoomControls, 'zoomIn'); zoomIn.textContent = '+';
    var download = node('a', 'pdf-reader__download', toolbar);
    download.href = downloadSource ? downloadSource.href : source.href;
    download.setAttribute('download', ''); download.target = '_blank'; download.rel = 'noopener';
    var status = node('p', 'pdf-reader__status', root);
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    var retry = button(root, 'retry'); retry.hidden = true;
    var stage = node('div', 'pdf-reader__stage', root);
    stage.tabIndex = 0; stage.setAttribute('aria-label', title);
    var canvas = node('canvas', 'pdf-reader__canvas', stage);
    canvas.hidden = true; canvas.setAttribute('aria-hidden', 'true');
    var transcript = node('div', 'pdf-reader__text', root);
    transcript.setAttribute('role', 'document');
    var pdf = null, loading = false, pageNumber = 1, zoom = 1;
    var renderTask = null, renderChain = Promise.resolve(), revision = 0;
    var statusKey = 'waiting', lastWidth = 0, resizeTimer;
    function expanded() {
      var parent = root.parentElement;
      while (parent) {
        if (parent.hidden) return false;
        if (parent.tagName === 'DETAILS' && !parent.open) return false;
        parent = parent.parentElement;
      }
      return root.isConnected;
    }
    function refresh() {
      var w = language();
      root.querySelectorAll('[data-pdf-label]').forEach(function (control) {
        var key = control.dataset.pdfLabel;
        control.setAttribute('aria-label', w[key]); control.title = w[key];
        if (key !== 'zoomIn' && key !== 'zoomOut') control.textContent = w[key];
      });
      labelText.textContent = w.page;
      pageInput.setAttribute('aria-label', w.page);
      pageTotal.textContent = pdf ? w.of + ' ' + pdf.numPages : '/ —';
      transcript.setAttribute('aria-label', w.text);
      download.textContent = w.download;
      status.textContent = statusKey ? w[statusKey] : w.page + ' ' + pageNumber + ' ' + w.of + ' ' + pdf.numPages + ' · ' + Math.round(zoom * 100) + '%';
      previous.disabled = !pdf || pageNumber <= 1;
      next.disabled = !pdf || pageNumber >= pdf.numPages;
      pageInput.disabled = !pdf;
      zoomOut.disabled = !pdf || zoom <= 0.75;
      zoomIn.disabled = !pdf || zoom >= 2.5;
      fit.disabled = !pdf;
      if (pdf) pageInput.max = String(pdf.numPages);
      pageInput.value = String(pageNumber);
    }
    function failed(error) {
      statusKey = 'failed'; retry.hidden = false;
      root.dataset.pdfReaderState = 'error'; root.setAttribute('aria-busy', 'false'); refresh();
      console.warn('AeroSense PDF preview:', error && error.message ? error.message : error);
    }
    function render() {
      if (!pdf || !expanded()) return;
      var ticket = ++revision;
      if (renderTask) renderTask.cancel();
      root.dataset.pdfReaderState = 'rendering';
      statusKey = 'drawing'; root.setAttribute('aria-busy', 'true'); refresh();
      renderChain = renderChain.catch(function () {}).then(async function () {
        if (ticket !== revision) return;
        var page = await pdf.getPage(pageNumber);
        if (ticket !== revision) return;
        var base = page.getViewport({ scale: 1 });
        var fitWidth = Math.max(200, Math.min(900, stage.clientWidth - 32));
        var viewport = page.getViewport({ scale: fitWidth / base.width * zoom });
        var outputScale = Math.min(window.devicePixelRatio || 1, 2);
        // Keep high-zoom canvases within a modest per-reader memory budget.
        outputScale = Math.min(outputScale, Math.sqrt(12000000 / (viewport.width * viewport.height)));
        canvas.width = Math.ceil(viewport.width * outputScale);
        canvas.height = Math.ceil(viewport.height * outputScale);
        canvas.style.width = Math.ceil(viewport.width) + 'px';
        canvas.style.height = Math.ceil(viewport.height) + 'px';
        canvas.hidden = false;
        renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport, transform: [outputScale, 0, 0, outputScale, 0, 0], background: 'rgb(255,255,255)' });
        await renderTask.promise;
        if (ticket !== revision) return;
        renderTask = null;
        canvas.dataset.page = String(pageNumber);
        statusKey = ''; retry.hidden = true;
        root.dataset.pdfReaderState = 'ready'; root.setAttribute('aria-busy', 'false');
        refresh();
        var text = await page.getTextContent();
        if (ticket === revision) transcript.textContent = text.items.map(function (item) { return item.str + (item.hasEOL ? '\n' : ' '); }).join('');
      }).catch(function (error) {
        if (ticket !== revision || error.name === 'RenderingCancelledException') return;
        renderTask = null; failed(error);
      });
    }
    async function start() {
      if (loading || pdf || !expanded()) return;
      loading = true; statusKey = 'loading'; retry.hidden = true;
      root.dataset.pdfReaderState = 'loading'; root.setAttribute('aria-busy', 'true'); refresh();
      try {
        var pdfjs = await library();
        // The published documents supply their fonts. Keep optional codecs and
        // eval disabled; the original PDF is always available for download.
        pdf = await pdfjs.getDocument({ url: source.href, isEvalSupported: false, useWasm: false }).promise;
        loading = false; render();
      } catch (error) { loading = false; failed(error); }
    }
    function turn(number) {
      if (!pdf) return;
      pageNumber = Math.max(1, Math.min(pdf.numPages, Math.round(number) || 1));
      stage.scrollTop = 0; stage.scrollLeft = 0; render();
    }
    previous.addEventListener('click', function () { turn(pageNumber - 1); });
    next.addEventListener('click', function () { turn(pageNumber + 1); });
    pageInput.addEventListener('change', function () { turn(Number(pageInput.value)); });
    pageInput.addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); turn(Number(pageInput.value)); } });
    zoomOut.addEventListener('click', function () { zoom = Math.max(0.75, zoom - 0.25); render(); });
    zoomIn.addEventListener('click', function () { zoom = Math.min(2.5, zoom + 0.25); render(); });
    fit.addEventListener('click', function () { zoom = 1; stage.scrollLeft = 0; render(); });
    retry.addEventListener('click', function () { pdf ? render() : start(); });
    stage.addEventListener('keydown', function (event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); turn(pageNumber + (event.key === 'ArrowRight' ? 1 : -1)); }
    });
    root.addEventListener('focusin', start, { once: true });
    frame.replaceWith(root);
    frame.removeAttribute('src');
    var controller = {
      root: root, refresh: refresh, start: start,
      setActive: function (active) {
        if (!active) {
          ++revision;
          if (renderTask) renderTask.cancel();
          root.setAttribute('aria-busy', 'false');
          return;
        }
        if (pdf) {
          if (canvas.hidden || root.dataset.pdfReaderState !== 'ready' || Math.abs(stage.clientWidth - lastWidth) > 2) render();
        } else start();
      },
      setTitle: function (value) { root.setAttribute('aria-label', value); stage.setAttribute('aria-label', value); }
    };
    frame._aeroSensePdfReader = controller;
    refresh(); readers.push(controller);
    // Native document cards also retain their page and canvas while folded.
    var disclosure = frame.classList.contains('pdf-preview__frame') ? null : root.parentElement;
    while (disclosure) {
      if (disclosure.tagName === 'DETAILS') disclosure.addEventListener('toggle', function () { controller.setActive(expanded()); });
      disclosure = disclosure.parentElement;
    }
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) { observer.disconnect(); start(); }
      }, { rootMargin: '240px 0px' });
      observer.observe(root);
    } else start();
    if ('ResizeObserver' in window) new ResizeObserver(function () {
      var width = stage.clientWidth;
      if (Math.abs(width - lastWidth) < 2) return;
      lastWidth = width; clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { if (pdf && expanded()) render(); }, 120);
    }).observe(stage);
    return controller;
  }
  function init() {
    localDocumentLinks(document);
    document.querySelectorAll('#hardware-topic-manual iframe.hw-v2-preview').forEach(enhance);
    document.querySelectorAll('.ent-document iframe[src*=".pdf"], .ent-document iframe[data-src*=".pdf"]').forEach(enhance);
  }
  document.addEventListener('aerosense:languagechange', function () { readers.forEach(function (reader) { reader.refresh(); }); });
  // main.js first records the existing PDF frames to avoid duplicate attachment
  // previews. Deferred scripts run at readyState=interactive, before that event.
  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.AeroSensePdfReader = { enhance: enhance };
}());
