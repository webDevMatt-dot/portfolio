/*
 * Portfolio ↔ Godji Command.
 *  - Counts visits and CV downloads (anonymous: no cookies, no ads, no third parties).
 *  - "?r=code" links say which company or recruiter a visit came from.
 *  - The CV button offers an optional "who's downloading?" form.
 *  - Projects and page text load from Godji Command, so they can be edited
 *    there without touching code. The HTML stays as the fallback.
 * Include with: <script src="assets/pf.js" data-root="" defer></script>
 * (case study pages use data-root="../").
 */
(function () {
  var me = document.currentScript || document.querySelector('script[src*="pf.js"]');
  var API = (me && me.dataset.api) || 'https://godjitech.com';
  var ROOT = (me && me.dataset.root) || '';

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function paras(s) { return String(s || '').split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean).map(function (p) { return '<p>' + md(p).replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function abs(u) { return /^https?:/.test(u) ? u : ROOT + String(u).replace(/^\/+/, ''); }

  // ---- who: an anonymous id for this browser, plus the tracked-link code if any ----
  var vid = store('pf_vid');
  if (!vid) { vid = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)); store('pf_vid', vid); }
  var url = new URL(location.href);
  var r = (url.searchParams.get('r') || '').toLowerCase();
  if (/^[a-z0-9][a-z0-9-]{0,40}$/.test(r)) {
    store('pf_ref', r);
    // Tidy the address so the code isn't passed on if they share the page.
    url.searchParams.delete('r');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
  var ref = store('pf_ref');
  var page = location.pathname.replace(/^.*?\/portfolio\//, '').replace(/^\//, '') + (location.pathname.indexOf('project.html') > -1 ? location.search : '');

  function send(kind, extra) {
    var body = JSON.stringify(Object.assign({ kind: kind, page: page, ref: ref, vid: vid, referrer: document.referrer }, extra || {}));
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(API + '/api/portfolio/track', body)) return;
    } catch (e) { /* fall through */ }
    try { fetch(API + '/api/portfolio/track', { method: 'POST', body: body, keepalive: true, mode: 'no-cors' }); } catch (e) { /* offline */ }
  }
  send('view');

  // Clicks on outside links (live sites, app stores, GitHub, LinkedIn…)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.dataset.pfCv) return;
    var h;
    try { h = new URL(a.href, location.href); } catch (err) { return; }
    if (h.host === location.host || !/^https?:/.test(h.protocol)) return;
    var card = a.closest('.proj');
    send('link', { target: h.hostname.replace(/^www\./, '') + (h.hostname.indexOf('apple.com') > -1 ? ' (App Store)' : h.hostname.indexOf('play.google') > -1 ? ' (Google Play)' : ''), project: card && card.dataset.slug });
  }, true);

  // ---- CV: counted download, with an optional "who's this?" form ----
  var cvLink = API + '/api/portfolio/cv';
  function cvHref() { return cvLink + '?v=' + encodeURIComponent(vid) + (ref ? '&r=' + encodeURIComponent(ref) : '') + '&from=' + encodeURIComponent(page || 'home'); }
  function wireCv() {
    document.querySelectorAll('a[href*="Matthew_Gift_Luis_CV.pdf"], a[data-pf-cv]').forEach(function (a) {
      a.dataset.pfCv = '1';
      a.removeAttribute('download');
      a.href = cvHref();
      if (a.dataset.pfWired) return;
      a.dataset.pfWired = '1';
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || store('pf_lead')) return; // already said who they are, or opening in a new tab
        e.preventDefault();
        openCvForm(a.href);
      });
    });
  }

  var css = '.pf-dlg{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(4,5,8,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .2s}' +
    '.pf-dlg.on{opacity:1}.pf-box{width:100%;max-width:420px;background:var(--surface,#101318);border:1px solid var(--line-2,#2a3242);border-radius:18px;padding:26px;box-shadow:0 30px 80px rgba(0,0,0,.5);transform:translateY(8px);transition:transform .2s}' +
    '.pf-dlg.on .pf-box{transform:none}.pf-box h3{font-size:20px;margin:0 0 6px;color:var(--text,#e6e9ef)}.pf-box p{font-size:14px;color:var(--muted,#9aa3b1);margin:0 0 16px}' +
    '.pf-box label{display:block;font-size:12px;color:var(--muted,#9aa3b1);margin:10px 0 5px}.pf-box input{width:100%;box-sizing:border-box;background:var(--bg,#08090c);border:1px solid var(--line-2,#2a3242);border-radius:10px;padding:11px 12px;color:var(--text,#e6e9ef);font:inherit;font-size:14px}' +
    '.pf-box input:focus{outline:none;border-color:var(--accent,#e8eaed)}.pf-row{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}.pf-row button{flex:1;min-height:44px;border-radius:99px;font:inherit;font-size:14px;font-weight:600;cursor:pointer}' +
    '.pf-go{background:var(--accent,#e8eaed);color:#0b0b0c;border:0}.pf-skip{background:transparent;color:var(--text,#e6e9ef);border:1px solid var(--line-2,#2a3242)}.pf-x{position:absolute;opacity:0;pointer-events:none;height:0}' +
    '.pf-note{font-size:11.5px!important;margin:14px 0 0!important;color:var(--dim,#7f8896)!important}';
  function openCvForm(href) {
    if (!document.getElementById('pf-css')) { var st = document.createElement('style'); st.id = 'pf-css'; st.textContent = css; document.head.appendChild(st); }
    var last = document.activeElement;
    var d = document.createElement('div');
    d.className = 'pf-dlg';
    d.innerHTML = '<form class="pf-box" role="dialog" aria-modal="true" aria-labelledby="pf-t">' +
      '<h3 id="pf-t">Downloading my CV</h3><p>Mind telling me who you are? It\'s optional: you can skip straight to the download.</p>' +
      '<label for="pf-n">Your name</label><input id="pf-n" name="name" autocomplete="name">' +
      '<label for="pf-c">Company</label><input id="pf-c" name="company" autocomplete="organization">' +
      '<label for="pf-e">Email</label><input id="pf-e" name="email" type="email" autocomplete="email">' +
      '<input class="pf-x" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="pf-row"><button type="button" class="pf-skip">Skip</button><button type="submit" class="pf-go">Download CV</button></div>' +
      '<p class="pf-note">Only I see this. I won\'t add you to any mailing list.</p></form>';
    document.body.appendChild(d);
    requestAnimationFrame(function () { d.classList.add('on'); d.querySelector('#pf-n').focus(); });
    function close() { d.remove(); document.removeEventListener('keydown', onKey); if (last && last.focus) last.focus(); }
    function go() { close(); location.href = href; }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    d.querySelector('.pf-skip').addEventListener('click', go);
    d.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var el = f.elements;
      var data = { name: el.namedItem('name').value.trim(), company: el.namedItem('company').value.trim(), email: el.namedItem('email').value.trim(), website: el.namedItem('website').value, ref: ref, vid: vid, page: page };
      if (data.name || data.company || data.email) {
        store('pf_lead', '1');
        try { fetch(API + '/api/portfolio/lead', { method: 'POST', body: JSON.stringify(data), keepalive: true }); } catch (err) { /* still download */ }
      }
      go();
    });
  }
  wireCv();

  // ---- live content from Godji Command ----
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var OUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  function studyHref(p) { return p.case_study_url ? abs(p.case_study_url) : p.body ? ROOT + 'case-studies/project.html?p=' + encodeURIComponent(p.slug) : null; }
  function card(p, i) {
    var thumb = p.shots && p.shots.length
      ? '<div class="proj-thumb' + (p.phones ? ' phones' : '') + '">' + (p.phones ? p.shots.slice(0, 3) : p.shots.slice(0, 1)).map(function (s) { return '<img src="' + esc(abs(s)) + '" alt="' + (p.phones ? '' : 'Screenshot of ' + esc(p.title)) + '" loading="lazy">'; }).join('') + '</div>'
      : '';
    var study = studyHref(p);
    var links = (study ? '<a class="proj-link study" href="' + esc(study) + '">Read case study ' + ARROW + '</a>' : '') +
      (p.links || []).map(function (l) { return '<a class="proj-link alt" href="' + esc(l.href) + '" target="_blank" rel="noopener">' + esc(l.label) + ' ' + OUT + '</a>'; }).join('');
    return '<article class="proj' + (p.featured ? ' featured' : '') + ' reveal in" data-cats="' + esc((p.categories || []).join(' ')) + '" data-slug="' + esc(p.slug) + '">' + thumb +
      '<div class="proj-top"><span class="proj-idx mono">' + String(i + 1).padStart(2, '0') + '</span>' + (p.type_label ? '<span class="proj-type">' + esc(p.type_label) + '</span>' : '') + '</div>' +
      (p.metric ? '<div class="proj-metric mono">' + esc(p.metric) + '</div>' : '') +
      '<h3>' + esc(p.title) + '</h3>' + (links ? '<div class="proj-links">' + links + '</div>' : '') +
      '<p>' + md(p.summary) + '</p>' +
      ((p.tags || []).length ? '<div class="tags">' + p.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' : '') + '</article>';
  }

  function apply(data) {
    var s = data.settings || {};
    if (s.cv_link) { cvLink = s.cv_link; wireCv(); }
    var el;
    if (s.status && (el = document.querySelector('[data-pf="status"]'))) el.innerHTML = '<span class="pulse"></span> ' + esc(s.status);
    if (s.hero_lede && (el = document.querySelector('[data-pf="hero_lede"]'))) el.innerHTML = md(s.hero_lede);
    if (s.about && (el = document.querySelector('[data-pf="about"]'))) el.innerHTML = paras(s.about);
    if (s.contact_text && (el = document.querySelector('[data-pf="contact_text"]'))) el.innerHTML = md(s.contact_text);
    if (s.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) { a.href = 'mailto:' + s.email; });
      document.querySelectorAll('[data-pf="email"]').forEach(function (e) { e.textContent = s.email; });
    }
    if (Array.isArray(s.experience) && s.experience.length && (el = document.querySelector('[data-pf="experience"]'))) {
      el.innerHTML = s.experience.map(function (x) {
        return '<div class="xp-item reveal in"><div class="xp-when mono">' + esc(x.when) + '</div><div><h3>' + esc(x.role) + (x.org ? ' <span>· ' + esc(x.org) + '</span>' : '') + '</h3><p>' + md(x.body) + '</p></div></div>';
      }).join('');
    }
    var grid = document.querySelector('.projects');
    if (grid && Array.isArray(data.projects) && data.projects.length) {
      grid.innerHTML = data.projects.map(card).join('');
      if (window.pfWork) window.pfWork();
    }
    if (window.pfProject) window.pfProject(data);
    document.dispatchEvent(new CustomEvent('pf:content', { detail: data }));
  }

  fetch(API + '/api/portfolio', { credentials: 'omit' })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) { if (data) apply(data); })
    .catch(function () { /* keep the built-in content */ });
})();
