(function () {
  'use strict';
  var details = Array.from(document.querySelectorAll('.re-detail'));
  document.querySelectorAll('[data-re-expand]').forEach(function (button) {
    button.addEventListener('click', function () {
      details.forEach(function (detail) { detail.open = button.dataset.reExpand === 'true'; });
    });
  });
  // Preserve the research cycle when switching languages.
  document.querySelectorAll('[data-re-language]').forEach(function (link) {
    link.addEventListener('click', function () { link.hash = window.location.hash; });
  });
  var lightbox = document.querySelector('.re-lightbox');
  if (lightbox && lightbox.showModal) {
    var scale = lightbox.querySelector('input');
    var picture = lightbox.querySelector('img');
    var opener;
    document.querySelectorAll('[data-re-zoom]').forEach(function (button) {
      button.addEventListener('click', function () {
        opener = button;
        var source = button.querySelector('img');
        picture.src = source.currentSrc || source.src;
        picture.alt = source.alt;
        picture.style.width = '100%';
        scale.value = '100';
        lightbox.querySelector('output').value = '100%';
        lightbox.querySelector('.re-lightbox-caption').textContent = button.closest('figure').querySelector('figcaption').textContent;
        lightbox.showModal();
      });
    });
    scale.addEventListener('input', function () {
      picture.style.width = scale.value + '%';
      lightbox.querySelector('output').value = scale.value + '%';
    });
    lightbox.querySelector('[data-re-close]').addEventListener('click', function () { lightbox.close(); });
    lightbox.addEventListener('close', function () { if (opener) opener.focus(); });
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) {
        var rect = lightbox.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) lightbox.close();
      }
    });
  }
  var printState;
  window.addEventListener('beforeprint', function () {
    printState = details.map(function (detail) { return detail.open; });
    details.forEach(function (detail) { detail.open = true; });
  });
  window.addEventListener('afterprint', function () {
    if (printState) details.forEach(function (detail, index) { detail.open = printState[index]; });
  });
})();
