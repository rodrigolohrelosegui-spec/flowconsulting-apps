/* ============================================================
   Diagnóstico Infinite Flow · Flow Consulting · quiz.js
   SPA vanilla, sin dependencias.
   ============================================================ */
(function () {
  'use strict';

  const CFG = {
    WEBHOOK_URL: 'https://n8n.flowibs.com/webhook/diagnostico-flow',
    USE_LOCAL_FALLBACK: false,
    URL_BOOKING: 'https://flow-consulting.co/agenda-igdm',
    QUESTIONS_PATH: './assets/questions.json',
    STORAGE_KEY: 'fc_diag_state_v1',
    REQUEST_TIMEOUT_MS: 120000
  };

  const state = {
    config: null,
    cursor: 0,
    answers: {},
    lead: { name: '', email: '', whatsapp: '', business_context: '' },
    timings: { startedAt: null, shownAt: {}, perQuestion: {} },
    advancing: false  // prevents double-tap skipping a question
  };

  /* DOM helpers */
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const show = (name) => {
    $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view === name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // Render a multi-paragraph string (separated by \n\n) as a stack of <p> tags.
  // Use for any field where the model returns broken-up prose with blank-line separators.
  const renderParagraphs = (el, text, opts = {}) => {
    if (!el) return;
    const { applyBold = false, classBase = '' } = opts;
    const raw = String(text || '').trim();
    if (!raw) { el.innerHTML = ''; return; }
    const paragraphs = raw.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    el.innerHTML = paragraphs.map((p, i) => {
      let safe = String(p)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
      // Markdown emphasis (always supported — bold first to avoid conflict with italic)
      safe = safe.replace(/\*\*([^*]+?)\*\*/g,'<strong>$1</strong>');
      safe = safe.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g,'$1<em>$2</em>');
      // Single newline inside a paragraph → <br>
      safe = safe.replace(/\n/g, '<br>');
      const cls = classBase ? ` class="${classBase}${i === 0 ? ' is-first' : ''}"` : '';
      return `<p${cls}>${safe}</p>`;
    }).join('');
  };

  const escapeHtml = (s) => String(s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const fmtBold = (s) => escapeHtml(String(s||'')).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');

  /* Tracking (agnóstico) */
  function track(event, props) {
    try {
      window.dispatchEvent(new CustomEvent('fc-track', { detail: { event, props: props || {} } }));
      if (typeof window.gtag === 'function') window.gtag('event', event, props || {});
      if (typeof window.plausible === 'function') window.plausible(event, { props: props || {} });
      if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...props });
    } catch (_) {}
  }

  /* Persistencia */
  function saveState() {
    try { sessionStorage.setItem(CFG.STORAGE_KEY, JSON.stringify({
      cursor: state.cursor, answers: state.answers, lead: state.lead
    })); } catch (_) {}
  }
  function loadState() {
    try { const r = sessionStorage.getItem(CFG.STORAGE_KEY); return r ? JSON.parse(r) : null; }
    catch (_) { return null; }
  }
  function clearState() { try { sessionStorage.removeItem(CFG.STORAGE_KEY); } catch (_) {} }

  /* Carga del config */
  async function loadConfig() {
    const r = await fetch(CFG.QUESTIONS_PATH, { cache: 'no-store' });
    if (!r.ok) throw new Error('No se pudo cargar el cuestionario.');
    state.config = await r.json();
  }

  function totalQuestions() { return state.config.questions.length; }

  /* Render de pregunta */
  function renderQuestion() {
    const q = state.config.questions[state.cursor];
    if (!q) return;

    // Reset the advancing guard so the user can interact with the freshly rendered question
    state.advancing = false;

    state.timings.shownAt[q.id] = Date.now();
    if (!state.timings.startedAt) state.timings.startedAt = Date.now();

    const section = state.config.sections[q.section] || {};
    const slot = $('#questionSlot');
    const selected = state.answers[q.id];
    const isRevenue = q.type === 'single_choice_revenue';

    slot.innerHTML = `
      <div class="question__section">${escapeHtml(section.label || '')} · Pregunta ${state.cursor + 1} de ${totalQuestions()}</div>
      <h2 class="question__text">${escapeHtml(q.text)}</h2>
      ${q.subtitle ? `<p class="question__sub">${escapeHtml(q.subtitle)}</p>` : ''}
      <div class="options" role="radiogroup" aria-label="${escapeHtml(q.text)}"></div>
    `;
    const list = $('.options', slot);

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option' + (isRevenue ? ' option--simple' : '') + (selected === opt.value ? ' is-selected' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', selected === opt.value ? 'true' : 'false');
      btn.dataset.value = opt.value;
      const letter = isRevenue ? (idx + 1) : String.fromCharCode(65 + idx);
      btn.innerHTML = `
        <span class="option__bullet" aria-hidden="true">${letter}</span>
        <span class="option__body">
          <span class="option__label">${escapeHtml(opt.label)}</span>
          ${opt.detail ? `<span class="option__detail">${escapeHtml(opt.detail)}</span>` : ''}
        </span>
      `;
      btn.addEventListener('click', () => selectOption(q.id, opt));
      list.appendChild(btn);
    });

    // Progress
    $('#progressWrap').hidden = false;
    $('#progressSection').textContent = `${section.label || ''} · ${section.num || '?'} de ${section.of || 3}`;
    updateProgress();
    $('#btnBack').disabled = state.cursor === 0;
    $('#questionCounter').textContent = `${state.cursor + 1} / ${totalQuestions()}`;
    show('question');
  }

  function updateProgress() {
    const pct = ((state.cursor) / totalQuestions()) * 100;
    $('#progressFill').style.width = pct + '%';
    $('#progressText').textContent = `Pregunta ${state.cursor + 1} de ${totalQuestions()}`;
  }

  function selectOption(qid, opt) {
    // Guard against double-tap / rage-tap that would skip a question.
    // Once an option is selected, ignore further clicks until the next question renders.
    if (state.advancing) return;
    state.advancing = true;

    state.answers[qid] = opt.value;
    const shown = state.timings.shownAt[qid];
    if (shown) state.timings.perQuestion[qid] = Math.round((Date.now() - shown) / 1000);

    track('question_answered', { id: qid, value: opt.value, time_sec: state.timings.perQuestion[qid] || 0 });
    saveState();

    $$('.option').forEach(b => {
      const sel = b.dataset.value === opt.value;
      b.classList.toggle('is-selected', sel);
      b.setAttribute('aria-checked', sel ? 'true' : 'false');
      // Disable all options on this question to avoid late clicks landing on the next render
      b.disabled = true;
      b.style.pointerEvents = 'none';
    });

    setTimeout(advance, 220);
  }

  function advance() {
    if (state.cursor < totalQuestions() - 1) {
      state.cursor += 1;
      saveState();
      renderQuestion();
    } else {
      $('#progressFill').style.width = '100%';
      $('#progressText').textContent = 'Listo · último paso';
      setTimeout(() => {
        $('#progressWrap').hidden = true;
        renderCapture();
      }, 400);
    }
  }

  function back() {
    if (state.cursor === 0) return;
    state.cursor -= 1;
    saveState();
    renderQuestion();
  }

  /* Capture */
  function renderCapture() {
    if (state.lead.name) $('#fieldName').value = state.lead.name;
    if (state.lead.email) $('#fieldEmail').value = state.lead.email;
    if (state.lead.whatsapp) $('#fieldWhatsapp').value = state.lead.whatsapp;
    if (state.lead.business_context) $('#fieldBusiness').value = state.lead.business_context;
    setupBusinessCounter();
    show('capture');
    setTimeout(() => $('#fieldName').focus(), 250);
  }

  function setupBusinessCounter() {
    const ta = $('#fieldBusiness');
    const counter = $('#businessCount');
    const wrap = counter?.parentElement;
    if (!ta || !counter || ta.dataset.bound === '1') return;
    ta.dataset.bound = '1';
    const update = () => {
      const n = ta.value.length;
      counter.textContent = n;
      if (wrap) wrap.classList.toggle('is-near-limit', n >= 450);
    };
    ta.addEventListener('input', update);
    update();
  }

  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  async function onSubmit(e) {
    e.preventDefault();
    const name = $('#fieldName').value.trim();
    const email = $('#fieldEmail').value.trim();
    const whatsapp = $('#fieldWhatsapp').value.trim();
    const business_context = ($('#fieldBusiness')?.value || '').trim().slice(0, 500);

    $('#errName').textContent = '';
    $('#errEmail').textContent = '';

    let ok = true;
    if (name.length < 2) { $('#errName').textContent = 'Tu nombre, por favor.'; ok = false; }
    if (!validateEmail(email)) { $('#errEmail').textContent = 'Revisa el formato del email.'; ok = false; }
    if (!ok) return;

    state.lead = { name, email, whatsapp, business_context };
    saveState();

    $('#btnSubmit').disabled = true;
    $('#btnSubmit').textContent = 'Analizando tu caso…';

    const payload = buildPayload();
    await submitDiagnostic(payload);
  }

  function buildPayload() {
    return {
      diagnostic_id: state.config.diagnostic_id,
      version: state.config.version,
      lead: { ...state.lead },
      answers: { ...state.answers },
      meta: {
        submitted_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        lang: navigator.language || 'es',
        time_per_question_sec: state.timings.perQuestion,
        total_time_sec: state.timings.startedAt ? Math.round((Date.now() - state.timings.startedAt) / 1000) : null
      }
    };
  }

  /* ============== SUBMIT ============== */
  async function submitDiagnostic(payload) {
    show('loading');
    track('submit_started', { email: payload.lead.email });

    // Kick off API call in parallel with the cinematic loader
    const apiPromise = (async () => {
      if (CFG.WEBHOOK_URL) return postWithTimeout(CFG.WEBHOOK_URL, payload);
      if (CFG.USE_LOCAL_FALLBACK) {
        await new Promise(r => setTimeout(r, 40000));
        return generateLocalFallback(payload);
      }
      throw new Error('No webhook configured.');
    })();

    try {
      const result = await runCinematicLoader(payload, apiPromise);
      if (!result || !result.diagnostico_ejecutivo) throw new Error('Respuesta inesperada del servidor.');

      try { localStorage.setItem('fc_last_result', JSON.stringify({ result, at: Date.now() })); } catch (_) {}
      track('submit_success', { arquetipo: result.arquetipo?.id });

      // Wait for user to click the "Ver mi reporte" button (resolved by the loader).
      // renderResult is triggered by the button handler set by the loader.
      window.__pendingResult = result;
    } catch (err) {
      console.error('Submit failed:', err);
      track('submit_failed', { error: String(err).slice(0, 100) });
      $('#errorMsg').textContent = err.message || 'No pudimos procesar tu diagnóstico.';
      $('#btnRetry').onclick = () => onSubmit({ preventDefault: () => {} });
      show('error');
    }
  }

  async function postWithTimeout(url, body) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), CFG.REQUEST_TIMEOUT_MS);
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
        mode: 'cors'
      });
      if (!r.ok) throw new Error(`El servidor respondió ${r.status}.`);
      const text = await r.text();
      if (!text) return {};
      try { return JSON.parse(text); } catch (_) { return { raw: text }; }
    } finally {
      clearTimeout(t);
    }
  }

  /* ============== CINEMATIC LOADER (v2) ============== */
  let loaderPercent = 0, loaderTimer = null, loaderFinishing = false;

  // Pre-compute pattern matches client-side (mirror of the cross-patterns in the system prompt,
  // but with cold-traffic-friendly labels)
  function computePatterns(answers) {
    const a = answers;
    const inSet = (v, s) => s.includes(String(v).toLowerCase());
    const Q9hi = ['15_to_50k','50_to_100k','gt_100k'].includes(a.Q9);
    const Q9mid = ['5_to_15k'].includes(a.Q9) || Q9hi;
    return [
      { key:'crecimiento_sin_rentabilidad', label:'Crecimiento sin rentabilidad', match: Q9hi && inSet(a.Q10,['a','b']) },
      { key:'riesgo_agotamiento',           label:'Riesgo de agotamiento',         match: inSet(a.Q2,['a','b','c']) && inSet(a.Q3,['a','b']) && inSet(a.Q6,['a','b']) },
      { key:'mensaje_poco_claro',           label:'Mensaje poco claro',            match: inSet(a.Q5,['a','b']) && inSet(a.Q6,['a','b']) },
      { key:'bloqueo_ventas',               label:'Bloqueo en ventas',             match: inSet(a.Q5,['c','d']) && inSet(a.Q8,['a','b']) },
      { key:'sin_recurrencia',              label:'Negocio sin recurrencia',       match: inSet(a.Q11,['a','b']) && inSet(a.Q7,['a','b']) },
      { key:'falta_claridad',               label:'Falta de claridad estratégica', match: inSet(a.Q1,['a','b']) && inSet(a.Q2,['a','b']) },
      { key:'modelo_escalable',             label:'Modelo escalable activo',       match: a.Q3==='d' && a.Q10==='d' && inSet(a.Q11,['c','d']) },
      { key:'no_escala_bien',               label:'Modelo que no escala bien',     match: Q9hi && inSet(a.Q12,['a','b','c']) },
      { key:'tech_subutilizada',            label:'Tecnología subutilizada',       match: inSet(a.Q4,['a','b','c']) && Q9mid }
    ];
  }

  // Helpers to manage scene transitions and percent
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
  function setPercent(p) {
    const clamped = Math.max(0, Math.min(99.9, p));
    const numEl = $('#percentNum');
    const fill = $('#progressLinearFill');
    if (!numEl) return;
    // Show integer part + (optional decimal) when above 95
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
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // Typewriter helper. Writes `text` into element with cursor.
  async function typewriter(el, text, speed=28, opts={}) {
    el.innerHTML = '';
    const cursor = document.createElement('span');
    cursor.className = opts.cursorClass || 'cli__cursor';
    el.appendChild(cursor);
    for (let i = 0; i < text.length; i++) {
      cursor.insertAdjacentText('beforebegin', text[i]);
      // Pauses for natural rhythm
      const ch = text[i];
      const wait = ch === ',' ? speed * 4 : ch === '.' ? speed * 6 : ch === '\n' ? speed * 2 : speed;
      await sleep(wait);
    }
    if (opts.removeCursor) cursor.remove();
  }

  // Always-on percent ticker — runs in background, ensures the % counter never stalls.
  let percentTickerActive = false;
  function startPercentTicker() {
    if (percentTickerActive) return;
    percentTickerActive = true;
    const tick = () => {
      if (!percentTickerActive) return;
      // Add jitter when not actively tweening so the eye always sees motion
      const cur = parseFloat(($('#percentNum')?.textContent) || '0');
      // Only nudge if we're between 1 and 99
      if (cur > 0 && cur < 99) {
        // nudge ±0.3 around current value (visual jitter, no real progress)
        // Skip — actual tweens drive the counter; this just ensures we never see frozen state.
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function stopPercentTicker() { percentTickerActive = false; }

  // ========= Main entry: run the cinematic loader, returns the API result =========
  // Adaptive timing: if API responds early, skip remaining scenes and jump to spoiler.
  // Total target: ~50-60s. If API is slow, scene 6 loops until result arrives.
  async function runCinematicLoader(payload, apiPromise) {
    const lead = payload.lead || {};
    const firstName = (lead.name || '').trim().split(' ')[0] || 'tú';
    const patterns = computePatterns(payload.answers || {});
    let apiDone = false, apiResult = null, apiError = null;

    apiPromise.then(r => { apiResult = r; apiDone = true; })
              .catch(e => { apiError = e; apiDone = true; });

    // Start at 1% IMMEDIATELY so user sees motion from frame 0
    setPercent(1);
    startPercentTicker();

    // Stretched timeline targeting ~1:45 baseline (real API median ~90s, p90 ~150s)
    // Scenes 1-5 cover 1→82% in ~80s. Scene 6 covers 82→95% in ~14s, then decimals tick to ~99.9.
    const sceneTargets = [
      { idx: 0, fn: playScene1, args: [payload, firstName], from: 1,  to: 16, dur: 14000 },
      { idx: 1, fn: playScene2, args: [patterns],            from: 16, to: 32, dur: 17000 },
      { idx: 2, fn: playScene3, args: [],                    from: 32, to: 49, dur: 15000 },
      { idx: 3, fn: playScene4, args: [],                    from: 49, to: 66, dur: 17000 },
      { idx: 4, fn: playScene5, args: [firstName],           from: 66, to: 82, dur: 16000 }
    ];

    // Scene 1 is already active (default). For later scenes we transition.
    activateScene(0);

    for (let s = 0; s < sceneTargets.length; s++) {
      const sc = sceneTargets[s];
      if (s > 0) transitionTo(sc.idx);
      // Run percent tween + scene play in parallel
      const tweenP = tweenPercent(sc.from, sc.to, sc.dur);
      const sceneP = sc.fn(...sc.args);
      await Promise.all([tweenP, sceneP]);

      // Early-finish: if API is done, jump straight to scene 6 + spoiler
      if (apiDone && apiResult) {
        await fastForwardToFinale(apiResult);
        if (apiError) throw apiError;
        return apiResult;
      }
    }

    // ----- Scene 6: Verification + spoiler -----
    transitionTo(5);
    await tweenPercent(82, 95, 5500);
    await playScene6(apiPromise, /*autoRender=*/true);

    setPercentClean100();
    stopPercentTicker();

    if (apiError) throw apiError;
    return apiResult;
  }

  // Fast-forward path when the API responds before we finish the loader timeline
  async function fastForwardToFinale(result) {
    transitionTo(5);
    // Jump percent to 95% quickly
    const cur = parseFloat($('#percentNum').textContent || '0');
    await tweenPercent(cur, 95, 800);
    // Render the checklist instantly with all items already done
    const list = $('#checklist');
    const items = [
      'Análisis personalizado a tu perfil',
      'Tono calibrado a tu negocio',
      'Patrones de tu caso identificados',
      'Cambio #1 con mayor impacto aislado',
      'Plan de los próximos 30/60/90 días',
      'Costo de no actuar cuantificado',
      'La verdad incómoda que casi nadie te dirá'
    ];
    list.innerHTML = items.map(t => `<li class="cli-item is-done"><span class="cli-item__icon">✓</span><span>${escapeHtml(t)}</span></li>`).join('');
    // Stagger the visual pop of each item even though they're already done
    Array.from(list.children).forEach((li, i) => {
      li.style.opacity = '0';
      li.style.transform = 'translateX(-6px)';
      setTimeout(() => {
        li.style.transition = 'opacity .25s, transform .25s';
        li.style.opacity = '1';
        li.style.transform = 'none';
      }, 90 * i);
    });
    await sleep(900);
    setPercent(100);
    await revealSpoilerAndAutoRender(result);
  }

  // Reveals spoiler then auto-renders the result page (no button click needed)
  async function revealSpoilerAndAutoRender(result) {
    if (result && result.arquetipo && result.arquetipo.nombre) {
      $('#spoilerArchetype').textContent = result.arquetipo.nombre;
      $('#spoiler').hidden = false;
    }
    // Hide the legacy button — we auto-render
    const cta = $('#sceneCta');
    if (cta) cta.hidden = true;

    // Hold on the spoiler for 2.4s so the user reads "Eres El Hustler Quemado"
    await sleep(2400);
    stopPercentTicker();
    renderResult(result);
    clearState();
  }

  function transitionTo(idx) {
    const all = sceneEls();
    all.forEach((el, i) => {
      if (el.classList.contains('is-active')) el.classList.add('is-leaving');
    });
    setTimeout(() => activateScene(idx), 230);
  }

  // ========= Scene 1: CLI ingesta =========
  // No dead air at start: first line is rendered IMMEDIATELY (no pre-sleep).
  async function playScene1(payload, firstName) {
    const cliBody = $('#cliBody');
    if (!cliBody) return;
    cliBody.innerHTML = '';
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; }})();
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');
    const ctxLen = (payload.lead?.business_context || '').length;
    const hash = Math.random().toString(16).slice(2,6) + '-' + Math.random().toString(16).slice(2,6) + '-' + Math.random().toString(16).slice(2,6);
    const lines = [
      { html: `<span class="prompt">&gt;</span> Sesión iniciada · <span class="accent">${hh}:${mm}:${ss}</span> · ${tz}` },
      { html: `<span class="prompt">&gt;</span> Recibido de <span class="accent">${escapeHtml(firstName)}</span>: 12 respuestas · ${ctxLen} caracteres de contexto` },
      { html: `<span class="prompt">&gt;</span> Idioma: ES · Origen: ${(document.referrer && new URL(document.referrer).hostname) || 'directo'}` },
      { html: `<span class="prompt">&gt;</span> Encriptando datos... <span class="ok">[✓]</span>` },
      { html: `<span class="prompt">&gt;</span> Hash de sesión: <span class="muted">${hash}</span>` },
      { html: `<span class="prompt">&gt;</span> Conectando con el sistema de análisis...<span class="cli__cursor"></span>` }
    ];
    // First line: render IMMEDIATELY so the user sees content at frame 0
    for (let i = 0; i < lines.length; i++) {
      const el = document.createElement('div');
      el.className = 'cli__line';
      el.innerHTML = lines[i].html;
      cliBody.appendChild(el);
      // Stretched cadence — first lines fast, later lines breathe more
      const wait = i === 0 ? 0
                : i === 1 ? 900
                : i === 2 ? 1100
                : i === 3 ? 1500
                : i === 4 ? 1700
                : 2100 + Math.random() * 400;
      if (wait > 0) await sleep(wait);
    }
    // Tail pad so scene 1 totals ~14s
    await sleep(2400);
  }

  // ========= Scene 2: Pattern chips =========
  async function playScene2(patterns) {
    const grid = $('#patternsGrid');
    const caption = $('#patternsCaption');
    const counter = $('#patternsCount');
    if (!grid) return;
    grid.innerHTML = '';
    let matchCount = 0;
    counter.textContent = '0';

    // Render all chips in idle state
    const chips = patterns.map(p => {
      const el = document.createElement('div');
      el.className = 'pchip';
      el.innerHTML = `<span class="pchip__icon"></span><span>${escapeHtml(p.label)}</span>`;
      grid.appendChild(el);
      return el;
    });

    // Eval one by one — slowed down for the longer timeline (~1.8s each = ~16s for 9)
    for (let i = 0; i < patterns.length; i++) {
      const p = patterns[i];
      const chip = chips[i];
      chip.classList.add('is-checking');
      caption.textContent = `Probando: ${p.label}…`;
      await sleep(1000);
      chip.classList.remove('is-checking');
      chip.classList.add(p.match ? 'is-match' : 'is-skip');
      if (p.match) {
        matchCount++;
        counter.textContent = matchCount;
        caption.textContent = `Patrón detectado: ${p.label}`;
      } else {
        caption.textContent = `${p.label} — sin riesgo en tu caso`;
      }
      await sleep(750);
    }
    caption.textContent = `${matchCount} patrones detectados en tu caso.`;
    await sleep(700);
  }

  // ========= Scene 3: Cases comparison =========
  async function playScene3() {
    const grid = $('#casesGrid');
    const caption = $('#casesCaption');
    const score = $('#casesScore');
    if (!grid) return;
    grid.innerHTML = '';

    // 17 abstract niche buckets (anonymized — no client names exposed in loader)
    const cases = [
      { i:'C', sub:'Coach' },         { i:'C', sub:'Consultor' },     { i:'A', sub:'Agencia' },
      { i:'E', sub:'Experto' },       { i:'M', sub:'Mentor' },        { i:'F', sub:'Formador' },
      { i:'P', sub:'Profesional' },   { i:'E', sub:'Estratega' },     { i:'F', sub:'Founder' },
      { i:'C', sub:'Creador' },       { i:'A', sub:'Asesor' },        { i:'E', sub:'Educador' },
      { i:'C', sub:'Consultor' },     { i:'A', sub:'Agencia' },       { i:'C', sub:'Coach' },
      { i:'E', sub:'Experto' },       { i:'F', sub:'Founder' }
    ];
    const winnerIdx = Math.floor(cases.length * 0.30); // ~30% mark

    // Add scan line
    const scan = document.createElement('div');
    scan.className = 'cases-scan';
    grid.appendChild(scan);

    // Render cards in stagger — slower stagger to fill more time
    cases.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'case-card';
      card.innerHTML = `<div>${c.i}</div><div class="case-card__sub">${escapeHtml(c.sub)}</div>`;
      grid.appendChild(card);
      setTimeout(() => card.classList.add('is-revealed'), 110 * i);
    });
    await sleep(110 * cases.length + 400);

    // Run scan twice for visual richness in stretched timeline
    caption.textContent = 'Cruzando tus respuestas con sesiones de consultoría previas…';
    scan.classList.add('is-running');
    await sleep(1700);
    scan.classList.remove('is-running');
    await sleep(300);
    caption.textContent = 'Identificando patrones recurrentes en negocios similares…';
    scan.classList.add('is-running');
    await sleep(1700);
    scan.classList.remove('is-running');

    // Highlight winner
    caption.textContent = 'Aislando el patrón dominante en tu perfil…';
    await sleep(1100);
    const winnerCard = grid.querySelectorAll('.case-card')[winnerIdx];
    if (winnerCard) winnerCard.classList.add('is-winner');
    caption.textContent = `Patrón identificado en tu perfil`;

    // Animate score counter 0 → 89 (slower for stretched timeline)
    const to = 89;
    let val = 0;
    const dur = 3200;
    const t0 = Date.now();
    await new Promise(res => {
      const tick = () => {
        const t = Math.min(1, (Date.now() - t0) / dur);
        val = Math.floor(t * to);
        score.textContent = val;
        if (t < 1) requestAnimationFrame(tick); else res();
      };
      tick();
    });
    await sleep(900);
  }

  // ========= Scene 4: Knowledge Graph (SVG) =========
  // Vector knowledge map: nodes connected by edges, drawing in waves like an AI brain.
  async function playScene4() {
    const caption = $('#leverCaption');
    const counter = $('#leverCount');
    const edgesG = $('#kgEdges');
    const nodesG = $('#kgNodes');
    const finalG = $('#kgFinal');
    const redacted = document.querySelector('.lever-redacted');
    if (!edgesG || !nodesG) return;

    // Reset
    edgesG.innerHTML = ''; nodesG.innerHTML = ''; finalG.innerHTML = '';
    redacted?.classList.remove('is-visible');
    counter.textContent = '47';

    // Generate 18 nodes in clustered layout (3 clusters mimicking founder/marketing/cash)
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

    // Render nodes (initially with breathing animation via CSS)
    const nodeEls = nodes.map((p, i) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 3.4);
      c.style.opacity = '0';
      c.style.transition = 'opacity .4s';
      nodesG.appendChild(c);
      // Stagger fade-in
      setTimeout(() => { c.style.opacity = '1'; }, 60 * i);
      return c;
    });

    // Generate edges: connect nearby nodes (within distance threshold)
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 110) edges.push({ a: i, b: j, d });
      }
    }
    // Limit to ~22 edges to avoid clutter
    edges.sort((a, b) => a.d - b.d);
    const edgesPick = edges.slice(0, 22);

    const edgeEls = edgesPick.map((e, k) => {
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const A = nodes[e.a], B = nodes[e.b];
      ln.setAttribute('x1', A.x); ln.setAttribute('y1', A.y);
      ln.setAttribute('x2', B.x); ln.setAttribute('y2', B.y);
      edgesG.appendChild(ln);
      // Stagger draw
      setTimeout(() => ln.classList.add('is-drawn'), 200 + k * 80);
      return { el: ln, a: e.a, b: e.b };
    });

    caption.textContent = 'Mapeando 47 conexiones de tu negocio…';
    await sleep(3200);

    // Filter waves — fade nodes/edges progressively (slowed for stretched timeline)
    const waves = [
      { count: 12, cap: 'Filtrando por impacto / esfuerzo…' },
      { count: 5,  cap: 'Eliminando los que no componen con el resto…' },
      { count: 3,  cap: 'Aislando los de mayor efecto compuesto…' },
      { count: 1,  cap: 'Encontrando el que más mueve el resultado…' }
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
        await sleep(140);  // was 60 — slower fades
      }
      counter.textContent = w.count;
      await sleep(1000);  // was 550
    }

    // Final reveal: highlight the winning node + its remaining edges
    nodeEls[finalNodeIdx].classList.add('is-final');
    edgeEls.forEach(e => {
      if ((e.a === finalNodeIdx || e.b === finalNodeIdx) && !e.el.classList.contains('is-faded')) {
        e.el.classList.add('is-final');
      }
    });

    // Add halo ping ring around final node
    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('cx', nodes[finalNodeIdx].x);
    halo.setAttribute('cy', nodes[finalNodeIdx].y);
    halo.setAttribute('r', 6);
    finalG.appendChild(halo);

    redacted?.classList.add('is-visible');
    caption.textContent = 'Tu palanca #1 identificada.';
    await sleep(1800);
  }

  // ========= Scene 5: Document writing =========
  async function playScene5(firstName) {
    const docBody = $('#docBody');
    if (!docBody) return;
    // Stretched: 6 fragments now. Total ~16s.
    const fragments = [
      `${firstName}, basado en tus 12 respuestas, lo primero que veo es un patrón claro…`,
      `Calibrando el tono al perfil específico de tu negocio…`,
      `Cruzando tus respuestas con la base interna de sesiones previas…`,
      `Verificando que cada recomendación sea aplicable a tu caso real…`,
      `Pesando el costo de no actuar contra el costo de actuar…`,
      `Asegurando que cada palabra te sirva, ${firstName}.`
    ];
    docBody.innerHTML = '';
    for (let i = 0; i < fragments.length; i++) {
      const el = document.createElement('div');
      docBody.appendChild(el);
      await typewriter(el, fragments[i], 32, { cursorClass: 'doc__cursor' });
      await sleep(550);
      el.style.transition = 'opacity .35s';
      el.style.opacity = '0.25';
      await sleep(320);
      docBody.innerHTML = '';
    }
  }

  // ========= Scene 6: Verification + spoiler (auto-render, no click) =========
  async function playScene6(apiPromise, autoRender) {
    const list = $('#checklist');
    if (!list) return;

    const items = [
      'Análisis personalizado a tu perfil',
      'Tono calibrado a tu negocio',
      'Patrones de tu caso identificados',
      'Cambio #1 con mayor impacto aislado',
      'Plan de los próximos 30/60/90 días',
      'Costo de no actuar cuantificado',
      'La verdad incómoda que casi nadie te dirá'
    ];

    list.innerHTML = '';
    const liEls = items.map(text => {
      const li = document.createElement('li');
      li.className = 'cli-item';
      li.innerHTML = `<span class="cli-item__icon">⠋</span><span>${escapeHtml(text)}</span>`;
      list.appendChild(li);
      return li;
    });

    let result = null, done = false;
    apiPromise.then(r => { result = r; done = true; }).catch(() => { done = true; });

    // Run all 7 checklist items at slower cadence (~1.4s each = ~10s)
    for (let i = 0; i < liEls.length; i++) {
      const li = liEls[i];
      li.classList.add('is-running');
      const baseMs = 1300;
      const stretchMs = !done && i === liEls.length - 1 ? 1800 : baseMs;
      await sleep(stretchMs);
      li.classList.remove('is-running');
      li.classList.add('is-done');
      li.querySelector('.cli-item__icon').textContent = '✓';
    }

    // ====== EXTENDED WAIT MODE ======
    // If API still pending, kick into the looping waiting state with:
    //  - Decimal percent ticker (95.0 → 95.1 → 95.2 ... up to 99.9)
    //  - Rotating "Procesando" caption messages
    //  - Last checklist item loops spinner
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
        'Cruzando con la base interna de sesiones',
        'Asegurando que cada palabra te sirva',
        'Procesando',
        'Esto suele tomar entre 1 y 2 minutos',
        'Casi listo',
        'Ya casi terminamos'
      ];
      let msgIdx = 0;
      let dotCount = 1;
      const last = liEls[liEls.length - 1];

      // Kick the percent decimals: 95.0 incrementing slowly
      let dec = 0;  // out of 49 (so we go 95.0 → 99.9 over time)
      const decInterval = setInterval(() => {
        if (done) return;
        dec = Math.min(49, dec + 1);
        const value = 95 + dec / 10;
        setPercent(value);
      }, 1700);  // ~1.7s per 0.1 step → ~83s to climb 95→99.9

      // Caption rotator
      const captionInterval = setInterval(() => {
        if (done) return;
        if (captionText) captionText.textContent = waitMessages[msgIdx % waitMessages.length];
        msgIdx++;
      }, 4500);

      // Dots animator
      const dotsInterval = setInterval(() => {
        if (done) return;
        dotCount = (dotCount % 3) + 1;
        if (captionDots) captionDots.textContent = '.'.repeat(dotCount);
      }, 450);

      // Spinner loop on last item
      while (!done) {
        last.classList.remove('is-done');
        last.classList.add('is-running');
        last.querySelector('.cli-item__icon').textContent = '⠋';
        await sleep(900);
        if (done) break;
        last.classList.remove('is-running');
        last.classList.add('is-done');
        last.querySelector('.cli-item__icon').textContent = '✓';
        await sleep(400);
      }

      clearInterval(decInterval);
      clearInterval(captionInterval);
      clearInterval(dotsInterval);
      // Hide the wait caption once we have the result — spoiler will take over
      if (captionWrap) captionWrap.hidden = true;
      // Make sure last item is checked
      last.classList.remove('is-running');
      last.classList.add('is-done');
      last.querySelector('.cli-item__icon').textContent = '✓';
    }

    // Auto-reveal spoiler + render result (no button click)
    if (autoRender) {
      await revealSpoilerAndAutoRender(result);
    }
  }

  // Legacy stubs (kept for the small old loader styles still referenced elsewhere)
  function startLoader() {}
  function stopLoader() {}
  function finishLoader(cb) { if (cb) cb(); }

  // Legacy spawn dots — keep for small loader scenes
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


  /* ============== RENDER RESULT ============== */
  function renderResult(result) {
    const arq = result.arquetipo || {};
    const scores = result.scores || {};

    $('#rArchetype').textContent = arq.nombre || 'Tu diagnóstico';
    renderParagraphs($('#rLectura'), result.diagnostico_ejecutivo || '', { classBase: 'result__lectura-p' });

    // Report meta
    const today = new Date();
    const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    if ($('#rReportDate')) $('#rReportDate').textContent = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
    if ($('#rReportId')) $('#rReportId').textContent = `Reporte #${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    // Cliente análogo card
    const ca = arq.cliente_analogo || {};
    if (ca.nombre) {
      $('#rAnalogCard').hidden = false;
      $('#rAnalogName').textContent = ca.nombre;
      $('#rAnalogSnap').textContent = ca.snapshot || '';
      $('#rAnalogResult').textContent = ca.resultado || '';
      if (ca.cita) $('#rAnalogCita').textContent = `"${ca.cita}"`;
    }

    // Scores
    const sc = $('#rScores');
    sc.innerHTML = '';
    const scoreEntries = [
      { key: 'founder_flow', label: 'Founder Flow' },
      { key: 'lead_flow',    label: 'Lead Flow'    },
      { key: 'cash_flow',    label: 'Cash Flow'    }
    ];
    scoreEntries.forEach(({ key, label }) => {
      const s = scores[key] || {};
      const num = s.score != null ? s.score : '—';
      const div = document.createElement('div');
      div.className = 'score';
      div.innerHTML = `
        <div class="score__label">${label}</div>
        <div class="score__num">${num}<small>/100</small></div>
        <div class="score__bar"><div class="score__bar-fill" style="width:0%"></div></div>
        <p class="score__lectura">${escapeHtml(s.lectura || '')}</p>
      `;
      sc.appendChild(div);
      // animate fill
      requestAnimationFrame(() => {
        const fill = div.querySelector('.score__bar-fill');
        if (fill && typeof num === 'number') fill.style.width = Math.max(2, num) + '%';
      });
    });

    // El cambio #1
    const bd = result.big_domino || {};
    $('#rBigDominoLever').textContent = bd.palanca || '';
    renderParagraphs($('#rBigDominoWhy'), bd.por_que || '');

    // Forbidden truth
    renderParagraphs($('#rForbidden'), result.forbidden_truth || '');

    // Costo
    const ci = result.costo_de_inaccion || {};
    if ($('#rVentana') && ci.ventana_critica_meses) {
      $('#rVentana').innerHTML = `Tienes <strong>${ci.ventana_critica_meses} meses</strong> antes de que el costo de no moverte se vuelva irreversible.`;
    }
    renderParagraphs($('#rCosto'), ci.narrativa || '');

    // Cita Rodrigo (sin comillas dobles, ya las maneja el CSS via :before)
    $('#rQuote').textContent = result.cita_final_rodrigo || '';

    // CTA final
    const cta = result.cta_personalizado || {};
    if (cta.copy_sugerido) renderParagraphs($('#ctaFinalText'), cta.copy_sugerido);
    $('#ctaFinalBtn').href = CFG.URL_BOOKING;

    track('result_viewed', { arquetipo: arq.id });

    show('result');
  }

  /* ============== LOCAL FALLBACK ==============
     Genera un reporte determinístico basado en las respuestas
     mientras el workflow n8n no exista. Sigue el JSON schema del system prompt v6.
  */
  function generateLocalFallback(payload) {
    const a = payload.answers;
    const lead = payload.lead;
    const firstName = (lead.name || 'tú').split(' ')[0];

    const points = (v) => ({a:25,b:50,c:75,d:100}[v] || 50);
    const fF = Math.round((points(a.Q1)+points(a.Q2)+points(a.Q3)+points(a.Q4))/4);
    const lF = Math.round((points(a.Q5)+points(a.Q6)+points(a.Q7)+points(a.Q8))/4);
    const cF = Math.round((points(a.Q10)+points(a.Q11)+points(a.Q12))/3);
    const apa = Math.round((cF*fF)/100);

    const revLabel = {
      'lt_2_5k':'menos de $2,500/mes',
      '2_5_to_5k':'$2,500-$5,000/mes',
      '5_to_15k':'$5,000-$15,000/mes',
      '15_to_50k':'$15,000-$50,000/mes',
      '50_to_100k':'$50,000-$100,000/mes',
      'gt_100k':'más de $100,000/mes'
    }[a.Q9] || '';
    const revHigh = ['15_to_50k','50_to_100k','gt_100k'].includes(a.Q9);

    // Arquetipo
    let arch = { id:'A2', nombre:'El Artista Disperso' };
    if (revHigh && ['a','b'].includes(a.Q10) && ['a','b'].includes(a.Q3)) arch = { id:'A1', nombre:'El Hustler Quemado' };
    else if (a.Q5==='c' && a.Q6==='c' && a.Q9!=='lt_2_5k') arch = { id:'A3', nombre:'La Máquina Desalineada' };
    else if (['c','d'].includes(a.Q1) && ['a','b'].includes(a.Q5)) arch = { id:'A4', nombre:'El Especialista Invisible' };
    else if (['a','b'].includes(a.Q3) && ['a','b'].includes(a.Q11)) arch = { id:'A5', nombre:'El Operador Atrapado' };
    else if (a.Q3==='d' && ['c','d'].includes(a.Q10) && ['c','d'].includes(a.Q11)) arch = { id:'A6', nombre:'El Escalador Real' };
    else if (a.Q9==='lt_2_5k') arch = { id:'A7', nombre:'Pre-Validación' };

    // Fase Infinite Flow (paso más bajo desbloqueado)
    let paso = 5, nombrePaso = 'Apalancamiento Real';
    if (fF < 50) { paso = 1; nombrePaso = 'Diagnóstico y Plan de Vida + Negocio'; }
    else if (points(a.Q5) < 60) { paso = 2; nombrePaso = 'Alineación de Oferta y Posicionamiento'; }
    else if ((points(a.Q6)+points(a.Q7))/2 < 60) { paso = 3; nombrePaso = 'Lead Flow Infinito'; }
    else if (points(a.Q8) < 60) { paso = 4; nombrePaso = 'Ventas Consultivas Sin Fricción'; }

    // Patrones
    const patrones = [];
    if (revHigh && ['a','b'].includes(a.Q10)) patrones.push({
      nombre: 'Ilusión de Apalancamiento',
      diagnostico: `Estás facturando ${revLabel} pero menos del 30% se queda contigo. Eso no es escalar — es escalar costos, complejidad y caos. Engordar no es lo mismo que crear músculo.`
    });
    if (['a','b','c'].includes(a.Q2) && ['a','b'].includes(a.Q3)) patrones.push({
      nombre: 'Burnout Inminente',
      diagnostico: 'Tu sistema nervioso está pidiendo permiso para frenar. Si lo ignoras 6 meses más, el negocio te frena por ti — es el patrón de Erika antes de migrar a un modelo más ligero.'
    });
    if (['a','b'].includes(a.Q5) && ['a','b'].includes(a.Q6)) patrones.push({
      nombre: 'Marketing Roto',
      diagnostico: 'Tu cliente ideal no entiende qué vendes en 5 segundos. Eso explica el resto de los problemas que sientes — el cierre forzado, los leads tibios, el contenido que cuesta.'
    });
    if (['a','b'].includes(a.Q1) && ['a','b'].includes(a.Q2)) patrones.push({
      nombre: 'Founder Fragmentado',
      diagnostico: 'Tu negocio refleja tu cabeza. La complejidad de afuera es complejidad de adentro. Antes de ajustar oferta o ads, hay que ajustar a quién está al timón.'
    });

    return {
      diagnostico_ejecutivo: `${firstName}, basado en tus respuestas tu negocio está en ${nombrePaso}. Tu Founder Flow es ${fF}/100, tu Lead Flow ${lF}/100, tu Cash Flow ${cF}/100. ${revHigh && cF<50 ? 'Estás escalando costos más rápido que rentabilidad — la Ilusión de Apalancamiento clásica.' : 'La palanca no es hacer más — es eliminar lo que no compone para que lo que sí, escale.'} ${arch.nombre === 'El Hustler Quemado' ? 'El patrón se parece al de Mary Carmen antes de simplificar a 1 oferta y 1 asistente.' : ''}`,
      arquetipo: {
        id: arch.id,
        nombre: arch.nombre,
        descripcion: 'Arquetipo derivado del cruce entre tu nivel de claridad, tu dependencia operativa, tu rentabilidad y tu modelo de negocio. Te va a sonar familiar porque lo viviste — o lo estás viviendo ahora.',
        cliente_analogo: { nombre: 'Mary Carmen', snapshot: 'Psicóloga, 27 productos, equipo de 7, endeudada.', resultado: 'Hoy: 1 producto, 1 asistente, semanas de $15K USD de ganancia neta.', cita: 'En vez de hacer más fue quitar todo lo que no y enfocarme en lo que sí.' }
      },
      fase_infinite_flow: {
        paso_actual: paso,
        nombre_paso: nombrePaso,
        por_que_aqui: `Tus respuestas en Founder Flow (${fF}/100) y Lead Flow (${lF}/100) muestran que el paso más bajo desbloqueado es éste. El orden importa — si saltas un paso, el sistema no compone.`,
        que_se_desbloquea: 'Cuando esto se mueve, los siguientes pasos se vuelven 3x más fáciles porque ya están construyendo sobre piso firme.'
      },
      scores: {
        founder_flow: { score: fF, lectura: fF >= 70 ? 'Operando con claridad y energía sostenible.' : fF >= 50 ? 'Claridad parcial, ejecutando con duda.' : 'Founder fragmentado — necesitas claridad antes que tácticas.' },
        lead_flow:    { score: lF, lectura: lF >= 70 ? 'Sistema de marketing alineado y rentable.' : lF >= 50 ? 'La máquina vende pero le falta filo.' : 'Marketing y oferta sin alineación — los leads llegan tibios.' },
        cash_flow:    { score: cF, lectura: cF >= 70 ? 'Modelo rentable y escalable.' : cF >= 50 ? 'Crecimiento lineal — gasto crece con ventas.' : 'Modelo sangrando — facturas pero no te queda.' },
        apalancamiento_real: { score: apa, lectura: 'Ratio de Apalancamiento Real (margen × energía). Por debajo de 50 significa que cada dólar te cuesta tiempo y energía que no recuperas.' }
      },
      patrones_activos: patrones,
      big_domino: {
        palanca: paso === 1 ? 'Sentarte a definir qué versión de tu negocio sostiene la vida que quieres — antes de tocar otra táctica.' :
                 paso === 2 ? 'Simplificar tu oferta a UNA propuesta que un humano entienda en 8 segundos.' :
                 paso === 3 ? 'Sistematizar tu adquisición de leads con la mezcla que se sienta ligera para ti.' :
                 paso === 4 ? 'Rediseñar el proceso de ventas para que la llamada se sienta como conversación, no pelea.' :
                              'Proteger el flywheel — no romperlo metiendo más combustible del que el sistema puede metabolizar.',
        por_que: 'Esta es la palanca con mayor ratio efecto/esfuerzo según el patrón de tus respuestas. Mover otra cosa antes va a generar movimiento sin composición.',
        como_se_ve_movida: 'En 90 días: el siguiente paso del Sistema Infinite Flow se vuelve obvio, las decisiones bajan a la mitad, y la facturación deja de costarte tanta energía.'
      },
      forbidden_truth: 'Lo que ningún consultor te va a decir es esto: probablemente ya sabes la respuesta — la has sentido en el cuerpo varias veces. Lo que falta no es información. Es permiso para soltar lo que ya no compone, aunque te dé miedo. Hacer menos no es bajar de nivel. Es el upgrade.',
      costo_de_inaccion: {
        ventana_critica_meses: 6,
        costo_revenue_estimado_usd: revHigh ? '$60,000-$150,000 en revenue dejado en la mesa los próximos 12 meses' : 'el negocio sigue sin componer y no llega al primer caso de éxito real',
        costo_energetico: 'El costo más caro no es el dinero — es la energía que se va, las relaciones que se desgastan, y la versión de ti que se va apagando.',
        narrativa: 'El costo se mide en lo que tu pareja, hijos o tu propio cuerpo van a recordar de estos meses. En las conversaciones que llevas posponiendo. En la persona que está detrás de todo esto y que va apagándose. Crece compuesto — igual que el apalancamiento, pero al revés.'
      },
      plan_30_60_90: {
        dias_30: { objetivo: 'Claridad brutal sobre la versión del negocio que sostiene la vida que quieres.', una_accion_quirurgica: 'Sentarte 4 horas un sábado, sin equipo y sin celular, a escribir cómo se ve un día perfecto tuyo en 18 meses — hora por hora — y qué facturación con qué margen lo sostiene.' },
        dias_60: { objetivo: 'Decidir la oferta única que se queda y poner el resto en pausa.', una_accion_quirurgica: 'Mirar tus números de los últimos 12 meses e identificar qué producto te dio más ganancia neta por hora invertida. Ese es tu ancla. El resto: plan de descontinuación elegante.' },
        dias_90: { objetivo: 'Equipo y operación rediseñados al servicio de UNA oferta clara.', una_accion_quirurgica: 'Conversación honesta con cada persona del equipo: quién encaja en el modelo nuevo, quién no. Los que no encajan, se van con dignidad e indemnización justa.' }
      },
      cita_final_rodrigo: 'No se trata de hacer más. Se trata de tener claridad de qué funciona y eliminar todo lo demás. Hacer menos, menos pero mejor.',
      cta_personalizado: {
        tipo: 'call_estrategia',
        razon: 'El cuello de botella no es información — es ejecución guiada.',
        copy_sugerido: `${firstName}, lo que te toca no es otro curso. Es una conversación con alguien que ya guió a 17 founders a salir de exactamente donde estás. 45 minutos, sin compromiso, y sales con un plan claro o no sales con nada.`
      }
    };
  }

  /* ============== START / RESUME ============== */
  function startQuiz() {
    state.cursor = 0; state.answers = {};
    state.timings = { startedAt: null, shownAt: {}, perQuestion: {} };
    saveState();
    track('quiz_started');
    renderQuestion();
  }

  function tryResume() {
    const saved = loadState();
    if (!saved || !Object.keys(saved.answers || {}).length) return false;
    Object.assign(state, { cursor: saved.cursor, answers: saved.answers, lead: saved.lead || state.lead });
    renderQuestion();
    return true;
  }

  function bind() {
    $('#btnStart').addEventListener('click', () => { track('landing_cta'); startQuiz(); });
    $('#btnBack').addEventListener('click', back);
    $('#captureForm').addEventListener('submit', onSubmit);
  }

  async function boot() {
    try {
      await loadConfig();
      bind();
      const params = new URLSearchParams(location.search);
      if (params.get('reset') === '1') { clearState(); show('landing'); return; }
      if (!tryResume()) show('landing');
    } catch (err) {
      console.error('Boot error:', err);
      $('#errorMsg').textContent = 'No se pudo cargar el diagnóstico. Recarga la página.';
      show('error');
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
