/* ==========================================================================
   Offer Clarity Scanner v2 · scanner.js
   - SPA vanilla, sin dependencias
   - Soporta textarea, single_choice, multi_choice, skip por pregunta
   - Loader garantiza 90s mínimo de animación
   ========================================================================== */

(function () {
  'use strict';

  /* --------- Config --------- */
  const CFG = {
    WEBHOOK: 'https://n8n-flowjorge-u59154.vm.elestio.app/webhook/offer-clarity',
    URL_DISCOVERY: 'https://api.leadconnectorhq.com/widget/bookings/flowconsulting/discovery',
    QUESTIONS_PATH: './assets/questions.json',
    STORAGE_KEY: 'fc_offer_clarity_state_v2',
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

    const counter = document.createElement('div');
    counter.className = 'question__counter';
    const updateCounter = () => {
      const len = ta.value.length;
      counter.textContent = `${len} / ${q.max_chars || 2000}`;
      counter.classList.toggle('is-warning', q.required && len > 0 && len < (q.min_chars || 0));
      counter.classList.toggle('is-error', len > (q.max_chars || 2000) - 50);
    };
    ta.addEventListener('input', updateCounter);
    updateCounter();

    wrap.appendChild(ta);
    wrap.appendChild(counter);

    const btnWrap = document.createElement('div');
    btnWrap.className = 'question__actions';
    const btn = document.createElement('button');
    btn.className = 'btn btn--primary';
    btn.textContent = 'Continuar';
    btn.addEventListener('click', () => {
      const v = ta.value.trim();
      if (q.required && v.length < (q.min_chars || 1)) {
        ta.focus();
        ta.classList.add('is-invalid');
        setTimeout(() => ta.classList.remove('is-invalid'), 2000);
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
    $('#btnSubmit').textContent = 'Analizando tu copy';
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
    state.apiResolvedAt = null;
    state.apiResult = null;
    runLoaderAnimation();

    try {
      const r = await postWithTimeout(CFG.WEBHOOK, payload, CFG.REQUEST_TIMEOUT_MS);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      state.apiResolvedAt = Date.now();
      state.apiResult = data;
      try { localStorage.setItem('fc_offer_clarity_last_result', JSON.stringify(data)); } catch (_) {}
      track('submit_success', {});

      // Garantizar mínimo de loader
      const elapsed = Date.now() - state.loaderStartedAt;
      const wait = Math.max(0, CFG.LOADER_MIN_MS - elapsed);
      setTimeout(() => {
        stopLoaderAnimation();
        renderResult(data);
        show('result');
        clearState();
      }, wait);
    } catch (e) {
      console.error(e);
      try { localStorage.setItem('fc_offer_clarity_failed_payload', JSON.stringify(payload)); } catch (_) {}
      track('submit_error', { msg: String(e && e.message) });
      stopLoaderAnimation();
      $('#errorMsg').textContent = 'No pudimos procesar tu scan. Reintentá en un momento.';
      show('error');
      $('#btnSubmit').disabled = false;
      $('#btnSubmit').textContent = 'Ver mi scan';
    }
  }

  async function retrySubmit() {
    if (!lastPayload) {
      try { lastPayload = JSON.parse(localStorage.getItem('fc_offer_clarity_failed_payload') || 'null'); } catch (_) {}
    }
    if (!lastPayload) { show('landing'); return; }
    await submitScan(lastPayload);
  }

  /* --------- Loader animation (90s minimum) --------- */
  let loaderTimer = null;
  let loaderRAF = null;
  function runLoaderAnimation() {
    const steps = [
      'Leyendo tu bio',
      'Analizando tu landing',
      'Cruzando tu oferta con casos análogos',
      'Detectando la frase que rompe',
      'Aplicando Trim and Stack',
      'Calibrando proyección a 6 meses',
      'Eligiendo el caso de cliente similar',
      'Calibrando la verdad incómoda',
      'Afinando el Big Domino',
      'Cerrando el reporte'
    ];
    let i = 0;
    let pct = 0;

    const fill = $('#progressLinearFill');
    const num = $('#percentNum');
    const stepEl = $('#loaderStep');
    const ticks = $$('.tick');

    function tick() {
      const elapsed = Date.now() - state.loaderStartedAt;
      const target = Math.min(95, (elapsed / CFG.LOADER_MIN_MS) * 100);

      pct = Math.min(target, pct + 0.3 + Math.random() * 0.5);
      pct = Math.min(95, pct);

      num.textContent = String(Math.floor(pct));
      fill.style.width = pct + '%';

      const targetStep = Math.min(steps.length - 1, Math.floor(pct / (100 / steps.length)));
      if (targetStep !== i) {
        i = targetStep;
        stepEl.textContent = steps[i];
        ticks.forEach((t, idx) => t.classList.toggle('is-active', idx <= Math.min(idx, Math.floor(targetStep / (steps.length / ticks.length)))));
      }

      // Particle pulse / dots breathe
      const dots = $('#dotsCanvas');
      if (dots) {
        const phase = Math.sin(elapsed / 400) * 0.5 + 0.5;
        dots.style.opacity = String(0.4 + phase * 0.4);
      }
    }
    loaderTimer = setInterval(tick, 200);
  }
  function stopLoaderAnimation() {
    if (loaderTimer) clearInterval(loaderTimer);
    loaderTimer = null;
    if (loaderRAF) cancelAnimationFrame(loaderRAF);
    const fill = $('#progressLinearFill');
    const num = $('#percentNum');
    if (fill) fill.style.width = '100%';
    if (num) num.textContent = '100';
  }

  /* --------- Result rendering --------- */
  function scoreClass(s) {
    if (s >= 75) return 'score-high';
    if (s >= 50) return 'score-mid';
    return 'score-low';
  }

  function renderResult(data) {
    if (!data || typeof data !== 'object') {
      $('#errorMsg').textContent = 'La respuesta no llegó completa. Reintentá.';
      show('error');
      return;
    }

    $('#rDiagnosticoEjecutivo').innerHTML = textToParagraphs(data.diagnostico_ejecutivo || '');

    // Pillars
    const pillarsEl = $('#rPillars');
    pillarsEl.innerHTML = '';
    const pillarOrder = [
      ['claridad_de_promesa', 'Claridad de promesa'],
      ['mecanismo_unico', 'Mecanismo único'],
      ['vehiculo_roto', 'Vehículo roto'],
      ['prueba_especifica', 'Prueba específica']
    ];
    pillarOrder.forEach(([id, name]) => {
      const p = (data.scores || {})[id] || { score: 0, lectura: '' };
      const cls = scoreClass(p.score);
      const div = document.createElement('div');
      div.className = 'pillar';
      div.innerHTML = `
        <div class="pillar__name">${name}</div>
        <div class="pillar__score ${cls}">${p.score}</div>
        <div class="pillar__bar"><div class="pillar__bar-fill ${cls}" style="width:${p.score}%"></div></div>
        <div class="pillar__lectura">${textToParagraphs(p.lectura || '')}</div>
      `;
      pillarsEl.appendChild(div);
    });

    const coh = (data.scores || {}).coherencia_narrativa || { score: 0, lectura: '' };
    $('#rCoherence').innerHTML = `
      <div class="coherence__name">Coherencia narrativa</div>
      <div class="coherence__score">${coh.score}</div>
      <div class="coherence__lectura">${textToParagraphs(coh.lectura || '')}</div>
    `;

    const w = data.pilar_mas_debil || {};
    $('#rWeakest').innerHTML = `
      <div class="weakest__name">${escapeHtml(w.nombre || '')}</div>
      <div class="weakest__diagnostico">${textToParagraphs(w.diagnostico || '')}</div>
    `;

    const f = data.frase_que_rompe || {};
    $('#rPhrase').innerHTML = `
      <blockquote class="phrase-break__cita">${escapeHtml(f.cita || '')}</blockquote>
      <div class="phrase-break__campo">${escapeHtml(f.campo_origen || '')}</div>
      <div class="phrase-break__porque">${textToParagraphs(f.por_que_rompe || '')}</div>
      <div class="phrase-break__reescritura">
        <strong>Probá con esta versión</strong>
        <div>${escapeHtml(f.como_reescribirla || '')}</div>
      </div>
    `;

    // Trim & Stack
    const ts = data.trim_stack_matrix || {};
    const tsEl = $('#rTrimStack');
    tsEl.innerHTML = '';
    const buckets = [['mantener', 'Mantener', 'mantener'], ['evaluar', 'Evaluar', 'evaluar'], ['eliminar', 'Eliminar', 'eliminar']];
    buckets.forEach(([k, title, cls]) => {
      const items = ts[k] || [];
      const b = document.createElement('div');
      b.className = `ts-bucket ts-bucket--${cls}`;
      b.innerHTML = `<div class="ts-bucket__title">${title}</div>` +
        (items.length === 0
          ? '<div class="ts-item"><div class="ts-item__razon">Nada en esta categoría.</div></div>'
          : items.map(it => `
            <div class="ts-item">
              <div class="ts-item__componente">${escapeHtml(it.componente || '')}</div>
              <div class="ts-item__razon">${escapeHtml(it.razon || '')}</div>
            </div>
          `).join(''));
      tsEl.appendChild(b);
    });

    // Venta del método
    const vm = data.venta_del_metodo || {};
    if (vm.vehiculo_roto_personalizado || vm.por_que_fc_es_diferente) {
      $('#rMetodo').innerHTML = `
        <div class="metodo__vehiculo">${textToParagraphs(vm.vehiculo_roto_personalizado || '')}</div>
        <div class="metodo__diferencia">
          <strong>Cómo lo hacemos diferente acá</strong>
          <div>${textToParagraphs(vm.por_que_fc_es_diferente || '')}</div>
        </div>
      `;
    } else {
      const block = $('#rMetodo')?.closest('.result__block');
      if (block) block.style.display = 'none';
    }

    const bd = data.big_domino || {};
    $('#rBigDomino').innerHTML = `
      <div class="big-domino__palanca">${escapeHtml(bd.palanca || '')}</div>
      <div class="big-domino__porque">${textToParagraphs(bd.por_que || '')}</div>
      <div class="big-domino__visualizacion">
        <strong>En 30 días</strong>
        <div>${textToParagraphs(bd.como_se_ve_en_30_dias || '')}</div>
      </div>
    `;

    const c = data.cliente_analogo || {};
    $('#rCaseStudy').innerHTML = `
      <div class="case-study__nombre">${escapeHtml(c.nombre || '')}</div>
      <div class="case-study__snapshot">${escapeHtml(c.snapshot || '')}</div>
      <div class="case-study__resultado">${escapeHtml(c.resultado || '')}</div>
      <blockquote class="case-study__cita">${escapeHtml(c.cita || '')}</blockquote>
      <div class="case-study__porque">${textToParagraphs(c.por_que_se_parece_a_ti || '')}</div>
      ${c.url_video ? `<a class="case-study__video" href="${escapeAttr(c.url_video)}" target="_blank" rel="noopener">Ver testimonio en YouTube</a>` : ''}
    `;

    $('#rForbiddenTruth').innerHTML = textToParagraphs(data.forbidden_truth || '');

    const pj = data.proyeccion || {};
    $('#rProjection').innerHTML = `
      <div class="proj-card proj-card--base">
        <div class="proj-card__title">Si nada cambia</div>
        <div class="proj-card__text">${textToParagraphs(pj.escenario_base || '')}</div>
      </div>
      <div class="proj-card proj-card--alineado">
        <div class="proj-card__title">Si arreglás el pilar</div>
        <div class="proj-card__text">${textToParagraphs(pj.escenario_alineado || '')}</div>
      </div>
      <div class="proj-lift">${escapeHtml(pj.rango_lift || '')}</div>
    `;

    $('#rRodrigoQuote').textContent = data.cita_rodrigo ? `${data.cita_rodrigo}` : '';

    const cta = data.cta_personalizado || {};
    $('#rCtaHeadline').textContent = cta.headline || 'Agendá tu llamada de diagnóstico';
    $('#rCtaRazon').innerHTML = textToParagraphs(cta.razon_para_actuar_ahora || 'Tu scan termina de ser relevante en los próximos 7 días. Lo que hagas esta semana determina si los próximos 30 son iguales o diferentes.');
    $('#rCtaQuePasa').innerHTML = `
      <strong>Qué pasa en la llamada</strong>
      <div>${textToParagraphs(cta.que_pasa_en_la_call || '')}</div>
    `;
    $('#btnBookCall').href = CFG.URL_DISCOVERY;

    track('result_rendered', {
      coherencia: coh.score,
      pilar_mas_debil: w.id,
      arquetipo_caso: c.nombre
    });
  }

  function textToParagraphs(s) {
    if (!s) return '';
    // Split by double newlines (paragraphs) and single newlines (line breaks)
    return String(s).split(/\n\n+/).map(p =>
      `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`
    ).join('');
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
