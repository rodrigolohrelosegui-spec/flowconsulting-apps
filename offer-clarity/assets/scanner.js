/* ==========================================================================
   Offer Clarity Scanner · scanner.js
   SPA vanilla · sin dependencias
   ========================================================================== */

(function () {
  'use strict';

  /* --------- Config --------- */
  const CFG = {
    WEBHOOK: 'https://n8n-flowjorge-u59154.vm.elestio.app/webhook/offer-clarity',
    URL_DISCOVERY: 'https://api.leadconnectorhq.com/widget/bookings/flowconsulting/discovery',
    QUESTIONS_PATH: './assets/questions.json',
    STORAGE_KEY: 'fc_offer_clarity_state_v1',
    REQUEST_TIMEOUT_MS: 120000
  };

  /* --------- State --------- */
  const state = {
    config: null,
    queue: [],
    cursor: 0,
    answers: {},
    lead: { name: '', email: '', business_context: '' },
    timings: { quizStartedAt: null, questionShownAt: {} }
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

  /* --------- DOM helpers --------- */
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
        cursor: state.cursor, answers: state.answers, lead: state.lead
      }));
    } catch (_) {}
  }
  function loadState() {
    try {
      const raw = sessionStorage.getItem(CFG.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }
  function clearState() {
    try { sessionStorage.removeItem(CFG.STORAGE_KEY); } catch (_) {}
  }

  /* --------- Config load --------- */
  async function loadConfig() {
    const r = await fetch(CFG.QUESTIONS_PATH, { cache: 'no-store' });
    if (!r.ok) throw new Error('No se pudo cargar el cuestionario.');
    state.config = await r.json();
    state.queue = state.config.questions.map(q => q.id);
  }

  /* --------- Init --------- */
  async function init() {
    try {
      await loadConfig();
    } catch (e) {
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

    // Resume if state exists
    const saved = loadState();
    if (saved && saved.cursor !== undefined && Object.keys(saved.answers || {}).length > 0) {
      state.cursor = saved.cursor;
      state.answers = saved.answers;
      state.lead = saved.lead || state.lead;
      // We don't auto-resume — too risky. Just track for analytics.
      track('quiz_resume_available', { cursor: state.cursor });
    }
  }

  function startQuiz() {
    track('quiz_started', {});
    state.timings.quizStartedAt = Date.now();
    state.cursor = 0;
    state.answers = {};
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

    state.timings.questionShownAt[qid] = Date.now();

    const total = state.queue.length;
    $('#progressFill').style.width = `${((state.cursor) / total) * 100}%`;
    $('#progressText').textContent = `Paso ${state.cursor + 1} de ${total}`;
    $('#questionCounter').textContent = `${state.cursor + 1} / ${total}`;
    $('#btnBack').disabled = state.cursor === 0;

    const slot = $('#questionSlot');
    slot.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'question__wrap';

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

    if (q.hint) {
      const hint = document.createElement('p');
      hint.className = 'question__hint';
      hint.textContent = q.hint;
      wrap.appendChild(hint);
    }

    if (q.type === 'textarea') {
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
      btnWrap.style.marginTop = '20px';
      const btn = document.createElement('button');
      btn.className = 'btn btn--primary';
      btn.textContent = q.required ? 'Continuar' : 'Continuar (o saltar)';
      btn.addEventListener('click', () => {
        const v = ta.value.trim();
        if (q.required && v.length < (q.min_chars || 1)) {
          alert(`Necesito al menos ${q.min_chars || 1} caracteres para que el análisis sea útil.`);
          ta.focus();
          return;
        }
        state.answers[q.id] = v;
        saveState();
        track('answer_recorded', { qid: q.id, length: v.length });
        state.cursor++;
        if (state.cursor >= state.queue.length) goToCapture();
        else renderCurrentQuestion();
      });
      btnWrap.appendChild(btn);
      wrap.appendChild(btnWrap);

      setTimeout(() => ta.focus(), 100);
    }

    if (q.type === 'single_choice_metadata' || q.type === 'single_choice') {
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
          saveState();
          track('answer_recorded', { qid: q.id, value: opt.value });
          state.cursor++;
          if (state.cursor >= state.queue.length) goToCapture();
          else renderCurrentQuestion();
        });
        choices.appendChild(c);
      });
      wrap.appendChild(choices);
    }

    slot.appendChild(wrap);
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
    $('#progressText').textContent = `Listo · Último paso`;
    show('capture');
    setTimeout(() => $('#fieldName').focus(), 200);
  }

  /* --------- Submit --------- */
  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  async function onSubmit(e) {
    e.preventDefault();
    const name = $('#fieldName').value.trim();
    const email = $('#fieldEmail').value.trim();
    const business_context = ($('#fieldBusiness').value || '').trim().slice(0, 500);

    $('#errName').textContent = '';
    $('#errEmail').textContent = '';

    let ok = true;
    if (name.length < 2) { $('#errName').textContent = 'Tu nombre, por favor.'; ok = false; }
    if (!validateEmail(email)) { $('#errEmail').textContent = 'Revisá el formato del email.'; ok = false; }
    if (!ok) return;

    state.lead = { name, email, business_context };
    saveState();

    $('#btnSubmit').disabled = true;
    $('#btnSubmit').textContent = 'Analizando tu copy…';

    await submitScan(buildPayload());
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
        timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) { return 'America/Mexico_City'; } })()
      }
    };
  }

  async function postWithTimeout(url, payload, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal
      });
      clearTimeout(t);
      return r;
    } catch (e) {
      clearTimeout(t);
      throw e;
    }
  }

  let lastPayload = null;
  async function submitScan(payload) {
    lastPayload = payload;
    track('submit_started', {});
    show('loading');
    runLoaderAnimation();

    try {
      const r = await postWithTimeout(CFG.WEBHOOK, payload, CFG.REQUEST_TIMEOUT_MS);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      try { localStorage.setItem('fc_offer_clarity_last_result', JSON.stringify(data)); } catch (_) {}
      track('submit_success', {});
      stopLoaderAnimation();
      renderResult(data);
      show('result');
      clearState();
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

  /* --------- Loader animation --------- */
  let loaderTimer = null;
  function runLoaderAnimation() {
    const steps = [
      'Leyendo tu bio…',
      'Analizando tu landing…',
      'Cruzando tu oferta con casos análogos…',
      'Detectando la frase que rompe…',
      'Aplicando Trim & Stack…',
      'Calibrando proyección…'
    ];
    let i = 0;
    let pct = 0;

    const fill = $('#progressLinearFill');
    const num = $('#percentNum');
    const stepEl = $('#loaderStep');
    const ticks = $$('.tick');

    function tick() {
      pct = Math.min(pct + 1.5 + Math.random() * 1.5, 95);
      num.textContent = String(Math.floor(pct));
      fill.style.width = pct + '%';

      const targetStep = Math.min(steps.length - 1, Math.floor(pct / (100 / steps.length)));
      if (targetStep !== i) {
        i = targetStep;
        stepEl.textContent = steps[i];
        ticks.forEach((t, idx) => t.classList.toggle('is-active', idx <= i));
      }
    }
    loaderTimer = setInterval(tick, 280);
  }
  function stopLoaderAnimation() {
    if (loaderTimer) clearInterval(loaderTimer);
    loaderTimer = null;
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

    // Diagnóstico ejecutivo
    $('#rDiagnosticoEjecutivo').textContent = data.diagnostico_ejecutivo || '';

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
        <div class="pillar__lectura">${escapeHtml(p.lectura || '')}</div>
      `;
      pillarsEl.appendChild(div);
    });

    // Coherencia
    const coh = (data.scores || {}).coherencia_narrativa || { score: 0, lectura: '' };
    $('#rCoherence').innerHTML = `
      <div class="coherence__name">Coherencia narrativa</div>
      <div class="coherence__score">${coh.score}</div>
      <div class="coherence__lectura">${escapeHtml(coh.lectura || '')}</div>
    `;

    // Weakest pillar
    const w = data.pilar_mas_debil || {};
    $('#rWeakest').innerHTML = `
      <div class="weakest__name">${escapeHtml(w.nombre || '')}</div>
      <div class="weakest__diagnostico">${escapeHtml(w.diagnostico || '')}</div>
    `;

    // Phrase that breaks
    const f = data.frase_que_rompe || {};
    $('#rPhrase').innerHTML = `
      <blockquote class="phrase-break__cita">"${escapeHtml(f.cita || '')}"</blockquote>
      <div class="phrase-break__campo">— ${escapeHtml(f.campo_origen || '')}</div>
      <p class="phrase-break__porque">${escapeHtml(f.por_que_rompe || '')}</p>
      <div class="phrase-break__reescritura">
        <strong>Probá con esta versión</strong>
        ${escapeHtml(f.como_reescribirla || '')}
      </div>
    `;

    // Trim & Stack
    const ts = data.trim_stack_matrix || {};
    const tsEl = $('#rTrimStack');
    tsEl.innerHTML = '';
    const buckets = [
      ['mantener', 'Mantener', 'mantener'],
      ['evaluar', 'Evaluar', 'evaluar'],
      ['eliminar', 'Eliminar', 'eliminar']
    ];
    buckets.forEach(([k, title, cls]) => {
      const items = ts[k] || [];
      const b = document.createElement('div');
      b.className = `ts-bucket ts-bucket--${cls}`;
      b.innerHTML = `<div class="ts-bucket__title">${title}</div>` +
        (items.length === 0
          ? '<div class="ts-item"><div class="ts-item__razon" style="font-style:italic;color:rgba(255,255,255,0.45)">Nada en esta categoría.</div></div>'
          : items.map(it => `
            <div class="ts-item">
              <div class="ts-item__componente">${escapeHtml(it.componente || '')}</div>
              <div class="ts-item__razon">${escapeHtml(it.razon || '')}</div>
            </div>
          `).join(''));
      tsEl.appendChild(b);
    });

    // Big Domino
    const bd = data.big_domino || {};
    $('#rBigDomino').innerHTML = `
      <div class="big-domino__palanca">${escapeHtml(bd.palanca || '')}</div>
      <p class="big-domino__porque">${escapeHtml(bd.por_que || '')}</p>
      <div class="big-domino__visualizacion">
        <strong>En 30 días</strong>
        ${escapeHtml(bd.como_se_ve_en_30_dias || '')}
      </div>
    `;

    // Venta del método (por qué FC es diferente)
    const vm = data.venta_del_metodo || {};
    if (vm.vehiculo_roto_personalizado || vm.por_que_fc_es_diferente) {
      $('#rMetodo').innerHTML = `
        <p class="metodo__vehiculo">${escapeHtml(vm.vehiculo_roto_personalizado || '')}</p>
        <div class="metodo__diferencia">
          <strong>Cómo lo hacemos diferente acá</strong>
          ${escapeHtml(vm.por_que_fc_es_diferente || '')}
        </div>
      `;
    } else {
      // Hide bloque if missing
      const block = document.querySelector('#rMetodo')?.closest('.result__block');
      if (block) block.style.display = 'none';
    }

    // Cliente análogo
    const c = data.cliente_analogo || {};
    $('#rCaseStudy').innerHTML = `
      <div class="case-study__nombre">${escapeHtml(c.nombre || '')}</div>
      <div class="case-study__snapshot">${escapeHtml(c.snapshot || '')}</div>
      <div class="case-study__resultado">${escapeHtml(c.resultado || '')}</div>
      <blockquote class="case-study__cita">"${escapeHtml(c.cita || '')}"</blockquote>
      <p class="case-study__porque">${escapeHtml(c.por_que_se_parece_a_ti || '')}</p>
      ${c.url_video ? `<a class="case-study__video" href="${c.url_video}" target="_blank" rel="noopener">▶ Ver testimonio en YouTube</a>` : ''}
    `;

    // Forbidden truth
    $('#rForbiddenTruth').textContent = data.forbidden_truth || '';

    // Projection
    const p = data.proyeccion || {};
    $('#rProjection').innerHTML = `
      <div class="proj-card proj-card--base">
        <div class="proj-card__title">Si nada cambia</div>
        <div class="proj-card__text">${escapeHtml(p.escenario_base || '')}</div>
      </div>
      <div class="proj-card proj-card--alineado">
        <div class="proj-card__title">Si arreglás el pilar</div>
        <div class="proj-card__text">${escapeHtml(p.escenario_alineado || '')}</div>
      </div>
      <div class="proj-lift">${escapeHtml(p.rango_lift || '')}</div>
    `;

    // Cita Rodrigo
    $('#rRodrigoQuote').textContent = data.cita_rodrigo ? `"${data.cita_rodrigo}"` : '';

    // CTA
    const cta = data.cta_personalizado || {};
    $('#rCtaHeadline').textContent = cta.headline || 'Agenda tu llamada de diagnóstico';
    $('#rCtaRazon').textContent = cta.razon_para_actuar_ahora || 'Tu scan termina de ser relevante en los próximos 7 días. Lo que hagas con esta data esta semana determina si los próximos 30 son iguales o diferentes.';
    $('#rCtaQuePasa').innerHTML = `
      <strong>Qué pasa en la llamada</strong>
      ${escapeHtml(cta.que_pasa_en_la_call || '')}
    `;
    $('#btnBookCall').href = CFG.URL_DISCOVERY;

    track('result_rendered', {
      coherencia: coh.score,
      pilar_mas_debil: w.id,
      arquetipo_caso: c.nombre
    });
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  /* --------- Boot --------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
