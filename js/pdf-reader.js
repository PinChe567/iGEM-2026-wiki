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
    en: { previous: 'Previous', next: 'Next', page: 'Page', zoomOut: 'Zoom out', zoomIn: 'Zoom in', fit: 'Fit width', fitPage: 'Fit page', thumbnails: 'Page thumbnails', thumbnailFailed: 'Thumbnail unavailable', download: 'Download PDF', waiting: 'PDF preview loads when it comes into view.', loading: 'Loading PDF…', drawing: 'Rendering page…', failed: 'The preview could not load. Retry or open the original PDF.', retry: 'Retry', text: 'Page text', of: 'of' },
    zh: { previous: '上一頁', next: '下一頁', page: '頁碼', zoomOut: '縮小', zoomIn: '放大', fit: '符合寬度', fitPage: '符合頁面', thumbnails: '頁面縮圖', thumbnailFailed: '縮圖無法載入', download: '下載 PDF', waiting: '捲動至此處時載入 PDF 預覽。', loading: '正在載入 PDF…', drawing: '正在顯示頁面…', failed: '無法載入預覽。請重試或開啟原始 PDF。', retry: '重試', text: '本頁文字', of: '/' }
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
    container.querySelectorAll('a[data-pdf-preview-src]').forEach(function (link) {
      try {
        var preview = new URL(link.getAttribute('data-pdf-preview-src'), document.baseURI);
        if (allowedDocument(preview)) link.href = preview.href;
      } catch (_) { /* Keep the published link if the preview URL is invalid. */ }
    });
  }
  function allowedDocument(url) {
    return /\.pdf$/i.test(url.pathname) && (
      url.origin === location.origin ||
      (url.protocol === 'https:' && url.hostname === 'static.igem.wiki')
    );
  }
  function enhance(frame) {
    if (frame._aeroSensePdfReader) return frame._aeroSensePdfReader;
    if (!frame.isConnected) return null;
    var source;
    try {
      source = new URL(frame.getAttribute('data-pdf-preview-src') || frame.getAttribute('src') || frame.getAttribute('data-src'), document.baseURI);
      if (!allowedDocument(source)) return;
      source.hash = '';
    } catch (_) { return; }
    var documentMode = document.body.dataset.pdfPresentation === 'document';
    frame.dataset.pdfReaderEnhanced = 'true';
    var documentCard = frame.closest('.hw-manual-document, .pdf-preview, .ent-document, .hp-document') || frame.parentElement;
    localDocumentLinks(documentCard);
    var downloadSource = documentCard.querySelector('a[download][href*=".pdf"], a[data-pdf-preview-src][href*=".pdf"]');
    var title = (window.AeroSenseI18n ? window.AeroSenseI18n.sourceAttribute(frame, 'title') : frame.getAttribute('title')) || 'PDF';
    var root = node('div', 'pdf-reader');
    if (documentMode) root.classList.add('pdf-reader--document');
    root.setAttribute('translate', 'no');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', title);
    root.dataset.pdfReaderSource = source.href;
    root.dataset.pdfReaderState = 'waiting';
    var toolbar = node('div', 'pdf-reader__toolbar', root);
    var sidebarToggle, fileTitle, zoomValue, workspace, sidebar, thumbnailList;
    var thumbnails = [], thumbnailQueue = [], thumbnailBusy = false, thumbnailObserver;
    var sidebarOpen = documentMode && window.innerWidth > 600;
    var renderedScale = 1;
    if (documentMode) {
      sidebarToggle = button(toolbar, 'thumbnails');
      sidebarToggle.classList.add('pdf-reader__sidebar-toggle');
      sidebarToggle.dataset.pdfIcon = 'true';
      sidebarToggle.textContent = '☰';
      fileTitle = node('span', 'pdf-reader__filename', toolbar);
      try { fileTitle.textContent = decodeURIComponent(source.pathname.split('/').pop()); }
      catch (_) { fileTitle.textContent = 'PDF'; }
      fileTitle.title = title;
    }
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
    if (documentMode) {
      previous.dataset.pdfIcon = next.dataset.pdfIcon = 'true';
      previous.textContent = '‹'; next.textContent = '›';
    }
    var zoomControls = node('div', 'pdf-reader__zoom', toolbar);
    var zoomOut = button(zoomControls, 'zoomOut'); zoomOut.textContent = '−';
    if (documentMode) zoomValue = node('span', 'pdf-reader__zoom-value', zoomControls);
    var fit = button(zoomControls, 'fit');
    if (documentMode) {
      fit.dataset.pdfLabel = 'fitPage'; fit.dataset.pdfIcon = 'true';
      fit.textContent = '▣';
    }
    var zoomIn = button(zoomControls, 'zoomIn'); zoomIn.textContent = '+';
    var download = node('a', 'pdf-reader__download', toolbar);
    download.href = downloadSource ? downloadSource.href : source.href;
    download.setAttribute('download', ''); download.target = '_blank'; download.rel = 'noopener';
    var status = node('p', 'pdf-reader__status', root);
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    var retry = button(root, 'retry'); retry.hidden = true;
    if (documentMode) {
      workspace = node('div', 'pdf-reader__workspace', root);
      sidebar = node('nav', 'pdf-reader__sidebar', workspace);
      sidebar.id = 'pdf-thumbnails-' + (readers.length + 1);
      sidebar.hidden = !sidebarOpen;
      sidebarToggle.setAttribute('aria-controls', sidebar.id);
      sidebarToggle.setAttribute('aria-expanded', String(sidebarOpen));
      root.classList.toggle('pdf-reader--sidebar-open', sidebarOpen);
      thumbnailList = node('ol', 'pdf-reader__thumbnails', sidebar);
    }
    var stage = node('div', 'pdf-reader__stage', workspace || root);
    stage.tabIndex = 0; stage.setAttribute('aria-label', title);
    var canvas = node('canvas', 'pdf-reader__canvas', stage);
    canvas.hidden = true; canvas.setAttribute('aria-hidden', 'true');
    var readiness = window.AeroSenseMediaLoader ? window.AeroSenseMediaLoader.create(stage, root, 'pdf', function () { pdf ? render() : start(); }, download.href) : null;
    // The document card already supplies Open; the reader supplies one Download.
    documentCard.querySelectorAll('a[download][href*=".pdf"]').forEach(function (link) { link.hidden = true; });
    var nativeFallback = documentCard.querySelector('.pdf-preview__fallback'); if (nativeFallback) nativeFallback.hidden = true;
    var transcript = node('div', 'pdf-reader__text', root);
    transcript.setAttribute('role', 'document');
    var pdf = null, loading = false, pageNumber = 1, zoom = 1;
    var renderTask = null, renderChain = Promise.resolve(), revision = 0;
    var statusKey = 'waiting', lastWidth = 0, lastHeight = 0, resizeTimer;
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
      var currentTitle = window.AeroSenseI18n ? window.AeroSenseI18n.t(title) : title;
      root.setAttribute('aria-label', currentTitle); stage.setAttribute('aria-label', currentTitle);
      root.querySelectorAll('[data-pdf-label]').forEach(function (control) {
        var key = control.dataset.pdfLabel;
        control.setAttribute('aria-label', w[key]); control.title = w[key];
        if (key !== 'zoomIn' && key !== 'zoomOut' && !control.dataset.pdfIcon) control.textContent = w[key];
      });
      labelText.textContent = w.page;
      pageInput.setAttribute('aria-label', w.page);
      pageTotal.textContent = pdf ? w.of + ' ' + pdf.numPages : '/ —';
      transcript.setAttribute('aria-label', w.text);
      download.textContent = w.download;
      status.textContent = statusKey ? w[statusKey] : w.page + ' ' + pageNumber + ' ' + w.of + ' ' + pdf.numPages + ' · ' + Math.round((documentMode ? renderedScale : zoom) * 100) + '%';
      previous.disabled = !pdf || pageNumber <= 1;
      next.disabled = !pdf || pageNumber >= pdf.numPages;
      pageInput.disabled = !pdf;
      zoomOut.disabled = !pdf || zoom <= 0.75;
      zoomIn.disabled = !pdf || zoom >= 2.5;
      fit.disabled = !pdf;
      if (pdf) pageInput.max = String(pdf.numPages);
      pageInput.value = String(pageNumber);
      if (documentMode) {
        sidebar.setAttribute('aria-label', w.thumbnails);
        fileTitle.title = currentTitle;
        zoomValue.textContent = pdf ? Math.round(renderedScale * 100) + '%' : '—';
        thumbnails.forEach(function (entry) {
          entry.button.setAttribute('aria-label', w.page + ' ' + entry.number + (entry.failed ? ' · ' + w.thumbnailFailed : ''));
          entry.button.setAttribute('aria-current', entry.number === pageNumber ? 'page' : 'false');
        });
      }
    }
    function queueThumbnail(entry) {
      if (!entry || entry.ready || entry.queued || entry.failed) return;
      entry.queued = true;
      thumbnailQueue.push(entry);
      drawThumbnails();
    }
    async function drawThumbnails() {
      if (!documentMode || thumbnailBusy || !pdf || !sidebarOpen || !expanded()) return;
      thumbnailBusy = true;
      while (thumbnailQueue.length && sidebarOpen && expanded()) {
        var entry = thumbnailQueue.shift();
        entry.button.setAttribute('aria-busy', 'true');
        try {
          var page = await pdf.getPage(entry.number);
          var base = page.getViewport({ scale: 1 });
          var viewport = page.getViewport({ scale: 112 / base.width });
          var scale = Math.min(window.devicePixelRatio || 1, 1.5);
          entry.canvas.width = Math.ceil(viewport.width * scale);
          entry.canvas.height = Math.ceil(viewport.height * scale);
          entry.canvas.style.aspectRatio = base.width + ' / ' + base.height;
          var task = page.render({ canvasContext: entry.canvas.getContext('2d'), viewport: viewport, transform: [scale, 0, 0, scale, 0, 0], background: 'rgb(255,255,255)' });
          await task.promise;
          entry.ready = true;
          entry.button.classList.add('is-ready');
          entry.button.dataset.pdfThumbnailState = 'ready';
        } catch (_) {
          entry.failed = true;
          entry.button.dataset.pdfThumbnailState = 'error';
        } finally {
          entry.queued = false;
          entry.button.setAttribute('aria-busy', 'false');
        }
      }
      thumbnailBusy = false;
      refresh();
    }
    function initThumbnails() {
      if (!documentMode || thumbnails.length) return;
      for (var number = 1; number <= pdf.numPages; number++) {
        var item = node('li', '', thumbnailList);
        var control = node('button', 'pdf-reader__thumbnail', item);
        control.type = 'button';
        control.dataset.page = String(number);
        control.dataset.pdfThumbnailState = 'waiting';
        var thumbnail = node('canvas', 'pdf-reader__thumbnail-canvas', control);
        thumbnail.setAttribute('aria-hidden', 'true');
        // Portrait placeholders reserve space until the actual page ratio is known.
        thumbnail.width = 112; thumbnail.height = 158;
        var caption = node('span', 'pdf-reader__thumbnail-number', control);
        caption.textContent = String(number);
        thumbnails.push({ number: number, button: control, canvas: thumbnail, ready: false, queued: false, failed: false });
        control.addEventListener('click', function () { turn(Number(this.dataset.page)); });
        control.addEventListener('keydown', function (event) {
          var destination = Number(this.dataset.page);
          if (event.key === 'ArrowDown') destination++;
          else if (event.key === 'ArrowUp') destination--;
          else if (event.key === 'Home') destination = 1;
          else if (event.key === 'End') destination = pdf.numPages;
          else return;
          event.preventDefault();
          destination = Math.max(1, Math.min(pdf.numPages, destination));
          thumbnails[destination - 1].button.focus();
          turn(destination);
        });
      }
      if ('IntersectionObserver' in window) {
        thumbnailObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            queueThumbnail(thumbnails[Number(entry.target.dataset.page) - 1]);
            thumbnailObserver.unobserve(entry.target);
          });
        }, { root: sidebar, rootMargin: '100px 0px' });
        thumbnails.forEach(function (entry) { thumbnailObserver.observe(entry.button); });
      } else {
        sidebar.addEventListener('scroll', function () {
          var bounds = sidebar.getBoundingClientRect();
          thumbnails.forEach(function (entry) {
            var box = entry.button.getBoundingClientRect();
            if (box.bottom >= bounds.top - 100 && box.top <= bounds.bottom + 100) queueThumbnail(entry);
          });
        }, { passive: true });
        thumbnails.slice(0, 4).forEach(queueThumbnail);
      }
      queueThumbnail(thumbnails[pageNumber - 1]);
      refresh();
    }
    function updateSidebar() {
      sidebar.hidden = !sidebarOpen;
      sidebarToggle.setAttribute('aria-expanded', String(sidebarOpen));
      root.classList.toggle('pdf-reader--sidebar-open', sidebarOpen);
      if (sidebarOpen) {
        queueThumbnail(thumbnails[pageNumber - 1]);
        drawThumbnails();
      }
      if (pdf && expanded()) render();
    }
    function failed(error) {
      statusKey = 'failed'; retry.hidden = !!readiness; if (readiness) readiness.fail();
      root.dataset.pdfReaderState = 'error'; root.setAttribute('aria-busy', 'false'); refresh();
      console.warn('AeroSense PDF preview:', error && error.message ? error.message : error);
    }
    function render() {
      if (!pdf || !expanded()) return;
      var ticket = ++revision;
      if (renderTask) renderTask.cancel();
      root.dataset.pdfReaderState = 'rendering';
      statusKey = 'drawing'; root.setAttribute('aria-busy', 'true'); if (readiness) readiness.start(); refresh();
      renderChain = renderChain.catch(function () {}).then(async function () {
        if (ticket !== revision) return;
        var page = await pdf.getPage(pageNumber);
        if (ticket !== revision) return;
        var base = page.getViewport({ scale: 1 });
        var fitWidth = Math.max(documentMode ? 64 : 200, Math.min(900, stage.clientWidth - 32));
        var fitScale = fitWidth / base.width;
        if (documentMode) fitScale = Math.min(fitScale, Math.max(200, stage.clientHeight - 32) / base.height);
        var viewport = page.getViewport({ scale: fitScale * zoom });
        renderedScale = fitScale * zoom;
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
        await new Promise(function (resolve) { requestAnimationFrame(resolve); });
        if (ticket !== revision) return;
        if (readiness) readiness.finish();
        canvas.dataset.page = String(pageNumber);
        statusKey = ''; retry.hidden = true;
        root.dataset.pdfReaderState = 'ready'; root.setAttribute('aria-busy', 'false');
        refresh();
        // An inaccessible text layer must not replace a successfully drawn PDF
        // with an error screen. The original download remains available.
        var text = await page.getTextContent().catch(function () { return null; });
        if (ticket === revision) transcript.textContent = text ? text.items.map(function (item) { return item.str + (item.hasEOL ? '\n' : ' '); }).join('') : '';
      }).catch(function (error) {
        if (ticket !== revision || error.name === 'RenderingCancelledException') return;
        renderTask = null; failed(error);
      });
    }
    async function start() {
      if (loading || pdf || !expanded()) return;
      loading = true; statusKey = 'loading'; retry.hidden = true; if (readiness) readiness.start();
      root.dataset.pdfReaderState = 'loading'; root.setAttribute('aria-busy', 'true'); refresh();
      var request, deadline, expired = false;
      try {
        // A stalled network ends in a retry state; it never pretends to be ready.
        var timeout = new Promise(function (_, reject) { deadline = setTimeout(function () { expired = true; if (request) request.destroy(); reject(new Error('PDF loading timed out')); }, 60000); });
        pdf = await Promise.race([library().then(function (pdfjs) {
          if (expired) throw new Error('PDF loading timed out');
          // The published documents supply their fonts. Keep optional codecs
          // and eval disabled; the original PDF stays available for download.
          request = pdfjs.getDocument({ url: source.href, isEvalSupported: false, useWasm: false });
          return request.promise;
        }), timeout]);
        clearTimeout(deadline); loading = false; initThumbnails(); render();
      } catch (error) { clearTimeout(deadline); loading = false; failed(error); }
    }
    function turn(number) {
      if (!pdf) return;
      pageNumber = Math.max(1, Math.min(pdf.numPages, Math.round(number) || 1));
      if (documentMode && sidebarOpen) {
        var current = thumbnails[pageNumber - 1];
        queueThumbnail(current);
        if (current) {
          var bounds = sidebar.getBoundingClientRect();
          var selected = current.button.getBoundingClientRect();
          if (selected.top < bounds.top || selected.bottom > bounds.bottom) sidebar.scrollTop += selected.top - bounds.top - 20;
        }
      }
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
    if (documentMode) sidebarToggle.addEventListener('click', function () { sidebarOpen = !sidebarOpen; updateSidebar(); });
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
          if (documentMode && sidebarOpen) drawThumbnails();
          if (canvas.hidden || root.dataset.pdfReaderState !== 'ready' || Math.abs(stage.clientWidth - lastWidth) > 2) render();
        } else start();
      },
      setTitle: function (value) { title = value; root.setAttribute('aria-label', value); stage.setAttribute('aria-label', value); }
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
      var height = stage.clientHeight;
      if (Math.abs(width - lastWidth) < 2 && (!documentMode || Math.abs(height - lastHeight) < 2)) return;
      lastWidth = width; lastHeight = height; clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { if (pdf && expanded()) render(); }, 120);
    }).observe(stage);
    return controller;
  }
  function init() {
    localDocumentLinks(document);
    if (document.body.dataset.pdfPresentation === 'document') {
      document.querySelectorAll('main iframe[src*=".pdf"], main iframe[data-src*=".pdf"], main iframe[data-pdf-preview-src*=".pdf"]').forEach(enhance);
      return;
    }
    document.querySelectorAll('iframe.hw-v2-preview').forEach(enhance);
    document.querySelectorAll('.ent-document iframe[src*=".pdf"], .ent-document iframe[data-src*=".pdf"]').forEach(enhance);
  }
  document.addEventListener('aerosense:languagechange', function () { readers.forEach(function (reader) { reader.refresh(); }); });
  // main.js first records the existing PDF frames to avoid duplicate attachment
  // previews. Deferred scripts run at readyState=interactive, before that event.
  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.AeroSensePdfReader = { enhance: enhance };
}());
