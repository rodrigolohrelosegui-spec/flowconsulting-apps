/* ==========================================================================
   Flow Compass · scanner.js
   - SPA vanilla, sin dependencias
   - Soporta textarea, single_choice, multi_choice, skip por pregunta
   - Loader garantiza 90s mínimo de animación
   ========================================================================== */

(function () {
  'use strict';

  /* --------- Config --------- */
  const CFG = {
    WEBHOOK: 'https://n8n-flowjorge-u59154.vm.elestio.app/webhook/flow-compass',
    URL_DISCOVERY: 'https://calendly.com/contacto-flowconsulting/llamada-de-exploracion-flow-consulting?utm_source=flow-compass&utm_id=lm-flow-compass',
    URL_MASTERCLASS: 'https://www.youtube.com/@rodrigolohr',
    QUESTIONS_PATH: './assets/questions.json',
    STORAGE_KEY: 'fc_flow_compass_state_v1',
    REQUEST_TIMEOUT_MS: 120000,
    LOADER_MIN_MS: 90000  // 90 seconds minimum loader animation
  };

  /* --------- State --------- */
  const state = {
    config: null,
    queue: [],
    cursor: 0,
    answers: {},
    skipped: {},
    lead: { name: '', email: '', business_context: '' },
    loaderStartedAt: null,
    apiResolvedAt: null,
    apiResult: null
  };

  /* --------- Track helper --------- */
  function track(event, props) {
    try {
      window.dispatchEvent(new CustomEvent('fc-track', { detail: { event, props: props || {} } }));
      if (typeof window.gtag === 'function') window.gtag('event', event, props || {});
      if (typeof window.plausible === 'function') window.plausible(event, { props: props || {} });
      if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...props });
    } catch (_) {}
  }

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const show = (name) => {
    $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view === name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* --------- Persistence --------- */
  function saveState() {
    try {
      sessionStorage.setItem(CFG.STORAGE_KEY, JSON.stringify({
        cursor: state.cursor, answers: state.answers, skipped: state.skipped, lead: state.lead
      }));
    } catch (_) {}
  }
  function clearState() { try { sessionStorage.removeItem(CFG.STORAGE_KEY); } catch (_) {} }

  /* --------- Config load --------- */
  async function loadConfig() {
    const r = await fetch(CFG.QUESTIONS_PATH, { cache: 'no-store' });
    if (!r.ok) throw new Error('No se pudo cargar el cuestionario.');
    state.config = await r.json();
    state.queue = state.config.questions.map(q => q.id);
  }

  /* --------- Init --------- */
  async function init() {
    try { await loadConfig(); }
    catch (e) {
      $('#errorMsg').textContent = 'No pudimos cargar el scanner. Refrescá la página.';
      show('error');
      return;
    }
    $('#btnStart').addEventListener('click', startQuiz);
    $('#btnBack').addEventListener('click', goBack);
    $('#captureForm').addEventListener('submit', onSubmit);
    $('#btnRetry').addEventListener('click', retrySubmit);
    $('#fieldBusiness').addEventListener('input', (e) => {
      $('#businessCount').textContent = String(e.target.value.length);
    });
  }

  function startQuiz() {
    track('quiz_started', {});
    state.cursor = 0;
    state.answers = {};
    state.skipped = {};
    saveState();
    $('#progressWrap').hidden = false;
    show('question');
    renderCurrentQuestion();
  }

  /* --------- Question rendering --------- */
  function renderCurrentQuestion() {
    const qid = state.queue[state.cursor];
    const q = state.config.questions.find(x => x.id === qid);
    if (!q) { goToCapture(); return; }

    const total = state.queue.length;
    $('#progressFill').style.width = `${((state.cursor) / total) * 100}%`;
    $('#progressText').textContent = `Paso ${state.cursor + 1} de ${total}`;
    $('#questionCounter').textContent = `${state.cursor + 1} / ${total}`;
    $('#btnBack').disabled = state.cursor === 0;

    const slot = $('#questionSlot');
    slot.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'question__wrap';

    // Label
    const label = document.createElement('h2');
    label.className = 'question__label';
    label.textContent = q.label;
    if (!q.required) {
      const badge = document.createElement('span');
      badge.className = 'question__optional-badge';
      badge.textContent = 'Opcional';
      label.appendChild(badge);
    }
    wrap.appendChild(label);

    // Hint
    if (q.hint) {
      const hint = document.createElement('p');
      hint.className = 'question__hint';
      hint.textContent = q.hint;
      wrap.appendChild(hint);
    }

    // Render by type
    if (q.type === 'textarea') renderTextarea(wrap, q);
    else if (q.type === 'single_choice' || q.type === 'single_choice_metadata') renderSingleChoice(wrap, q);
    else if (q.type === 'multi_choice') renderMultiChoice(wrap, q);

    slot.appendChild(wrap);
  }

  function renderTextarea(wrap, q) {
    const ta = document.createElement('textarea');
    ta.className = 'question__textarea';
    ta.rows = 5;
    ta.placeholder = q.placeholder || '';
    ta.maxLength = q.max_chars || 2000;
    ta.value = state.answers[q.id] || '';

    const minChars = q.min_chars || 0;
    const maxChars = q.max_chars || 2000;

    // Counter with min indicator visible from the start
    const counter = document.createElement('div');
    counter.className = 'question__counter';

    // Inline error message (shown below textarea when validation fails)
    const errMsg = document.createElement('div');
    errMsg.className = 'question__error';
    errMsg.setAttribute('role', 'alert');
    errMsg.setAttribute('aria-live', 'polite');
    errMsg.hidden = true;

    const updateCounter = () => {
      const len = ta.value.length;
      const minHint = minChars > 0 ? ` · mínimo ${minChars}` : '';
      counter.textContent = `${len} / ${maxChars}${minHint}`;
      counter.classList.toggle('is-warning', minChars > 0 && len > 0 && len < minChars);
      counter.classList.toggle('is-error', len > maxChars - 50);
      // Hide error message as soon as user types past minimum
      if (len >= minChars && !errMsg.hidden) errMsg.hidden = true;
    };
    ta.addEventListener('input', updateCounter);
    updateCounter();

    wrap.appendChild(ta);
    wrap.appendChild(errMsg);
    wrap.appendChild(counter);

    const btnWrap = document.createElement('div');
    btnWrap.className = 'question__actions';
    const btn = document.createElement('button');
    btn.className = 'btn btn--primary';
    btn.textContent = 'Continuar';
    btn.addEventListener('click', () => {
      const v = ta.value.trim();
      if (q.required && v.length < Math.max(minChars, 1)) {
        ta.focus();
        ta.classList.add('is-invalid');
        const need = Math.max(minChars, 1);
        if (minChars > 0) {
          errMsg.textContent = `Necesito al menos ${need} caracteres para que el análisis sea útil. Llevás ${v.length}.`;
        } else {
          errMsg.textContent = `Esta respuesta es obligatoria. Si no la tienes, no podemos analizarla.`;
        }
        errMsg.hidden = false;
        setTimeout(() => ta.classList.remove('is-invalid'), 1500);
        return;
      }
      state.answers[q.id] = v;
      delete state.skipped[q.id];
      saveState();
      track('answer_recorded', { qid: q.id, length: v.length });
      advance();
    });
    btnWrap.appendChild(btn);

    if (q.skip_allowed) {
      const skipBtn = document.createElement('button');
      skipBtn.className = 'btn btn--ghost';
      skipBtn.textContent = q.skip_label || 'No tengo esto todavía';
      skipBtn.type = 'button';
      skipBtn.addEventListener('click', () => {
        state.answers[q.id] = `(saltó: ${q.skip_label || 'no tengo'})`;
        state.skipped[q.id] = true;
        saveState();
        track('answer_skipped', { qid: q.id });
        advance();
      });
      btnWrap.appendChild(skipBtn);
    }

    wrap.appendChild(btnWrap);
    setTimeout(() => ta.focus(), 100);
  }

  function renderSingleChoice(wrap, q) {
    const choices = document.createElement('div');
    choices.className = 'question__choices';
    q.options.forEach(opt => {
      const c = document.createElement('button');
      c.className = 'question__choice';
      c.type = 'button';
      c.textContent = opt.label;
      if (state.answers[q.id] === opt.value) c.classList.add('is-selected');
      c.addEventListener('click', () => {
        state.answers[q.id] = opt.value;
        delete state.skipped[q.id];
        saveState();
        track('answer_recorded', { qid: q.id, value: opt.value });
        advance();
      });
      choices.appendChild(c);
    });
    wrap.appendChild(choices);

    if (q.skip_allowed) {
      const skipBtn = document.createElement('button');
      skipBtn.className = 'btn btn--ghost';
      skipBtn.textContent = q.skip_label || 'No tengo esto todavía';
      skipBtn.type = 'button';
      skipBtn.addEventListener('click', () => {
        state.answers[q.id] = '(saltó)';
        state.skipped[q.id] = true;
        saveState();
        advance();
      });
      const wrapBtn = document.createElement('div');
      wrapBtn.className = 'question__actions';
      wrapBtn.appendChild(skipBtn);
      wrap.appendChild(wrapBtn);
    }
  }

  function renderMultiChoice(wrap, q) {
    const selected = new Set(Array.isArray(state.answers[q.id]) ? state.answers[q.id] : []);
    const choices = document.createElement('div');
    choices.className = 'question__choices question__choices--multi';
    q.options.forEach(opt => {
      const c = document.createElement('button');
      c.className = 'question__choice question__choice--multi';
      c.type = 'button';
      c.innerHTML = `<span class="question__choice-tick" aria-hidden="true"></span><span class="question__choice-label">${escapeHtml(opt.label)}</span>`;
      if (selected.has(opt.value)) c.classList.add('is-selected');
      c.addEventListener('click', () => {
        if (selected.has(opt.value)) { selected.delete(opt.value); c.classList.remove('is-selected'); }
        else { selected.add(opt.value); c.classList.add('is-selected'); }
      });
      choices.appendChild(c);
    });
    wrap.appendChild(choices);

    const btnWrap = document.createElement('div');
    btnWrap.className = 'question__actions';
    const btn = document.createElement('button');
    btn.className = 'btn btn--primary';
    btn.textContent = 'Continuar';
    btn.addEventListener('click', () => {
      const arr = Array.from(selected);
      const min = q.min_selected || 1;
      if (q.required && arr.length < min) {
        choices.classList.add('is-invalid');
        setTimeout(() => choices.classList.remove('is-invalid'), 2000);
        return;
      }
      state.answers[q.id] = arr;
      delete state.skipped[q.id];
      saveState();
      track('answer_recorded', { qid: q.id, count: arr.length });
      advance();
    });
    btnWrap.appendChild(btn);
    wrap.appendChild(btnWrap);
  }

  function advance() {
    state.cursor++;
    if (state.cursor >= state.queue.length) goToCapture();
    else renderCurrentQuestion();
  }

  function goBack() {
    if (state.cursor === 0) return;
    state.cursor--;
    saveState();
    renderCurrentQuestion();
  }

  function goToCapture() {
    track('capture_shown', {});
    $('#progressFill').style.width = '100%';
    $('#progressText').textContent = `Listo. Último paso`;
    show('capture');
    setTimeout(() => $('#fieldName').focus(), 200);
  }

  /* --------- Submit --------- */
  function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

  async function onSubmit(e) {
    e.preventDefault();
    const name = $('#fieldName').value.trim();
    const email = $('#fieldEmail').value.trim();
    const business_context = ($('#fieldBusiness').value || '').trim().slice(0, 500);

    $('#errName').textContent = ''; $('#errEmail').textContent = '';
    let ok = true;
    if (name.length < 2) { $('#errName').textContent = 'Tu nombre, por favor.'; ok = false; }
    if (!validateEmail(email)) { $('#errEmail').textContent = 'Revisá el formato del email.'; ok = false; }
    if (!ok) return;

    state.lead = { name, email, business_context };
    saveState();
    $('#btnSubmit').disabled = true;
    $('#btnSubmit').textContent = 'Armando tu Flow Compass';
    await submitScan(buildPayload());
  }

  function buildPayload() {
    return {
      diagnostic_id: state.config.diagnostic_id,
      version: state.config.version,
      lead: { ...state.lead },
      answers: { ...state.answers },
      skipped: { ...state.skipped },
      meta: {
        submitted_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        lang: navigator.language || 'es',
        timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) { return 'America/Mexico_City'; } })()
      }
    };
  }

  async function postWithTimeout(url, payload, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
      clearTimeout(t);
      return r;
    } catch (e) { clearTimeout(t); throw e; }
  }

  let lastPayload = null;
  async function submitScan(payload) {
    lastPayload = payload;
    track('submit_started', {});
    show('loading');
    state.loaderStartedAt = Date.now();

    // Spawn background dots once
    spawnDots();

    // Fire the API request as a Promise (loader awaits it)
    const apiPromise = postWithTimeout(CFG.WEBHOOK, payload, CFG.REQUEST_TIMEOUT_MS)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      });

    try {
      const data = await runCinematicLoader(payload, apiPromise);
      try { localStorage.setItem('fc_flow_compass_last_result', JSON.stringify(data)); } catch (_) {}
      track('submit_success', {});
      renderResult(data);
      show('result');
      clearState();
    } catch (e) {
      console.error(e);
      try { localStorage.setItem('fc_flow_compass_failed_payload', JSON.stringify(payload)); } catch (_) {}
      track('submit_error', { msg: String(e && e.message) });
      $('#errorMsg').textContent = 'No pudimos armar tu Flow Compass. Reintenta en un momento.';
      show('error');
      $('#btnSubmit').disabled = false;
      $('#btnSubmit').textContent = 'Ver mi Flow Compass';
    }
  }

  async function retrySubmit() {
    if (!lastPayload) {
      try { lastPayload = JSON.parse(localStorage.getItem('fc_flow_compass_failed_payload') || 'null'); } catch (_) {}
    }
    if (!lastPayload) { show('landing'); return; }
    await submitScan(lastPayload);
  }

  /* ============================================================
     CINEMATIC LOADER (6 escenas) — adaptado del Diagnóstico
     ============================================================ */

  function spawnDots() {
    const c = $('#dotsCanvas');
    if (!c || c.childElementCount > 0) return;
    const N = 38;
    const sizes = ['sm','','','lg'];
    for (let i = 0; i < N; i++) {
      const d = document.createElement('span');
      d.className = 'dot ' + sizes[i % sizes.length];
      if (i % 11 === 0) d.classList.add('coral');
      d.style.left = (5 + Math.random() * 90) + '%';
      d.style.top  = (5 + Math.random() * 90) + '%';
      d.style.animationDelay = (Math.random() * -6).toFixed(2) + 's, ' + (Math.random() * -14).toFixed(2) + 's';
      d.style.animationDuration = (3 + Math.random() * 3).toFixed(2) + 's, ' + (10 + Math.random() * 10).toFixed(2) + 's';
      c.appendChild(d);
    }
  }

  const sceneEls = () => $$('.scene');
  function activateScene(idx) {
    sceneEls().forEach((el, i) => {
      el.classList.toggle('is-active', i === idx);
      el.classList.remove('is-leaving');
    });
    $$('.scene-dot').forEach((d, i) => {
      d.classList.toggle('is-active', i === idx);
      d.classList.toggle('is-done', i < idx);
    });
  }
  function transitionTo(idx) {
    sceneEls().forEach(el => {
      if (el.classList.contains('is-active')) el.classList.add('is-leaving');
    });
    setTimeout(() => activateScene(idx), 230);
  }

  function setPercent(p) {
    const clamped = Math.max(0, Math.min(99.9, p));
    const numEl = $('#percentNum');
    const fill = $('#progressLinearFill');
    if (!numEl) return;
    if (clamped >= 95 && clamped < 100) {
      const intPart = Math.floor(clamped);
      const dec = Math.round((clamped - intPart) * 10);
      numEl.textContent = intPart;
      let decEl = numEl.parentElement.querySelector('.percent__decimal');
      if (!decEl) {
        decEl = document.createElement('span');
        decEl.className = 'percent__decimal';
        numEl.parentElement.insertBefore(decEl, numEl.nextSibling);
      }
      decEl.textContent = '.' + dec;
    } else {
      numEl.textContent = Math.round(clamped);
      const decEl = numEl.parentElement?.querySelector('.percent__decimal');
      if (decEl) decEl.remove();
    }
    if (fill) fill.style.width = clamped + '%';
  }
  function setPercentClean100() {
    const numEl = $('#percentNum');
    if (numEl) numEl.textContent = '100';
    const decEl = numEl?.parentElement.querySelector('.percent__decimal');
    if (decEl) decEl.remove();
    const fill = $('#progressLinearFill');
    if (fill) fill.style.width = '100%';
  }
  async function tweenPercent(from, to, durMs) {
    return new Promise(resolve => {
      const t0 = Date.now();
      const tick = () => {
        const t = Math.min(1, (Date.now() - t0) / durMs);
        setPercent(from + (to - from) * t);
        if (t < 1) requestAnimationFrame(tick); else resolve();
      };
      tick();
    });
  }

  function loaderSleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function typewriter(el, text, speed=28, opts={}) {
    el.innerHTML = '';
    const cursor = document.createElement('span');
    cursor.className = opts.cursorClass || 'cli__cursor';
    el.appendChild(cursor);
    for (let i = 0; i < text.length; i++) {
      cursor.insertAdjacentText('beforebegin', text[i]);
      const ch = text[i];
      const wait = ch === ',' ? speed * 4 : ch === '.' ? speed * 6 : ch === '\n' ? speed * 2 : speed;
      await loaderSleep(wait);
    }
    if (opts.removeCursor) cursor.remove();
  }

  // Compute routing signals based on Q1-Q4 of the flow-compass questionnaire
  function computeScannerPatterns(payload) {
    const a = (payload && payload.answers) || {};
    const Q1 = a.Q1 || ''; // bracket
    const Q2 = Array.isArray(a.Q2) ? a.Q2 : []; // cuellos
    const Q3 = (a.Q3 || '').toLowerCase();
    const Q4 = (a.Q4 || '').toLowerCase();
    const all = (Q3 + ' ' + Q4);
    return [
      { key:'bracket_validacion',     label:'Etapa de validación',               match: Q1 === 'A' },
      { key:'bracket_incubadora',     label:'Etapa Incubadora (2-10K)',          match: Q1 === 'B' },
      { key:'bracket_aceleradora',    label:'Etapa Aceleradora (10-50K)',        match: Q1 === 'C' || Q1 === 'D' },
      { key:'bracket_top',            label:'Etapa top (50K+)',                  match: Q1 === 'E' },
      { key:'bracket_corporate',      label:'Empresa corporativa',                match: Q1 === 'F' },
      { key:'cuello_claridad',        label:'Cuello de claridad de oferta',       match: Q2.includes('claridad') },
      { key:'cuello_lead_flow',       label:'Cuello de lead flow',                match: Q2.includes('lead_flow') },
      { key:'cuello_ventas',          label:'Cuello de ventas',                   match: Q2.includes('ventas') },
      { key:'cuello_entrega',         label:'Cuello de entrega o burnout',        match: Q2.includes('entrega') },
      { key:'cuello_vision',          label:'Cuello de visión y dirección',       match: Q2.includes('vision') },
      { key:'señal_paz_mental',       label:'Señal de paz mental como prioridad', match: /(paz mental|burnout|quemad|familia|hijo|pareja|libertad personal|propósito|dirección)/i.test(all) },
      { key:'señal_carga_mentorías',  label:'Carga de mentorías previas sin resultado', match: /(mentor|programa|curso|fórmula|agencia|funnel)/i.test(Q4) && /(no funcion|no me funcion|fund|deud|quem|frustrad)/i.test(Q4) },
      { key:'señal_no_probó_nada',    label:'No probó programas previos',         match: /^(no\s+prob|nada|ninguno|nunca|todavía no|aún no|primero|recién)/i.test(Q4.trim()) || Q4.length < 100 }
    ];
  }

  /* SCENE 1 — CLI ingesta */
  async function playScene1(payload, firstName) {
    const cliBody = $('#cliBody');
    if (!cliBody) return;
    cliBody.innerHTML = '';
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City'; } catch { return 'America/Mexico_City'; }})();
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');
    const a = (payload && payload.answers) || {};
    const Q2arr = Array.isArray(a.Q2) ? a.Q2 : [];
    const ctxLen = (a.Q3 || '').length + (a.Q4 || '').length;
    const bracketLabel = ({A:'<2K', B:'2-10K', C:'10-25K', D:'25-50K', E:'50K+', F:'corporate'})[a.Q1] || '?';
    const hash = Math.random().toString(16).slice(2,6) + '-' + Math.random().toString(16).slice(2,6) + '-' + Math.random().toString(16).slice(2,6);
    const ref = (() => { try { return document.referrer ? new URL(document.referrer).hostname : 'directo'; } catch { return 'directo'; }})();
    const lines = [
      { html: `<span class="prompt">&gt;</span> Sesión iniciada · <span class="accent">${hh}:${mm}:${ss}</span> · ${tz}` },
      { html: `<span class="prompt">&gt;</span> Recibido de <span class="accent">${escapeHtml(firstName)}</span>: etapa ${bracketLabel} · ${Q2arr.length} cuello(s) marcado(s) · ${ctxLen} caracteres de contexto` },
      { html: `<span class="prompt">&gt;</span> Idioma: ES · Origen: ${ref}` },
      { html: `<span class="prompt">&gt;</span> Encriptando datos... <span class="ok">[✓]</span>` },
      { html: `<span class="prompt">&gt;</span> Hash de sesión: <span class="muted">${hash}</span>` },
      { html: `<span class="prompt">&gt;</span> Cargando los 4 programas y los 8 casos de estudio internos...<span class="cli__cursor"></span>` }
    ];
    for (let i = 0; i < lines.length; i++) {
      const el = document.createElement('div');
      el.className = 'cli__line';
      el.innerHTML = lines[i].html;
      cliBody.appendChild(el);
      const wait = i === 0 ? 0
                : i === 1 ? 900
                : i === 2 ? 1100
                : i === 3 ? 1500
                : i === 4 ? 1700
                : 2100 + Math.random() * 400;
      if (wait > 0) await loaderSleep(wait);
    }
    await loaderSleep(2400);
  }

  /* SCENE 2 — patrones evaluándose */
  async function playScene2(patterns) {
    const grid = $('#patternsGrid');
    const caption = $('#patternsCaption');
    const counter = $('#patternsCount');
    if (!grid) return;
    grid.innerHTML = '';
    let matchCount = 0;
    counter.textContent = '0';
    const chips = patterns.map(p => {
      const el = document.createElement('div');
      el.className = 'pchip';
      el.innerHTML = `<span class="pchip__icon"></span><span>${escapeHtml(p.label)}</span>`;
      grid.appendChild(el);
      return el;
    });
    for (let i = 0; i < patterns.length; i++) {
      const p = patterns[i];
      const chip = chips[i];
      chip.classList.add('is-checking');
      caption.textContent = `Probando: ${p.label}…`;
      await loaderSleep(1000);
      chip.classList.remove('is-checking');
      chip.classList.add(p.match ? 'is-match' : 'is-skip');
      if (p.match) {
        matchCount++;
        counter.textContent = matchCount;
        caption.textContent = `Patrón detectado: ${p.label}`;
      } else {
        caption.textContent = `${p.label}: no aplica a tu copy`;
      }
      await loaderSleep(750);
    }
    caption.textContent = `${matchCount} patrones detectados en tu narrativa.`;
    await loaderSleep(700);
  }

  /* SCENE 3 — comparison cards */
  async function playScene3() {
    const grid = $('#casesGrid');
    const caption = $('#casesCaption');
    const score = $('#casesScore');
    if (!grid) return;
    grid.innerHTML = '';
    const cases = [
      { i:'C', sub:'Coach' }, { i:'C', sub:'Consultor' }, { i:'A', sub:'Agencia' },
      { i:'E', sub:'Experto' }, { i:'M', sub:'Mentor' }, { i:'F', sub:'Formador' },
      { i:'P', sub:'Profesional' }, { i:'E', sub:'Estratega' }, { i:'F', sub:'Founder' },
      { i:'C', sub:'Creador' }, { i:'A', sub:'Asesor' }, { i:'E', sub:'Educador' },
      { i:'C', sub:'Consultor' }, { i:'A', sub:'Agencia' }, { i:'C', sub:'Coach' },
      { i:'E', sub:'Experto' }, { i:'F', sub:'Founder' }
    ];
    const winnerIdx = Math.floor(cases.length * 0.30);
    const scan = document.createElement('div'); scan.className = 'cases-scan';
    grid.appendChild(scan);
    cases.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'case-card';
      card.innerHTML = `<div>${c.i}</div><div class="case-card__sub">${escapeHtml(c.sub)}</div>`;
      grid.appendChild(card);
      setTimeout(() => card.classList.add('is-revealed'), 110 * i);
    });
    await loaderSleep(110 * cases.length + 400);
    caption.textContent = 'Cruzando tu etapa con clientes reales que pasaron por la misma situación…';
    scan.classList.add('is-running'); await loaderSleep(1700); scan.classList.remove('is-running');
    await loaderSleep(300);
    caption.textContent = 'Identificando el cliente análogo más cercano a tu nicho…';
    scan.classList.add('is-running'); await loaderSleep(1700); scan.classList.remove('is-running');
    caption.textContent = 'Aislando el match narrativo más fuerte…';
    await loaderSleep(1100);
    const winnerCard = grid.querySelectorAll('.case-card')[winnerIdx];
    if (winnerCard) winnerCard.classList.add('is-winner');
    caption.textContent = 'Patrón narrativo identificado';
    const to = 89; let val = 0; const dur = 3200; const t0 = Date.now();
    await new Promise(res => {
      const tick = () => {
        const t = Math.min(1, (Date.now() - t0) / dur);
        val = Math.floor(t * to);
        score.textContent = val;
        if (t < 1) requestAnimationFrame(tick); else res();
      }; tick();
    });
    await loaderSleep(900);
  }

  /* SCENE 4 — knowledge graph */
  async function playScene4() {
    const caption = $('#leverCaption');
    const counter = $('#leverCount');
    const edgesG = $('#kgEdges');
    const nodesG = $('#kgNodes');
    const finalG = $('#kgFinal');
    const redacted = document.querySelector('.lever-redacted');
    if (!edgesG || !nodesG) return;
    edgesG.innerHTML = ''; nodesG.innerHTML = ''; finalG.innerHTML = '';
    redacted?.classList.remove('is-visible');
    counter.textContent = '47';
    const W = 480, H = 240;
    const clusters = [
      { cx: W * 0.22, cy: H * 0.50, r: 70, n: 6 },
      { cx: W * 0.55, cy: H * 0.30, r: 65, n: 6 },
      { cx: W * 0.78, cy: H * 0.65, r: 70, n: 6 }
    ];
    const nodes = [];
    clusters.forEach(c => {
      for (let i = 0; i < c.n; i++) {
        const ang = (i / c.n) * Math.PI * 2 + Math.random() * 0.5;
        const dist = c.r * (0.45 + Math.random() * 0.55);
        nodes.push({ x: c.cx + Math.cos(ang) * dist, y: c.cy + Math.sin(ang) * dist });
      }
    });
    const nodeEls = nodes.map((p, i) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 3.4);
      c.style.opacity = '0'; c.style.transition = 'opacity .4s';
      nodesG.appendChild(c);
      setTimeout(() => { c.style.opacity = '1'; }, 60 * i);
      return c;
    });
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 110) edges.push({ a: i, b: j, d });
      }
    }
    edges.sort((a, b) => a.d - b.d);
    const edgesPick = edges.slice(0, 22);
    const edgeEls = edgesPick.map((e, k) => {
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const A = nodes[e.a], B = nodes[e.b];
      ln.setAttribute('x1', A.x); ln.setAttribute('y1', A.y);
      ln.setAttribute('x2', B.x); ln.setAttribute('y2', B.y);
      edgesG.appendChild(ln);
      setTimeout(() => ln.classList.add('is-drawn'), 200 + k * 80);
      return { el: ln, a: e.a, b: e.b };
    });
    caption.textContent = 'Mapeando los 4 programas contra tu situación específica…';
    await loaderSleep(3200);
    const waves = [
      { count: 12, cap: 'Filtrando programas que no calzan con tu etapa…' },
      { count: 5,  cap: 'Pesando cuello de botella vs componente del programa…' },
      { count: 3,  cap: 'Cruzando con lo que ya probaste y no te funcionó…' },
      { count: 1,  cap: 'Aislando la ruta correcta para ti…' }
    ];
    const finalNodeIdx = Math.floor(nodes.length / 2);
    let aliveNodes = new Set(nodes.map((_, i) => i));
    for (const w of waves) {
      caption.textContent = w.cap;
      while (aliveNodes.size > w.count) {
        const candidates = [...aliveNodes].filter(i => i !== finalNodeIdx);
        if (!candidates.length) break;
        const drop = candidates[Math.floor(Math.random() * candidates.length)];
        nodeEls[drop].classList.add('is-faded');
        edgeEls.forEach(e => { if (e.a === drop || e.b === drop) e.el.classList.add('is-faded'); });
        aliveNodes.delete(drop);
        await loaderSleep(140);
      }
      counter.textContent = w.count;
      await loaderSleep(1000);
    }
    nodeEls[finalNodeIdx].classList.add('is-final');
    edgeEls.forEach(e => {
      if ((e.a === finalNodeIdx || e.b === finalNodeIdx) && !e.el.classList.contains('is-faded')) {
        e.el.classList.add('is-final');
      }
    });
    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('cx', nodes[finalNodeIdx].x);
    halo.setAttribute('cy', nodes[finalNodeIdx].y);
    halo.setAttribute('r', 6);
    finalG.appendChild(halo);
    redacted?.classList.add('is-visible');
    caption.textContent = 'Programa correcto identificado.';
    await loaderSleep(1800);
  }

  /* SCENE 5 — document writing */
  async function playScene5(firstName) {
    const docBody = $('#docBody');
    if (!docBody) return;
    const fragments = [
      `${firstName}, leyendo tu situación con calma para entender qué pasa…`,
      `Calibrando tu Flow Compass a tu etapa y a tu cuello específico…`,
      `Cruzando tu objetivo de 90 días con la ruta que tiene sentido…`,
      `Pesando lo que ya probaste contra cómo lo hacemos distinto acá…`,
      `Asegurando que la ruta se sienta hecha para ti, ${firstName}, no un template…`,
      `Diciendo la verdad antes de la llamada, ${firstName}, sin pitch agresivo.`
    ];
    docBody.innerHTML = '';
    for (let i = 0; i < fragments.length; i++) {
      const el = document.createElement('div');
      docBody.appendChild(el);
      await typewriter(el, fragments[i], 32, { cursorClass: 'doc__cursor' });
      await loaderSleep(550);
      el.style.transition = 'opacity .35s';
      el.style.opacity = '0.25';
      await loaderSleep(320);
      docBody.innerHTML = '';
    }
  }

  /* SCENE 6 — verification + spoiler (autoRender modo embebido) */
  async function playScene6(apiPromise) {
    const list = $('#checklist');
    if (!list) return null;
    const items = [
      'Flow Compass personalizado a tu situación real',
      'Tono calibrado a tu etapa y a tu nicho',
      '4 rutas posibles evaluadas contra tu caso',
      'Ruta correcta seleccionada y justificada',
      'Acompañamiento traducido a tu dolor específico',
      'Caso de un cliente que pasó por algo parecido',
      'La verdad incómoda antes de la llamada'
    ];
    list.innerHTML = '';
    const liEls = items.map(text => {
      const li = document.createElement('li');
      li.className = 'cli-item';
      li.innerHTML = `<span class="cli-item__icon">⠋</span><span>${escapeHtml(text)}</span>`;
      list.appendChild(li);
      return li;
    });
    let result = null, done = false, error = null;
    apiPromise.then(r => { result = r; done = true; }).catch(e => { error = e; done = true; });
    for (let i = 0; i < liEls.length; i++) {
      const li = liEls[i];
      li.classList.add('is-running');
      const baseMs = 1300;
      const stretchMs = !done && i === liEls.length - 1 ? 1800 : baseMs;
      await loaderSleep(stretchMs);
      li.classList.remove('is-running');
      li.classList.add('is-done');
      li.querySelector('.cli-item__icon').textContent = '✓';
    }
    // EXTENDED WAIT MODE if API still pending
    if (!done) {
      const captionWrap = $('#scene6Caption');
      const captionText = $('#scene6CaptionText');
      const captionDots = $('#scene6Dots');
      if (captionWrap) captionWrap.hidden = false;
      const waitMessages = [
        'Procesando',
        'Aplicando últimas reglas',
        'Verificando coherencia interna',
        'Calibrando el tono final',
        'Casos complejos como el tuyo toman un poco más',
        'Cruzando con las 200 ofertas auditadas',
        'Asegurando que cada palabra te sirva',
        'Procesando',
        'Esto suele tomar entre 1 y 2 minutos',
        'Casi listo',
        'Ya casi terminamos'
      ];
      let msgIdx = 0; let dotCount = 1;
      const last = liEls[liEls.length - 1];
      let dec = 0;
      const decInterval = setInterval(() => {
        if (done) return;
        dec = Math.min(49, dec + 1);
        const value = 95 + dec / 10;
        setPercent(value);
      }, 1700);
      const captionInterval = setInterval(() => {
        if (done) return;
        if (captionText) captionText.textContent = waitMessages[msgIdx % waitMessages.length];
        msgIdx++;
      }, 4500);
      const dotsInterval = setInterval(() => {
        if (done) return;
        dotCount = (dotCount % 3) + 1;
        if (captionDots) captionDots.textContent = '.'.repeat(dotCount);
      }, 450);
      while (!done) {
        last.classList.remove('is-done');
        last.classList.add('is-running');
        last.querySelector('.cli-item__icon').textContent = '⠋';
        await loaderSleep(900);
        if (done) break;
        last.classList.remove('is-running');
        last.classList.add('is-done');
        last.querySelector('.cli-item__icon').textContent = '✓';
        await loaderSleep(400);
      }
      clearInterval(decInterval);
      clearInterval(captionInterval);
      clearInterval(dotsInterval);
      if (captionWrap) captionWrap.hidden = true;
      last.classList.remove('is-running');
      last.classList.add('is-done');
      last.querySelector('.cli-item__icon').textContent = '✓';
    }
    // Spoiler reveal with recommended program
    if (result && result.programa_recomendado && result.programa_recomendado.nombre) {
      $('#spoilerArchetype').textContent = result.programa_recomendado.nombre;
      $('#spoiler').hidden = false;
    }
    setPercentClean100();
    await loaderSleep(2400);
    if (error) throw error;
    return result;
  }

  /* ORCHESTRATOR — runs 5 scenes in parallel with API, then scene 6 awaits result */
  async function runCinematicLoader(payload, apiPromise) {
    const lead = payload.lead || {};
    const firstName = (lead.name || '').trim().split(' ')[0] || 'tú';
    const patterns = computeScannerPatterns(payload);
    let apiDone = false, apiResult = null, apiError = null;
    apiPromise.then(r => { apiResult = r; apiDone = true; })
              .catch(e => { apiError = e; apiDone = true; });

    setPercent(1);

    const sceneTargets = [
      { idx: 0, fn: playScene1, args: [payload, firstName], from: 1,  to: 16, dur: 14000 },
      { idx: 1, fn: playScene2, args: [patterns],            from: 16, to: 32, dur: 17000 },
      { idx: 2, fn: playScene3, args: [],                    from: 32, to: 49, dur: 15000 },
      { idx: 3, fn: playScene4, args: [],                    from: 49, to: 66, dur: 17000 },
      { idx: 4, fn: playScene5, args: [firstName],           from: 66, to: 82, dur: 16000 }
    ];

    activateScene(0);

    for (let s = 0; s < sceneTargets.length; s++) {
      const sc = sceneTargets[s];
      if (s > 0) transitionTo(sc.idx);
      const tweenP = tweenPercent(sc.from, sc.to, sc.dur);
      const sceneP = sc.fn(...sc.args);
      await Promise.all([tweenP, sceneP]);
      // Early-finish: if API done, jump to scene 6 + spoiler
      if (apiDone && apiResult) {
        transitionTo(5);
        const cur = parseFloat($('#percentNum').textContent || '0');
        await tweenPercent(cur, 95, 800);
        const r = await playScene6(Promise.resolve(apiResult));
        if (apiError) throw apiError;
        return r;
      }
    }

    transitionTo(5);
    await tweenPercent(82, 95, 5500);
    const r = await playScene6(apiPromise);
    if (apiError) throw apiError;
    return r;
  }

  /* --------- Result rendering (Flow Compass) --------- */

  // Map slug → human-readable program name + tone class for hero
  const PROGRAM_LABELS = {
    incubadora:    { titulo: 'Incubadora de Negocios',    cls: 'program--incubadora' },
    aceleradora:   { titulo: 'Aceleradora de Negocios',   cls: 'program--aceleradora' },
    beyond_flow:   { titulo: 'Beyond Flow · 1:1 Privado', cls: 'program--beyond' },
    executive:     { titulo: 'Flow Consulting Executive', cls: 'program--executive' },
    masterclass:   { titulo: 'Infinite Flow Masterclass', cls: 'program--masterclass' }
  };

  function renderResult(data) {
    if (!data || typeof data !== 'object') {
      $('#errorMsg').textContent = 'La respuesta no llegó completa. Reintentá.';
      show('error');
      return;
    }

    // Bloque 1 · Saludo personalizado
    $('#rSaludo').innerHTML = textToParagraphs(data.saludo_personalizado || '');

    // Bloque 2 · Programa recomendado
    const pr = data.programa_recomendado || {};
    const slug = pr.slug || 'aceleradora';
    const meta = PROGRAM_LABELS[slug] || { titulo: pr.nombre || 'Programa', cls: '' };
    $('#rArchetype').textContent = meta.titulo;
    $('#rPrograma').className = `program-card ${meta.cls}`;
    $('#rPrograma').innerHTML = `
      <div class="program-card__slug">${escapeHtml(slug)}</div>
      <div class="program-card__nombre">${escapeHtml(pr.nombre || meta.titulo)}</div>
      <div class="program-card__razon">${textToParagraphs(pr.razon || '')}</div>
    `;

    // Bloque 3 · Por qué para ti
    const porQue = Array.isArray(data.por_que_para_vos) ? data.por_que_para_vos : [];
    const ulPorQue = $('#rPorQue');
    ulPorQue.innerHTML = '';
    porQue.forEach(item => {
      if (!item || !item.punto) return;
      const li = document.createElement('li');
      li.className = 'por-que-item';
      li.textContent = item.punto;
      ulPorQue.appendChild(li);
    });

    // Bloque 4 · Qué incluye
    const qi = Array.isArray(data.que_incluye) ? data.que_incluye : [];
    const qiEl = $('#rQueIncluye');
    qiEl.innerHTML = '';
    qi.forEach(c => {
      if (!c || !c.componente) return;
      const div = document.createElement('div');
      div.className = 'que-incluye-item';
      div.innerHTML = `
        <div class="que-incluye-item__nombre">${escapeHtml(c.componente)}</div>
        <div class="que-incluye-item__traduccion">${textToParagraphs(c.traduccion || '')}</div>
      `;
      qiEl.appendChild(div);
    });

    // Bloque 5 · Caso análogo (con video EMBEBIDO, no link externo)
    const ca = data.caso_analogo || {};
    const videoEmbed = (() => {
      if (!ca.url_video) return '';
      // Extract YouTube video ID from various URL formats
      const m = String(ca.url_video).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
      const vid = m ? m[1] : '';
      if (!vid) return '';
      return `
        <div class="case-study__video-embed">
          <iframe
            src="https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1"
            title="Testimonio de ${escapeAttr(ca.nombre || 'cliente Flow Consulting')}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>`;
    })();
    $('#rCaseStudy').innerHTML = `
      <div class="case-study__nombre">${escapeHtml(ca.nombre || '')}</div>
      <div class="case-study__snapshot">${escapeHtml(ca.snapshot || '')}</div>
      <div class="case-study__resultado">${escapeHtml(ca.resultado || '')}</div>
      ${ca.cita ? `<blockquote class="case-study__cita">${escapeHtml(ca.cita)}</blockquote>` : ''}
      <div class="case-study__porque">${textToParagraphs(ca.por_que_se_parece_a_ti || '')}</div>
      ${videoEmbed}
    `;

    // Bloque 6 · Forbidden truth
    $('#rForbiddenTruth').innerHTML = textToParagraphs(data.forbidden_truth || '');

    // Bloque 7 · Proyección 12 meses
    const pj = data.proyeccion_12_meses || {};
    $('#rProjection').innerHTML = `
      <div class="proj-card proj-card--base">
        <div class="proj-card__title">Si nada cambia (12 meses)</div>
        <div class="proj-card__text">${textToParagraphs(pj.escenario_actual || '')}</div>
      </div>
      <div class="proj-card proj-card--alineado">
        <div class="proj-card__title">Si entrás al programa correcto</div>
        <div class="proj-card__text">${textToParagraphs(pj.escenario_alineado || '')}</div>
      </div>
    `;

    // Bloque 8 · Por qué NO es para ti
    $('#rPorQueNo').innerHTML = textToParagraphs(data.por_que_NO_es_para_vos || '');

    // Cita Rodrigo (envolvemos con comillas tipográficas para evitar el bug
    // visual del CSS heredado que añadía un `::after` suelto)
    const quoteText = (data.cita_rodrigo || '').trim().replace(/^["'«»]+|["'«»]+$/g, '');
    if (quoteText) {
      $('#rRodrigoQuote').innerHTML = `<span class="rodrigo-quote__mark">«</span> ${escapeHtml(quoteText)} <span class="rodrigo-quote__mark">»</span><cite class="rodrigo-quote__author">— Rodrigo Lohr</cite>`;
    } else {
      $('#rRodrigoQuote').innerHTML = '';
    }

    // CTA
    const cta = data.cta_personalizado || {};
    $('#rCtaHeadline').textContent = cta.headline || 'Agendá tu llamada con el equipo de Rodrigo';
    $('#rCtaRazon').innerHTML = textToParagraphs(cta.razon_para_actuar_ahora || '');
    $('#rCtaQuePasa').innerHTML = `
      <strong>Qué pasa en la llamada</strong>
      <div>${textToParagraphs(cta.que_pasa_en_la_call || '')}</div>
    `;

    // CTA URL — masterclass off-ramp si bracket A o slug masterclass
    const cb = $('#btnBookCall');
    if (slug === 'masterclass') {
      cb.href = CFG.URL_MASTERCLASS;
      cb.innerHTML = 'Ver la masterclass gratis <span aria-hidden="true">→</span>';
    } else {
      cb.href = CFG.URL_DISCOVERY;
      cb.innerHTML = 'Agendar llamada con el equipo de Rodrigo <span aria-hidden="true">→</span>';
    }

    track('result_rendered', {
      programa: slug,
      caso: ca.nombre
    });
  }

  // Render text as short paragraphs (Isra Bravo style: 1-2 lines max).
  // Splits by double newlines OR single newlines OR sentence boundaries when
  // a "block" exceeds 22 words. Forces short visual paragraphs even if the
  // model returns prose without enough line breaks.
  function textToParagraphs(s) {
    if (!s) return '';
    const raw = String(s).trim();
    // Step 1: split by double or single newlines
    let chunks = raw.split(/\n+/).map(c => c.trim()).filter(Boolean);
    // Step 2: for each chunk longer than ~22 words, split by sentence
    const out = [];
    chunks.forEach(c => {
      const words = c.split(/\s+/).length;
      if (words <= 22) { out.push(c); return; }
      // Split by ". " keeping period. Also split by "? " and "! "
      const sentences = c.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [c];
      let buf = '';
      sentences.forEach(sent => {
        const trimmed = sent.trim();
        if (!trimmed) return;
        const bufWords = buf ? buf.split(/\s+/).length : 0;
        const sentWords = trimmed.split(/\s+/).length;
        if (bufWords + sentWords <= 22 && buf) {
          buf = buf + ' ' + trimmed;
        } else {
          if (buf) out.push(buf.trim());
          buf = trimmed;
        }
      });
      if (buf) out.push(buf.trim());
    });
    return out.map(p => `<p>${escapeHtml(p)}</p>`).join('');
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  function escapeAttr(s) { return escapeHtml(s); }

  /* --------- Boot --------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
