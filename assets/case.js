// Shared behaviour for case study pages
document.addEventListener('DOMContentLoaded', function () {
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  var hdr = document.getElementById('hdr');
  if (hdr) {
    addEventListener('scroll', function () {
      hdr.classList.toggle('scrolled', scrollY > 8);
    }, { passive: true });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el, i) {
    el.style.transitionDelay = Math.min(i % 5, 4) * 50 + 'ms';
    io.observe(el);
  });

  // ---------- lightbox: click any screenshot to view it full size ----------
  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot.filled img'));
  if (shots.length) {
    var icon = {
      close: '<path d="M18 6 6 18M6 6l12 12"/>',
      prev: '<path d="M15 18l-6-6 6-6"/>',
      next: '<path d="M9 18l6-6-6-6"/>',
      zoom: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/>'
    };
    function svg(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; }

    var lb = document.createElement('div');
    lb.className = 'lb' + (shots.length === 1 ? ' single' : '');
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Screenshot viewer');
    lb.innerHTML =
      '<div class="lb-bar"><span class="lb-count"></span><div class="lb-tools">' +
      '<button class="lb-btn lb-zoom" type="button" aria-label="Toggle actual size">' + svg(icon.zoom) + '</button>' +
      '<button class="lb-btn lb-close" type="button" aria-label="Close">' + svg(icon.close) + '</button>' +
      '</div></div>' +
      '<div class="lb-stage"><img alt=""></div>' +
      '<p class="lb-cap"></p>' +
      '<button class="lb-btn lb-nav lb-prev" type="button" aria-label="Previous screenshot">' + svg(icon.prev) + '</button>' +
      '<button class="lb-btn lb-nav lb-next" type="button" aria-label="Next screenshot">' + svg(icon.next) + '</button>';
    document.body.appendChild(lb);

    var img = lb.querySelector('.lb-stage img');
    var stage = lb.querySelector('.lb-stage');
    var cap = lb.querySelector('.lb-cap');
    var count = lb.querySelector('.lb-count');
    var idx = 0, lastFocus = null;

    function show(i) {
      idx = (i + shots.length) % shots.length;
      var s = shots[idx];
      var fig = s.closest('figure');
      var fc = fig && fig.querySelector('figcaption');
      lb.classList.remove('zoomed');
      img.src = s.currentSrc || s.src;
      img.alt = s.alt;
      cap.textContent = fc ? fc.textContent : s.alt;
      count.textContent = (idx + 1) + ' / ' + shots.length;
      stage.scrollTop = 0; stage.scrollLeft = 0;
      // warm the neighbours so arrowing through feels instant
      [idx + 1, idx - 1].forEach(function (n) { var t = shots[(n + shots.length) % shots.length]; (new Image()).src = t.src; });
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add('open');
      document.body.classList.add('lb-lock');
      lb.querySelector('.lb-close').focus();
    }
    function close() {
      lb.classList.remove('open', 'zoomed');
      document.body.classList.remove('lb-lock');
      if (lastFocus) lastFocus.focus();
    }
    function zoom() { lb.classList.toggle('zoomed'); }

    shots.forEach(function (s, i) {
      var box = s.closest('.shot');
      box.setAttribute('tabindex', '0');
      box.setAttribute('role', 'button');
      box.setAttribute('aria-label', 'View full size: ' + (s.alt || 'screenshot'));
      box.addEventListener('click', function () { open(i); });
      box.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.querySelector('.lb-zoom').addEventListener('click', zoom);
    img.addEventListener('click', zoom);
    // click on the dark backdrop (not the image) closes
    stage.addEventListener('click', function (e) { if (e.target === stage) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(lb.querySelectorAll('button'), function (b) { return b.offsetParent !== null; });
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // swipe left/right on touch screens (ignored while zoomed, so panning works)
    var sx = null, sy = null;
    stage.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (sx === null || lb.classList.contains('zoomed')) { sx = null; return; }
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }
});
