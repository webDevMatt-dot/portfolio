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
});
