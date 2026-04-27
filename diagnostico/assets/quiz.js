/* ============================================================
   Diagnóstico Infinite Flow · Flow Consulting · quiz.js
   SPA vanilla, sin dependencias.
   ============================================================ */
(function () {
  'use strict';

  const CFG = {
    WEBHOOK_URL: 'https://n8n-flowjorge-u59154.vm.elestio.app/webhook/diagnostico-flow',
    USE_LOCAL_FALLBACK: false,
    URL_BOOKING: 'https://www.flowconsulting.co',
    QUESTIONS_PATH: './assets/questions.json',
    STORAGE_KEY: 'fc_diag_state_v1',
    REQUEST_TIMEOUT_MS: 120000
  };

  const state = {
    config: null,
    cursor: 0,
    answers: {},
    lead: { name: '', email: '', whatsapp: '', business_context: '' },
    timings: { startedAt: null, shownAt: {}, perQuestion: {} }
  };

  /* DOM helpers */
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const show = (name) => {
    $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view === name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    state.answers[qid] = opt.value;
    const shown = state.timings.shownAt[qid];
    if (shown) state.timings.perQuestion[qid] = Math.round((Date.now() - shown) / 1000);

    track('question_answered', { id: qid, value: opt.value, time_sec: state.timings.perQuestion[qid] || 0 });
    saveState();

    $$('.option').forEach(b => {
      const sel = b.dataset.value === opt.value;
      b.classList.toggle('is-selected', sel);
      b.setAttribute('aria-checked', sel ? 'true' : 'false');
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
      track('submit_success', { arquetipo: result.arquetipo?.id, fase: result.fase_infinite_flow?.paso_actual });

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
    const c = Math.max(0, Math.min(100, Math.round(p)));
    if ($('#percentNum')) $('#percentNum').textContent = c;
    if ($('#progressLinearFill')) $('#progressLinearFill').style.width = c + '%';
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

  // ========= Main entry: run the cinematic loader, returns the API result =========
  // Plays scenes 1..5 (~10s each = 50s baseline). Scene 6 awaits the API result.
  // Total min: ~55s. If the API is slow, scene 6 keeps spinning items until result arrives.
  async function runCinematicLoader(payload, apiPromise) {
    const lead = payload.lead || {};
    const firstName = (lead.name || '').trim().split(' ')[0] || 'tú';
    const patterns = computePatterns(payload.answers || {});
    let apiDone = false, apiResult = null, apiError = null;

    apiPromise.then(r => { apiResult = r; apiDone = true; })
              .catch(e => { apiError = e; apiDone = true; });

    setPercent(0);
    await sleep(120);

    // ----- Scene 1: CLI Ingesta -----
    activateScene(0);
    await tweenPercent(0, 16, 9500);
    await playScene1(payload, firstName);

    // ----- Scene 2: Patterns -----
    transitionTo(1);
    await tweenPercent(16, 33, 10000);
    await playScene2(patterns);

    // ----- Scene 3: Cases comparison -----
    transitionTo(2);
    await tweenPercent(33, 50, 9500);
    await playScene3();

    // ----- Scene 4: Lever -----
    transitionTo(3);
    await tweenPercent(50, 67, 9500);
    await playScene4();

    // ----- Scene 5: Writing -----
    transitionTo(4);
    await tweenPercent(67, 84, 9500);
    await playScene5(firstName);

    // ----- Scene 6: Verification + spoiler -----
    transitionTo(5);
    await tweenPercent(84, 95, 4000);
    await playScene6(apiPromise);

    setPercent(100);

    if (apiError) throw apiError;
    return apiResult;
  }

  function transitionTo(idx) {
    const all = sceneEls();
    all.forEach((el, i) => {
      if (el.classList.contains('is-active')) el.classList.add('is-leaving');
    });
    setTimeout(() => activateScene(idx), 230);
  }

  // ========= Scene 1: CLI ingesta =========
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
      { html: `<span class="prompt">&gt;</span> Conectando con el sistema de análisis...` }
    ];
    for (const line of lines) {
      const el = document.createElement('div');
      el.className = 'cli__line';
      el.innerHTML = line.html;
      cliBody.appendChild(el);
      // Stream char-by-char effect: hide and reveal
      await sleep(80);
      // give a small variable pause between lines
      await sleep(900 + Math.random() * 600);
    }
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

    // Eval one by one (~1.05s each = ~9.5s total for 9)
    for (let i = 0; i < patterns.length; i++) {
      const p = patterns[i];
      const chip = chips[i];
      chip.classList.add('is-checking');
      caption.textContent = p.match
        ? `Probando: ${p.label}…`
        : `Probando: ${p.label}…`;
      await sleep(550);
      chip.classList.remove('is-checking');
      chip.classList.add(p.match ? 'is-match' : 'is-skip');
      if (p.match) {
        matchCount++;
        counter.textContent = matchCount;
        caption.textContent = `Patrón detectado: ${p.label}`;
      } else {
        caption.textContent = `${p.label} — sin riesgo en tu caso`;
      }
      await sleep(450);
    }
    caption.textContent = `${matchCount} patrones detectados en tu caso.`;
    await sleep(500);
  }

  // ========= Scene 3: Cases comparison =========
  async function playScene3() {
    const grid = $('#casesGrid');
    const caption = $('#casesCaption');
    const score = $('#casesScore');
    if (!grid) return;
    grid.innerHTML = '';

    // 17 real cases (from system prompt's archetypes + canonical case studies)
    const cases = [
      { i:'M', sub:'Mary' }, { i:'J', sub:'Julio' }, { i:'O', sub:'Omar' },
      { i:'D', sub:'Daniel' }, { i:'M', sub:'Maryell' }, { i:'A', sub:'Andrés' },
      { i:'E', sub:'Erika' }, { i:'J', sub:'Joao' }, { i:'I', sub:'Inés' },
      { i:'L', sub:'Lupita' }, { i:'M', sub:'Mónica' }, { i:'E', sub:'Erick' },
      { i:'R', sub:'Regina' }, { i:'C', sub:'Carlos' }, { i:'P', sub:'Paula' },
      { i:'R', sub:'Rocío' }, { i:'F', sub:'Fernanda' }
    ];
    const winnerIdx = Math.floor(cases.length * 0.30); // about case 5 (Maryell-ish)

    // Add scan line
    const scan = document.createElement('div');
    scan.className = 'cases-scan';
    grid.appendChild(scan);

    // Render cards in stagger
    cases.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'case-card';
      card.innerHTML = `<div>${c.i}</div><div class="case-card__sub">${escapeHtml(c.sub)}</div>`;
      grid.appendChild(card);
      setTimeout(() => card.classList.add('is-revealed'), 60 * i);
    });
    await sleep(60 * cases.length + 200);

    // Run scan
    caption.textContent = 'Cruzando con casos en cartera…';
    scan.classList.add('is-running');
    await sleep(1700);
    scan.classList.remove('is-running');

    // Highlight winner
    caption.textContent = 'Buscando el caso más parecido al tuyo…';
    await sleep(800);
    const winnerCard = grid.querySelectorAll('.case-card')[winnerIdx];
    if (winnerCard) winnerCard.classList.add('is-winner');
    caption.textContent = `Mayor coincidencia con tu caso: ${cases[winnerIdx].sub}`;

    // Animate score counter 0 → 89
    const to = 89;
    let val = 0;
    const dur = 2200;
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
    await sleep(600);
  }

  // ========= Scene 4: Lever network =========
  async function playScene4() {
    const canvas = $('#leverCanvas');
    const caption = $('#leverCaption');
    const counter = $('#leverCount');
    const redacted = canvas?.querySelector('.lever-redacted') || (() => {
      const r = document.createElement('div');
      r.className = 'lever-redacted';
      r.textContent = 'Tu palanca #1: ████████████';
      canvas.appendChild(r);
      return r;
    })();
    if (!canvas) return;

    // Clear previous nodes
    canvas.querySelectorAll('.lnode').forEach(n => n.remove());
    redacted.classList.remove('is-visible');

    // Spawn 47 nodes
    const N = 47;
    const nodes = [];
    for (let i = 0; i < N; i++) {
      const n = document.createElement('div');
      n.className = 'lnode';
      n.style.left = (5 + Math.random() * 90) + '%';
      n.style.top = (10 + Math.random() * 80) + '%';
      n.style.opacity = 0.3 + Math.random() * 0.4;
      canvas.appendChild(n);
      nodes.push(n);
    }
    counter.textContent = N;
    caption.textContent = 'Evaluando 47 posibles cambios en tu negocio…';
    await sleep(1300);

    // Filter waves: 47 → 12 → 5 → 3 → 1
    const waves = [12, 5, 3, 1];
    const waveCaptions = [
      'Filtrando por ratio impacto / esfuerzo…',
      'Eliminando los que no componen con el resto…',
      'Aislando los de mayor efecto compuesto…',
      'Encontrando el que más mueve el resultado…'
    ];
    let remaining = nodes.slice();
    for (let w = 0; w < waves.length; w++) {
      const target = waves[w];
      caption.textContent = waveCaptions[w];
      // Fade out random nodes until target count
      while (remaining.length > target) {
        const idx = Math.floor(Math.random() * remaining.length);
        remaining[idx].classList.add('is-faded');
        remaining.splice(idx, 1);
        await sleep(40);
      }
      counter.textContent = target;
      await sleep(700);
    }

    // Highlight final node
    if (remaining[0]) {
      remaining[0].classList.add('is-final');
      remaining[0].style.left = '50%';
      remaining[0].style.top = '50%';
      remaining[0].style.transform = 'translate(-50%,-50%)';
    }
    redacted.classList.add('is-visible');
    caption.textContent = 'Tu palanca #1 identificada.';
    await sleep(1100);
  }

  // ========= Scene 5: Document writing =========
  async function playScene5(firstName) {
    const docBody = $('#docBody');
    if (!docBody) return;
    const fragments = [
      `${firstName}, basado en tus 12 respuestas, lo primero que veo es un patrón claro…`,
      `Calibrando el tono al perfil específico de tu negocio…`,
      `Verificando que cada recomendación sea aplicable a tu caso real…`,
      `Asegurando que cada palabra te sirva, ${firstName}.`
    ];
    docBody.innerHTML = '';
    for (let i = 0; i < fragments.length; i++) {
      const el = document.createElement('div');
      docBody.appendChild(el);
      await typewriter(el, fragments[i], 28, { cursorClass: 'doc__cursor' });
      await sleep(400);
      // Fade and clear before next
      el.style.transition = 'opacity .35s';
      el.style.opacity = '0.25';
      await sleep(280);
      docBody.innerHTML = '';
    }
  }

  // ========= Scene 6: Verification + spoiler =========
  async function playScene6(apiPromise) {
    const list = $('#checklist');
    const spoiler = $('#spoiler');
    const cta = $('#sceneCta');
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

    // Animate items: spinner → done, one by one. Slow down if API hasn't returned yet.
    let result = null, done = false;
    apiPromise.then(r => { result = r; done = true; }).catch(() => { done = true; });

    for (let i = 0; i < liEls.length; i++) {
      const li = liEls[i];
      li.classList.add('is-running');
      // Spinner duration depends on whether we need to stretch
      const baseMs = 900;
      const stretchMs = !done && i === liEls.length - 1 ? 2400 : baseMs;
      await sleep(stretchMs);
      li.classList.remove('is-running');
      li.classList.add('is-done');
      li.querySelector('.cli-item__icon').textContent = '✓';
    }

    // Wait for result if not done yet (loop a final "polishing" item)
    while (!done) {
      // Add a soft loop: pulse the last item
      const last = liEls[liEls.length - 1];
      last.classList.add('is-running');
      last.querySelector('.cli-item__icon').textContent = '⠋';
      await sleep(900);
      last.classList.remove('is-running');
      last.querySelector('.cli-item__icon').textContent = '✓';
      await sleep(400);
    }

    // Spoiler reveal
    if (result && result.arquetipo && result.arquetipo.nombre) {
      $('#spoilerArchetype').textContent = result.arquetipo.nombre;
      spoiler.hidden = false;
    }
    cta.hidden = false;

    // CTA wires up to render the result
    return new Promise(resolve => {
      const btn = $('#btnSeeReport');
      if (!btn) return resolve();
      const onClick = () => {
        btn.removeEventListener('click', onClick);
        const r = window.__pendingResult || result;
        if (r) {
          renderResult(r);
          clearState();
        }
        resolve();
      };
      btn.addEventListener('click', onClick);
    });
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
    const fase = result.fase_infinite_flow || {};
    const scores = result.scores || {};

    $('#rArchetype').textContent = arq.nombre || 'Tu diagnóstico';
    $('#rPhase').textContent = `${fase.nombre_paso ? `Paso ${fase.paso_actual} · ${fase.nombre_paso}` : ''}`;
    $('#rLectura').textContent = result.diagnostico_ejecutivo || '';

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

    // Phase viz
    markPhaseBar(fase.paso_actual);
    $('#rPhaseExplainer').textContent = fase.por_que_aqui || '';

    // Patrones (numbered editorial list)
    const pp = $('#rPatrones');
    pp.innerHTML = '';
    (result.patrones_activos || []).forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'pattern';
      const num = String(i + 1).padStart(2, '0');
      div.innerHTML = `
        <div class="pattern__index">${num}</div>
        <div>
          <div class="pattern__name">${escapeHtml((p.nombre || '').replace(/_/g,' '))}</div>
          <p class="pattern__diag">${fmtBold(p.diagnostico || '')}</p>
        </div>
      `;
      pp.appendChild(div);
    });
    $('#rPatronesBlock').style.display = (result.patrones_activos && result.patrones_activos.length) ? '' : 'none';

    // Puntos ciegos
    const bs = $('#rBlindSpots');
    if (bs) {
      bs.innerHTML = '';
      (result.puntos_ciegos || []).forEach((b, i) => {
        const div = document.createElement('div');
        div.className = 'blind-spot';
        div.innerHTML = `
          <div class="blind-spot__num">${String(i+1).padStart(2,'0')}</div>
          <div>
            <div class="blind-spot__punto">${escapeHtml(b.punto || '')}</div>
            <div class="blind-spot__cons">${escapeHtml(b.consecuencia || '')}</div>
          </div>
        `;
        bs.appendChild(div);
      });
      const blockEl = $('#rBlindSpotsBlock');
      if (blockEl) blockEl.style.display = (result.puntos_ciegos && result.puntos_ciegos.length) ? '' : 'none';
    }

    // Big domino
    const bd = result.big_domino || {};
    $('#rBigDominoLever').textContent = bd.palanca || '';
    $('#rBigDominoWhy').textContent = bd.por_que || '';

    // Forbidden truth
    $('#rForbidden').textContent = result.forbidden_truth || '';

    // Plan 30/60/90
    const plan = result.plan_30_60_90 || {};
    const planEl = $('#rPlan');
    planEl.innerHTML = '';
    [['30','dias_30'],['60','dias_60'],['90','dias_90']].forEach(([n, k]) => {
      const p = plan[k] || {};
      const div = document.createElement('div');
      div.className = 'plan__step';
      div.innerHTML = `
        <div class="plan__step-num">${n}</div>
        <div class="plan__step-obj">${escapeHtml(p.objetivo || '')}</div>
        <p class="plan__step-action">${escapeHtml(p.una_accion_quirurgica || '')}</p>
      `;
      planEl.appendChild(div);
    });

    // Costo
    const ci = result.costo_de_inaccion || {};
    if ($('#rVentana') && ci.ventana_critica_meses) {
      $('#rVentana').innerHTML = `Tienes <strong>${ci.ventana_critica_meses} meses</strong> antes de que el costo de no moverte se vuelva irreversible.`;
    }
    $('#rCosto').textContent = ci.narrativa || '';

    // Cita Rodrigo (sin comillas dobles, ya las maneja el CSS via :before)
    $('#rQuote').textContent = result.cita_final_rodrigo || '';

    // CTA final
    const cta = result.cta_personalizado || {};
    if (cta.copy_sugerido) $('#ctaFinalText').textContent = cta.copy_sugerido;
    $('#ctaFinalBtn').href = CFG.URL_BOOKING;

    track('result_viewed', { arquetipo: arq.id, fase: fase.paso_actual });

    show('result');
  }

  function markPhaseBar(currentStep) {
    if (!currentStep) currentStep = 1;
    const phases = $$('.phase');
    const lines  = $$('.phase__line');
    phases.forEach((p, i) => {
      const idx = i + 1;
      p.classList.toggle('is-done', idx < currentStep);
      p.classList.toggle('is-current', idx === currentStep);
      p.classList.toggle('is-pending', idx > currentStep);
    });
    lines.forEach((l, i) => l.classList.toggle('is-done', i + 1 < currentStep));
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
