(() => {
  const d = document, root = d.documentElement;
  root.classList.add('js');
  let I18N = {};
  try { I18N = JSON.parse(d.getElementById('cv-i18n').textContent); } catch (e) { /* no strings */ }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) root.classList.add('no-motion');

  /* every new page opens at the top (back and forward keep their place, an #anchor keeps its target) */
  const toTop = () => {
    if (location.hash) return;
    let type = 'navigate';
    try { type = (performance.getEntriesByType('navigation')[0] || {}).type || 'navigate'; } catch (e) { /* old browser */ }
    if (type === 'back_forward') return;
    window.scrollTo(0, 0);
    try { d.documentElement.scrollIntoView({ block: 'start' }); } catch (e) { /* not supported */ }
  };
  toTop();
  addEventListener('load', toTop, { once: true });
  addEventListener('pageshow', (e) => { if (!e.persisted) toTop(); });

  /* header height for the hero */
  const hdr = d.querySelector('.hdr');
  const setH = () => hdr && root.style.setProperty('--hh', hdr.offsetHeight + 'px');
  setH();
  if (hdr && 'ResizeObserver' in window) new ResizeObserver(setH).observe(hdr);

  /* remembered language: only when arriving at the main home page from outside */
  const LKEY = 'corvamed-lang', cur = root.lang;
  try {
    const saved = localStorage.getItem(LKEY);
    const fromOutside = !d.referrer || new URL(d.referrer).origin !== location.origin;
    if (saved && saved !== cur && fromOutside && root.dataset.page === 'home' && cur === 'en') {
      const alt = d.querySelector(`.lang__menu a[hreflang="${saved}"]`);
      if (alt) location.replace(alt.href);
    }
  } catch (e) { /* storage unavailable */ }

  /* dropdowns: language menu and the country select share closing rules */
  const openers = new Set();
  const closeAll = (except) => openers.forEach((o) => { if (o !== except) o.close(); });
  d.addEventListener('click', (e) => openers.forEach((o) => { if (!o.el.contains(e.target)) o.close(); }));
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape') openers.forEach((o) => { if (o.isOpen()) { o.close(); o.btn.focus(); } }); });
  addEventListener('resize', () => closeAll());

  const lang = d.querySelector('.lang');
  if (lang) {
    const btn = lang.querySelector('.lang__btn'), menu = lang.querySelector('.lang__menu');
    const o = { el: lang, btn, isOpen: () => btn.getAttribute('aria-expanded') === 'true', close() { btn.setAttribute('aria-expanded', 'false'); menu.hidden = true; } };
    openers.add(o);
    btn.addEventListener('click', () => { const open = !o.isOpen(); closeAll(o); btn.setAttribute('aria-expanded', String(open)); menu.hidden = !open; if (open) menu.querySelector('[aria-current="true"], a').focus(); });
    menu.addEventListener('keydown', (e) => {
      const items = [...menu.querySelectorAll('a')], i = items.indexOf(d.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      if (e.key === 'Tab') o.close();
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { try { localStorage.setItem(LKEY, a.hreflang); } catch (e) {} o.close(); }));
  }

  /* the light: spectrum bands through glass, slow as the sun */
  const lights = [...d.querySelectorAll('canvas.light')];
  const pauseBtns = [...d.querySelectorAll('.pause')];
  let paused = reduce.matches;
  const cols = ['--spec-1', '--spec-2', '--spec-3', '--spec-4'].map((v) => getComputedStyle(root).getPropertyValue(v).trim());
  const scenes = lights.map((c) => ({ c, ctx: c.getContext('2d'), vis: true, mode: c.dataset.mode || 'foot' }));
  const draw = (s, t) => {
    const { c, ctx } = s, dpr = Math.min(devicePixelRatio || 1, 2);
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const drift = (t / 60000) % 1;
    const band = Math.max(w, h) * 0.07;
    const y0 = s.mode === 'foot' ? h * 0.72 : h * 0.5;
    ctx.save();
    ctx.translate(w * (0.5 + Math.sin(drift * Math.PI * 2) * 0.08), y0);
    ctx.rotate(-0.16 + Math.sin(drift * Math.PI * 2) * 0.03);
    ctx.filter = `blur(${Math.round(band * 0.35)}px)`;
    for (let i = 0; i < 4; i++) {
      const y = (i - 1.5) * band * 0.62;
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = cols[i];
      ctx.fillRect(-w, y - band * 0.31, w * 2, band * 0.62);
    }
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.restore();
    /* fade to paper under the text */
    ctx.globalCompositeOperation = 'destination-in';
    const m = ctx.createLinearGradient(0, 0, 0, h);
    if (s.mode === 'foot') { m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.42, 'rgba(0,0,0,0)'); m.addColorStop(0.62, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,1)'); }
    else { m.addColorStop(0, 'rgba(0,0,0,0.25)'); m.addColorStop(0.5, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0.25)'); }
    ctx.fillStyle = m; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  };
  let t0 = performance.now(), tPaused = 0, raf = 0;
  const loop = (now) => { const t = now - t0; scenes.forEach((s) => s.vis && draw(s, t)); raf = paused ? 0 : requestAnimationFrame(loop); };
  if (scenes.length) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { const s = scenes.find((x) => x.c === e.target); if (s) s.vis = e.isIntersecting; }));
      scenes.forEach((s) => io.observe(s.c));
    }
    scenes.forEach((s) => draw(s, 0));
    if (!paused) raf = requestAnimationFrame(loop);
    addEventListener('resize', () => scenes.forEach((s) => draw(s, performance.now() - t0)));
    const setP = (p) => {
      paused = p;
      pauseBtns.forEach((b) => { b.setAttribute('aria-pressed', String(p)); b.setAttribute('aria-label', p ? I18N.play : I18N.pause); });
      if (p) { cancelAnimationFrame(raf); raf = 0; tPaused = performance.now(); } else { t0 += performance.now() - tPaused; raf = requestAnimationFrame(loop); }
    };
    pauseBtns.forEach((b) => b.addEventListener('click', () => setP(!paused)));
    reduce.addEventListener?.('change', (e) => { root.classList.toggle('no-motion', e.matches); if (e.matches) setP(true); });
  }

  /* headings: never leave one word alone on a line */
  const lineWords = (el) => {
    const tw = d.createTreeWalker(el, NodeFilter.SHOW_TEXT); const lines = []; let n;
    while ((n = tw.nextNode())) {
      const t = n.textContent, re = /[^ \n\t]+/g; let m;
      while ((m = re.exec(t))) {
        const r = d.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const rc = r.getClientRects(); if (!rc.length) continue;
        const top = rc[rc.length - 1].top, w = m[0].split('\u00a0').filter(Boolean).length;
        const L = lines.find((x) => Math.abs(x.top - top) < 6); if (L) L.w += w; else lines.push({ top, w });
      }
    }
    return lines;
  };
  const lonely = (el) => { const l = lineWords(el); const total = l.reduce((a, x) => a + x.w, 0); return total >= 3 && l.length > 1 && l.some((x) => x.w === 1); };
  const fixHeads = () => d.querySelectorAll('h1, h2, h3, .road__t').forEach((h) => {
    h.style.removeProperty('text-wrap'); h.style.removeProperty('max-width');
    if (!h.offsetWidth || !lonely(h)) return;
    h.style.setProperty('text-wrap', 'balance'); if (!lonely(h)) return;
    const full = h.getBoundingClientRect().width;
    for (const k of [0.92, 0.84, 0.76, 0.68, 0.6]) {
      for (const mode of ['balance', 'wrap']) { h.style.setProperty('text-wrap', mode); h.style.setProperty('max-width', Math.floor(full * k) + 'px'); if (!lonely(h)) return; }
    }
    h.style.removeProperty('text-wrap'); h.style.removeProperty('max-width');
  });
  let fhT = 0;
  const runFix = () => { clearTimeout(fhT); fhT = setTimeout(fixHeads, 60); };
  (d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(fixHeads);
  addEventListener('resize', runFix);

  /* one reveal */
  const rv = d.querySelectorAll('[data-reveal]');
  if (rv.length && 'IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add('is-in'));

  /* custom select */
  d.querySelectorAll('.select').forEach((sel) => {
    const btn = sel.querySelector('.select__btn'), list = sel.querySelector('.select__list'), input = sel.querySelector('input[type="hidden"]');
    const label = btn.querySelector('span');
    const opts = [...list.querySelectorAll('li')];
    let active = -1, typed = '', typedT = 0;
    const o = { el: sel, btn, isOpen: () => btn.getAttribute('aria-expanded') === 'true', close() { btn.setAttribute('aria-expanded', 'false'); list.hidden = true; btn.removeAttribute('aria-activedescendant'); } };
    openers.add(o);
    const setActive = (i) => { opts.forEach((x) => x.classList.remove('is-active')); active = Math.max(0, Math.min(opts.length - 1, i)); const a = opts[active]; a.classList.add('is-active'); btn.setAttribute('aria-activedescendant', a.id); a.scrollIntoView({ block: 'nearest' }); };
    const open = () => { closeAll(o); btn.setAttribute('aria-expanded', 'true'); list.hidden = false; const s = opts.findIndex((x) => x.getAttribute('aria-selected') === 'true'); setActive(s < 0 ? 0 : s); };
    const choose = (i) => { opts.forEach((x) => x.setAttribute('aria-selected', 'false')); const a = opts[i]; a.setAttribute('aria-selected', 'true'); input.value = a.dataset.value; label.textContent = a.textContent; label.classList.remove('ph'); btn.removeAttribute('aria-invalid'); const er = d.getElementById(btn.dataset.err); if (er) er.textContent = ''; o.close(); btn.focus(); };
    btn.addEventListener('click', () => (o.isOpen() ? o.close() : open()));
    btn.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); if (!o.isOpen()) open(); else setActive(active + (e.key === 'ArrowDown' ? 1 : -1)); }
      else if (e.key === 'Home' && o.isOpen()) { e.preventDefault(); setActive(0); }
      else if (e.key === 'End' && o.isOpen()) { e.preventDefault(); setActive(opts.length - 1); }
      else if ((e.key === 'Enter' || e.key === ' ') && o.isOpen()) { e.preventDefault(); choose(active); }
      else if (e.key === 'Tab' && o.isOpen()) o.close();
      else if (e.key.length === 1 && /\S/.test(e.key)) {
        const now = Date.now(); typed = now - typedT > 700 ? e.key.toLowerCase() : typed + e.key.toLowerCase(); typedT = now;
        const i = opts.findIndex((x) => x.textContent.toLowerCase().startsWith(typed));
        if (i >= 0) { if (!o.isOpen()) open(); setActive(i); }
      }
    });
    opts.forEach((x, i) => { x.addEventListener('click', () => choose(i)); x.addEventListener('mousemove', () => setActive(i)); });
  });

  /* contact form: prepares an email, stores nothing */
  const form = d.querySelector('form.form');
  if (form) {
    const T = I18N.form || {};
    const ready = d.getElementById('ready'), pre = ready.querySelector('pre'), openA = ready.querySelector('[data-open]'), copyB = ready.querySelector('[data-copy]'), status = ready.querySelector('.status');
    const to = form.dataset.to;
    const fields = {
      name: form.querySelector('#f-name'), email: form.querySelector('#f-email'), country: form.querySelector('#f-country-btn'),
      countryVal: form.querySelector('#f-country'), message: form.querySelector('#f-message'), consent: form.querySelector('#f-consent'),
    };
    const setErr = (el, id, msg) => { const er = d.getElementById(id); if (msg) { el.setAttribute('aria-invalid', 'true'); er.textContent = msg; } else { el.removeAttribute('aria-invalid'); er.textContent = ''; } return !msg; };
    const emailOk = (v) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(v);
    const check = () => {
      const r = [];
      r.push(setErr(fields.name, 'e-name', fields.name.value.trim() ? '' : T.errName) ? null : fields.name);
      const ev = fields.email.value.trim();
      r.push(setErr(fields.email, 'e-email', !ev ? T.errEmail : emailOk(ev) ? '' : T.errEmailBad) ? null : fields.email);
      r.push(setErr(fields.country, 'e-country', fields.countryVal.value ? '' : T.errCountry) ? null : fields.country);
      r.push(setErr(fields.message, 'e-message', fields.message.value.trim().length >= 10 ? '' : T.errMessage) ? null : fields.message);
      r.push(setErr(fields.consent, 'e-consent', fields.consent.checked ? '' : T.errConsent) ? null : fields.consent);
      return r.filter(Boolean);
    };
    ['input', 'change'].forEach((ev) => form.addEventListener(ev, (e) => { if (e.target.getAttribute('aria-invalid') === 'true') check(); }));
    let text = '';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = check();
      if (bad.length) { bad[0].focus(); return; }
      const cName = d.querySelector('#f-country-btn span').textContent;
      const subject = `${T.subject}: ${fields.name.value.trim()}`;
      const body = `${T.lName}: ${fields.name.value.trim()}\n${T.lEmail}: ${fields.email.value.trim()}\n${T.lCountry}: ${cName}\n\n${fields.message.value.trim()}\n\n${T.lConsent}`;
      text = `${T.lTo}: ${to}\n${T.lSubject}: ${subject}\n\n${body}`;
      const href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      pre.textContent = text; openA.href = href; status.textContent = '';
      form.hidden = true; ready.hidden = false; ready.focus({ preventScroll: true });
      ready.scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' });
      try { location.href = href; } catch (err) { /* blocked in some previews */ }
    });
    const copy = async (str, msg) => {
      try { await navigator.clipboard.writeText(str); status.textContent = msg; }
      catch (err) {
        const ta = d.createElement('textarea'); ta.value = str; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; d.body.append(ta); ta.select();
        try { d.execCommand('copy'); status.textContent = msg; } catch (e2) { status.textContent = T.copyFail; }
        ta.remove();
      }
    };
    copyB.addEventListener('click', () => copy(text, T.copied));
    ready.querySelector('[data-edit]').addEventListener('click', () => { ready.hidden = true; form.hidden = false; fields.message.focus(); });
  }
  d.querySelectorAll('[data-copy-addr]').forEach((b) => b.addEventListener('click', async () => {
    const out = d.getElementById(b.getAttribute('aria-describedby'));
    try { await navigator.clipboard.writeText(b.dataset.copyAddr); } catch (e) {
      const ta = d.createElement('textarea'); ta.value = b.dataset.copyAddr; ta.style.position = 'fixed'; ta.style.opacity = '0'; d.body.append(ta); ta.select(); try { d.execCommand('copy'); } catch (e2) {} ta.remove();
    }
    if (out) { out.textContent = (I18N.form || {}).copied || ''; setTimeout(() => { out.textContent = ''; }, 2400); }
  }));
})();
