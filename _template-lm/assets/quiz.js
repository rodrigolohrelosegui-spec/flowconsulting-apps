/* ==========================================================================
   {{LM_NAME}} · quiz.js
   SPA vanilla · sin dependencias

   ⚠️  TEMPLATE — fork de /diagnostico/. Antes de usar en un nuevo LM:
   1) Cambia TODOS los placeholders {{...}}
   2) Adapta renderResult() al output del LM
   3) Lee README.md y CHECKLIST.md en este folder
   ========================================================================== */

(function () {
  'use strict';

  /* --------- Config: webhook n8n + URLs --- */
  const CFG = {
    // Endpoint del workflow n8n (duplicar 'diagnostico-icp' y cambiar el path)
    WEBHOOK_ICP: 'https://n8n.flowibs.com/webhook/{{LM_SLUG}}',
    // URL del booking de Rodrigo (GHL)
    URL_DISCOVERY: 'https://api.leadconnectorhq.com/widget/bookings/{{RODRIGO_CALL_SLUG}}',
    QUESTIONS_PATH: './assets/questions.json',
    // Único por LM para evitar colisiones de estado
    STORAGE_KEY: 'fc_{{LM_SLUG}}_state_v1',
    REQUEST_TIMEOUT_MS: 45000
  };

  /* --------- Estado global --------- */
  const state = {
    config: null,
    route: null,          // 'dueno' | 'directivo' | 'individual'
    isIndividual: false,  // true si Q1=C (empleado o solopreneur)
    queue: [],            // cola de IDs de preguntas a mostrar
    cursor: 0,
    answers: {},          // { Q1: 'A', Q2: 'B', ... }
    lead: { name: '', email: '' },
    timings: {
      quizStartedAt: null,
      questionShownAt: {},
      timeOnQuestion: {}
    }
  };

  /* --------- Analytics · helper agnóstico (GA4 / Plausible / custom) --------- */
  function track(event, props) {
    try {
      // Evento custom que cualquier script externo puede capturar
      window.dispatchEvent(new CustomEvent('fi-track', { detail: { event, props: props || {} } }));
      // GA4 si está presente
      if (typeof window.gtag === 'function') {
        window.gtag('event', event, props || {});
      }
      // Plausible si está presente
      if (typeof window.plausible === 'function') {
        window.plausible(event, { props: props || {} });
      }
      // dataLayer (Google Tag Manager) si existe
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event, ...props });
      }
    } catch (_) { /* fallar silenciosamente */ }
  }

  /* --------- Utilidades DOM --------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const show = (name) => {
    $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view === name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* --------- Persistencia sessionStorage --------- */
  function saveState() {
    try {
      sessionStorage.setItem(CFG.STORAGE_KEY, JSON.stringify({
        route: state.route,
        isIndividual: state.isIndividual,
        queue: state.queue,
        cursor: state.cursor,
        answers: state.answers,
        lead: state.lead
      }));
    } catch (_) { /* storage may be disabled */ }
  }
  function loadState() {
    try {
      const raw = sessionStorage.getItem(CFG.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  }
  function clearState() {
    try { sessionStorage.removeItem(CFG.STORAGE_KEY); } catch (_) { /* noop */ }
  }

  /* --------- Carga del config (questions.json) --------- */
  async function loadConfig() {
    const r = await fetch(CFG.QUESTIONS_PATH, { cache: 'no-store' });
    if (!r.ok) throw new Error('No se pudo cargar el cuestionario.');
    state.config = await r.json();
  }

  /* --------- Construcción de la cola de preguntas --------- */
  function buildQueue() {
    // todas las rutas (dueno / directivo / individual) pasan por las mismas 10 preguntas (v1.1)
    state.queue = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10'];
    state.isIndividual = (state.route === 'individual');
  }

  /* --------- Render de pregunta --------- */
  function getQuestionById(id) {
    return state.config.questions.find(q => q.id === id);
  }

  function getTextForRole(question) {
    // Prioridad: text_{route} → text → text_dueno
    if (state.route === 'individual' && question.text_individual) return question.text_individual;
    if (state.route === 'directivo' && question.text_directivo) return question.text_directivo;
    if (question.text_dueno) return question.text_dueno;
    return question.text || '';
  }

  function getOptionsForRole(question) {
    if (state.route === 'individual' && question.options_individual) return question.options_individual;
    if (state.route === 'directivo' && question.options_directivo) return question.options_directivo;
    if (question.options_dueno) return question.options_dueno;
    return question.options || [];
  }

  function renderQuestion() {
    const id = state.queue[state.cursor];
    const question = getQuestionById(id);
    if (!question) return;

    // marca el momento en que se muestra (para medir tiempo por pregunta)
    state.timings.questionShownAt[id] = Date.now();
    if (!state.timings.quizStartedAt) state.timings.quizStartedAt = Date.now();

    const slot = $('#questionSlot');
    const text = getTextForRole(question);
    const options = getOptionsForRole(question);
    const selected = state.answers[id];

    slot.innerHTML = `
      <h2 class="question__text">${escapeHtml(text)}</h2>
      <div class="options" role="radiogroup" aria-label="${escapeHtml(text)}"></div>
    `;

    const list = $('.options', slot);
    options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option' + (selected === opt.value ? ' is-selected' : '');
      btn.type = 'button';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', selected === opt.value ? 'true' : 'false');
      btn.dataset.value = opt.value;
      const letter = String.fromCharCode(65 + idx); // A, B, C, ...
      btn.innerHTML = `
        <span class="option__bullet" aria-hidden="true">${letter}</span>
        <span class="option__label">${escapeHtml(opt.label)}</span>
      `;
      btn.addEventListener('click', () => selectOption(id, opt));
      list.appendChild(btn);
    });

    // progreso
    updateProgress();
    $('#progressWrap').hidden = false;
    $('#btnBack').disabled = state.cursor === 0;
    $('#questionCounter').textContent = `${state.cursor + 1} / ${state.queue.length}`;
    show('question');
  }

  function updateProgress() {
    const pct = ((state.cursor) / state.queue.length) * 100;
    $('#progressFill').style.width = pct + '%';
    $('#progressText').textContent = `Pregunta ${state.cursor + 1} de ${state.queue.length}`;
  }

  /* --------- Selección de opción → avanza --------- */
  function selectOption(questionId, option) {
    state.answers[questionId] = option.value;

    // mide tiempo sobre la pregunta (en segundos, entero)
    const shownAt = state.timings.questionShownAt[questionId];
    if (shownAt) {
      state.timings.timeOnQuestion[questionId] = Math.round((Date.now() - shownAt) / 1000);
    }

    // Q1 determina la ruta
    if (questionId === 'Q1') {
      state.route = option.route;
      buildQueue();
      track('quiz_route_selected', { route: option.route });
    }

    // Analytics · tracking de cada respuesta
    track('question_answered', {
      id: questionId,
      value: option.value,
      time_sec: state.timings.timeOnQuestion[questionId] || 0,
      route: state.route || 'unknown'
    });

    saveState();

    // marcar visualmente + pequeña pausa para que el usuario vea la selección
    $$('.option').forEach(b => {
      const isSel = b.dataset.value === option.value;
      b.classList.toggle('is-selected', isSel);
      b.setAttribute('aria-checked', isSel ? 'true' : 'false');
    });

    setTimeout(() => advance(), 220);
  }

  function advance() {
    if (state.cursor < state.queue.length - 1) {
      state.cursor += 1;
      saveState();
      renderQuestion();
    } else {
      // fin del quiz → captura
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

  /* --------- Vista de captura (email + nombre) --------- */
  function renderCapture() {
    const title = $('#captureTitle');
    const subtitle = $('#captureSubtitle');
    title.textContent = '¿A dónde te envío tu diagnóstico?';
    subtitle.textContent = 'Tu resultado se muestra en esta pantalla ahora mismo. Además te envío por email tu diagnóstico completo para que lo tengas guardado.';

    // pre-fill si ya había algo
    if (state.lead.name) $('#fieldName').value = state.lead.name;
    if (state.lead.email) $('#fieldEmail').value = state.lead.email;
    if (state.lead.business_context) $('#fieldBusiness').value = state.lead.business_context;

    // Textarea visible para todos
    const bizWrap = $('#fieldBusinessWrap');
    if (bizWrap) bizWrap.style.display = '';

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

  /* --------- Validación y submit --------- */
  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  async function onSubmit(e) {
    e.preventDefault();
    const name = $('#fieldName').value.trim();
    const email = $('#fieldEmail').value.trim();
    const business_context = ($('#fieldBusiness')?.value || '').trim().slice(0, 500);

    $('#errName').textContent = '';
    $('#errEmail').textContent = '';

    let ok = true;
    if (name.length < 2) { $('#errName').textContent = 'Tu nombre, por favor.'; ok = false; }
    if (!validateEmail(email)) { $('#errEmail').textContent = 'Revisa el formato del email.'; ok = false; }
    if (!ok) return;

    state.lead = { name, email, business_context };
    saveState();

    $('#btnSubmit').disabled = true;
    $('#btnSubmit').textContent = 'Analizando tu caso…';

    const payload = buildPayload();
    await submitIcpIdeal(payload);
  }

  function buildPayload() {
    return {
      diagnostic_id: state.config.diagnostic_id,
      version: state.config.version,
      route: state.route,                // 'dueno' | 'directivo' | 'individual'
      is_individual: state.isIndividual, // bool · para que Claude module tono
      lead: { ...state.lead },
      answers: { ...state.answers },
      context_signals: buildContextSignals(),
      meta: {
        submitted_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        lang: navigator.language || 'es'
      }
    };
  }

  function buildContextSignals() {
    // Tiempo local + timezone
    let timezone = 'America/Mexico_City';
    try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) {}
    const now = new Date();
    const localHour = now.getHours();
    const weekdays = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    const weekday = weekdays[now.getDay()];
    let timeOfDay = 'afternoon';
    if (localHour < 6)       timeOfDay = 'late_night';
    else if (localHour < 12) timeOfDay = 'morning';
    else if (localHour < 18) timeOfDay = 'afternoon';
    else if (localHour < 22) timeOfDay = 'evening';
    else                      timeOfDay = 'late_night';
    const isLateNight = localHour >= 22 || localHour < 6;
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Referrer y UTM
    const ref = document.referrer || '';
    let referrerSource = 'direct';
    if (ref) {
      const host = (() => { try { return new URL(ref).hostname.replace(/^www\./,''); } catch (_) { return ''; }})();
      if      (host.includes('instagram')) referrerSource = 'instagram';
      else if (host.includes('linkedin'))  referrerSource = 'linkedin';
      else if (host.includes('youtube'))   referrerSource = 'youtube';
      else if (host.includes('tiktok'))    referrerSource = 'tiktok';
      else if (host.includes('facebook'))  referrerSource = 'facebook';
      else if (host.includes('x.com') || host.includes('twitter')) referrerSource = 'twitter';
      else if (host.includes('google'))    referrerSource = 'google';
      else if (host.includes('flowibs'))   referrerSource = 'flowibs';
      else referrerSource = host || 'other';
    }
    const urlParams = new URLSearchParams(location.search);
    const utm = {
      source: urlParams.get('utm_source') || null,
      medium: urlParams.get('utm_medium') || null,
      campaign: urlParams.get('utm_campaign') || null
    };

    // Device
    const ua = navigator.userAgent || '';
    let deviceType = 'desktop';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) deviceType = 'tablet';
    else if (/Mobi|Android|iPhone|iPod/i.test(ua)) deviceType = 'mobile';
    const isMobile = deviceType === 'mobile';

    // OS + browser simple
    let os = 'unknown';
    if (/Mac OS X/i.test(ua)) os = 'macos';
    else if (/Windows/i.test(ua)) os = 'windows';
    else if (/Android/i.test(ua)) os = 'android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'ios';
    else if (/Linux/i.test(ua)) os = 'linux';

    // Tiempos
    const totalTimeSec = state.timings.quizStartedAt
      ? Math.round((Date.now() - state.timings.quizStartedAt) / 1000)
      : null;
    const timePerQuestion = { ...state.timings.timeOnQuestion };
    // pregunta donde más tardó
    let slowestQuestion = null, slowestTime = 0;
    for (const [q, t] of Object.entries(timePerQuestion)) {
      if (t > slowestTime) { slowestTime = t; slowestQuestion = q; }
    }
    // velocidad promedio (aprox honestidad: muy rápido < 3s/preg = respuesta mecánica)
    const answered = Object.values(timePerQuestion);
    const avgTimeSec = answered.length ? Math.round(answered.reduce((a,b)=>a+b,0) / answered.length) : null;

    return {
      timezone,
      local_hour: localHour,
      weekday,
      time_of_day: timeOfDay,
      is_late_night: isLateNight,
      is_weekend: isWeekend,
      referrer_source: referrerSource,
      referrer_raw: ref ? ref.slice(0, 120) : null,
      utm,
      device_type: deviceType,
      is_mobile: isMobile,
      os,
      language: navigator.language || null,
      total_time_sec: totalTimeSec,
      avg_time_per_question_sec: avgTimeSec,
      slowest_question: slowestQuestion,
      slowest_question_sec: slowestTime || null,
      time_per_question: timePerQuestion
    };
  }

  /* --------- Contador de retries para fallback plan B --------- */
  let retryCount = 0;

  /* --------- POST, loader, render de resultado --------- */
  async function submitIcpIdeal(payload) {
    show('loading');
    startLoader();
    track('submit_icp_started', {
      email: payload.lead.email,
      has_business_context: !!(payload.lead.business_context && payload.lead.business_context.length > 10)
    });
    try {
      const result = await postWithTimeout(CFG.WEBHOOK_ICP, payload);
      if (!result || !result.arquetipo) throw new Error('Respuesta inesperada del servidor.');
      retryCount = 0; // reset en éxito
      // Guardamos resultado en localStorage como backup (24h)
      try {
        localStorage.setItem('fi_last_result', JSON.stringify({ result, at: Date.now() }));
      } catch (_) {}
      track('submit_icp_success', {
        arquetipo: result.arquetipo.id,
        alfa_meses: result.alfa_meses,
        cta: result.cta_secundario
      });
      // Transición del porcentaje actual → 100% en 700ms, luego render
      finishLoader(() => {
        renderResult(result);
        clearState();
      });
    } catch (err) {
      console.error('ICP webhook falló:', err);
      stopLoader();
      retryCount += 1;
      track('submit_icp_failed', { error: String(err).slice(0, 100), retry: retryCount });
      // Guardar payload en localStorage para recovery
      try {
        localStorage.setItem('fi_failed_submission', JSON.stringify({ payload, at: Date.now() }));
      } catch (_) {}
      showErrorWithFallback(err);
    }
  }

  function showErrorWithFallback(err) {
    const $msg = $('#errorMsg');
    const $btn = $('#btnRetry');
    if (retryCount >= 2) {
      // Plan B · el retry ya falló 2+ veces · ofrecemos contacto directo
      $msg.innerHTML = 'Tenemos un lío del lado nuestro y tu diagnóstico no salió. <strong>Te lo envío personalmente por email en las próximas horas.</strong>';
      $btn.textContent = 'Escribirle a Jorge directamente';
      $btn.onclick = () => {
        const lead = (() => { try { return JSON.parse(localStorage.getItem('fi_failed_submission') || '{}').payload?.lead || {}; } catch (_) { return {}; } })();
        const subject = 'Diagnóstico del Piloto IA · necesito ayuda';
        const body = `Hola Jorge,\n\nLlené el diagnóstico pero falló el envío.\n\nNombre: ${lead.name || ''}\nEmail: ${lead.email || ''}\n\n¿Podés enviarme el resultado manualmente?`;
        window.location.href = `mailto:rodrigo@flowconsulting.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        track('error_fallback_mailto_clicked');
      };
    } else {
      $msg.textContent = err.message || 'No pudimos procesar tu diagnóstico en este momento.';
      $btn.textContent = 'Reintentar';
      $btn.onclick = () => {
        track('error_retry_clicked', { retry: retryCount });
        onSubmit({ preventDefault: () => {} });
      };
    }
    show('error');
  }

  /* --------- Loader · porcentaje gradual + dots + steps --------- */

  const LOADER_STEPS = [
    { to: 16, text: 'Leyendo patrones de riesgo en tu operación…' },
    { to: 33, text: 'Calculando cuántos meses tienes antes de que tu ventaja caduque…' },
    { to: 50, text: 'Mapeando dónde está el dinero que te falta…' },
    { to: 67, text: 'Detectando tu arquetipo entre 8 empresarios LATAM…' },
    { to: 84, text: 'Escribiendo el plan específico para tu caso…' },
    { to: 95, text: 'Revisando que cada palabra te sirva…' }
  ];

  let loaderPercent = 0;
  let loaderTimer = null;
  let loaderFinishing = false;

  function spawnDots() {
    const c = $('#dotsCanvas');
    if (!c || c.childElementCount > 0) return;
    const N = 38;
    const sizes = ['sm', '', '', 'lg'];
    for (let i = 0; i < N; i++) {
      const d = document.createElement('span');
      d.className = 'dot ' + sizes[i % sizes.length];
      if (i % 11 === 0) d.classList.add('coral');
      // Posición aleatoria en el viewport
      d.style.left = (5 + Math.random() * 90) + '%';
      d.style.top  = (5 + Math.random() * 90) + '%';
      // Desfases de animación
      d.style.animationDelay = (Math.random() * -6).toFixed(2) + 's, ' + (Math.random() * -14).toFixed(2) + 's';
      d.style.animationDuration = (3 + Math.random() * 3).toFixed(2) + 's, ' + (10 + Math.random() * 10).toFixed(2) + 's';
      c.appendChild(d);
    }
  }

  function updateTicks(pct) {
    const ticks = $$('.loader2__ticks .tick');
    const activeIdx = Math.min(ticks.length - 1, Math.floor(pct / (100 / ticks.length)));
    ticks.forEach((t, i) => t.classList.toggle('is-active', i <= activeIdx));
  }

  function setLoaderStep(pct) {
    const step = LOADER_STEPS.find(s => pct <= s.to) || LOADER_STEPS[LOADER_STEPS.length - 1];
    const el = $('#loaderStep');
    if (el.textContent !== step.text) {
      el.classList.add('is-fading');
      setTimeout(() => {
        el.textContent = step.text;
        el.classList.remove('is-fading');
      }, 220);
    }
  }

  function renderLoader(pct) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    $('#percentNum').textContent = clamped;
    $('#progressLinearFill').style.width = clamped + '%';
    updateTicks(clamped);
    if (clamped < 100) setLoaderStep(clamped);
    else $('#loaderStep').textContent = '¡Listo!';
  }

  function startLoader() {
    spawnDots();
    loaderPercent = 0;
    loaderFinishing = false;
    renderLoader(0);
    if (loaderTimer) clearInterval(loaderTimer);
    // Sube 1% cada ~420ms hasta 95. Total proyectado: ~40s al 95%.
    loaderTimer = setInterval(() => {
      if (loaderFinishing) return;
      if (loaderPercent < 95) {
        // Subida no-lineal: más rápida al principio, más lenta cerca del 95
        const inc = loaderPercent < 40 ? 1 : loaderPercent < 70 ? 0.8 : 0.4;
        loaderPercent = Math.min(95, loaderPercent + inc);
        renderLoader(loaderPercent);
      }
    }, 420);
  }

  function finishLoader(onDone) {
    loaderFinishing = true;
    if (loaderTimer) { clearInterval(loaderTimer); loaderTimer = null; }
    const start = loaderPercent;
    const t0 = Date.now();
    const DUR = 700;
    const tick = () => {
      const t = Math.min(1, (Date.now() - t0) / DUR);
      const pct = start + (100 - start) * (1 - Math.pow(1 - t, 3)); // easeOutCubic
      renderLoader(pct);
      if (t >= 1) {
        clearInterval(finishInterval);
        setTimeout(() => { try { onDone && onDone(); } catch (e) { console.error(e); } }, 180);
      }
    };
    const finishInterval = setInterval(tick, 16);
    tick();
  }

  function stopLoader() {
    if (loaderTimer) { clearInterval(loaderTimer); loaderTimer = null; }
    loaderFinishing = false;
    loaderPercent = 0;
  }
  // legacy alias — mantengo por compatibilidad con el resto del código
  function cycleLoaderSteps() { startLoader(); }

  /* --------- fetch con timeout --------- */
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

  /* --------- Render del resultado ICP ideal --------- */
  function renderResult(result) {
    stopLoader();

    const arch = result.arquetipo || {};
    const archName = arch.nombre || 'Tu arquetipo';
    const color = arch.color || 'naranja';
    const phase = arch.fase || '';
    const phaseCopy = arch.fase_copy || phase;

    // título y color
    const $arch = $('#rArchetype');
    $arch.textContent = archName;
    $arch.className = 'result__archetype result__archetype-color-' + color;

    $('#rPhase').textContent = phaseCopy;

    // lectura
    $('#rLectura').textContent = result.lectura || '';

    // A³ bar
    const phaseKey = (arch.fase_key || result.fase_key || '').toLowerCase();
    markA3Bar(phaseKey, arch.points != null ? arch.points : result.q4_points);

    // Alfa + subtítulo urgente según rango (calculado en cliente para ser dinámico)
    const alfa = result.alfa_meses != null ? result.alfa_meses : null;
    $('#rAlfaNum').textContent = alfa != null ? alfa : '—';
    let alfaMeta = 'antes de que tu ventaja caduque';
    if (typeof alfa === 'number') {
      const semanas = Math.round(alfa * 4.33);
      if (alfa <= 12)      alfaMeta = `Eso son ${semanas} semanas. Si no mueves en los próximos 90 días, pierdes la mitad.`;
      else if (alfa <= 24) alfaMeta = `Eso son ${semanas} semanas. Cada trimestre en desorden te cuesta 3 meses de Alfa.`;
      else                 alfaMeta = `Eso son ${semanas} semanas. Tu ventaja es real, pero caduca más rápido si no la multiplicas pronto.`;
    }
    $('#rAlfaMeta').textContent = alfaMeta;

    // riesgos
    const rRiesgos = $('#rRiesgos');
    rRiesgos.innerHTML = '';
    (result.riesgos || []).slice(0, 3).forEach(r => {
      const li = document.createElement('li');
      li.innerHTML = formatMaybeBold(r);
      rRiesgos.appendChild(li);
    });

    // acciones
    const rAcciones = $('#rAcciones');
    rAcciones.innerHTML = '';
    (result.acciones || []).slice(0, 3).forEach(a => {
      const li = document.createElement('li');
      li.innerHTML = formatMaybeBold(a);
      rAcciones.appendChild(li);
    });

    // CTA final
    applyCtaFinal(result.cta_secundario || arch.cta_secondary_if_urgent);

    // Setup reproductor custom (una sola vez)
    setupVideoOverlay();

    // Tracking · resultado renderizado + CTA clicks
    track('result_viewed', {
      arquetipo: arch.id,
      fase: arch.fase_key || result.fase_key,
      alfa_meses: result.alfa_meses,
      cta: result.cta_secundario
    });
    const $ctaBtn = $('#ctaFinalBtn');
    if ($ctaBtn && !$ctaBtn.dataset.bound) {
      $ctaBtn.dataset.bound = '1';
      $ctaBtn.addEventListener('click', () => {
        track('cta_final_clicked', { arquetipo: arch.id, destination: $ctaBtn.href });
      });
    }
    const $vslPlay = $('#videoOverlay');
    if ($vslPlay && !$vslPlay.dataset.trackBound) {
      $vslPlay.dataset.trackBound = '1';
      $vslPlay.addEventListener('click', () => {
        track('vsl_play_clicked', { arquetipo: arch.id });
      }, { once: true });
    }

    show('result');
  }

  function setupVideoOverlay() {
    const overlay = $('#videoOverlay');
    const video = $('#vslPlayer');
    if (!overlay || !video || overlay.dataset.bound === '1') return;
    overlay.dataset.bound = '1';
    const play = () => {
      overlay.classList.add('is-hidden');
      video.setAttribute('controls', '');
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    };
    overlay.addEventListener('click', play);
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
    });
  }

  function markA3Bar(phaseKey, q4Points) {
    // level: 1=Pre-A³, 2=Amplifica, 3=Automatiza, 4=Acelera
    const map = {
      'pre_a3': 1,
      'fase_1_amplifica': 2,
      'fase_2_inicial': 3,
      'fase_2_solida': 3,
      'fase_3_acelera': 4
    };
    let level = map[phaseKey];
    if (!level && q4Points != null) {
      level = q4Points === 0 ? 1 : q4Points === 1 ? 2 : q4Points <= 3 ? 3 : 4;
    }
    if (!level) level = 2;

    const phases = $$('.a3-phase');
    const lines = $$('.a3-phase__line');
    phases.forEach((p, i) => {
      const idx = i + 1;
      p.classList.toggle('is-done', idx < level);
      p.classList.toggle('is-current', idx === level);
      p.classList.toggle('is-pending', idx > level);
    });
    lines.forEach((l, i) => {
      // línea i conecta fase i+1 con fase i+2
      l.classList.toggle('is-done', i + 1 < level);
    });
  }

  function applyCtaFinal(type) {
    const $btn = $('#ctaFinalBtn');
    const $title = $('#ctaFinalTitle');
    const $text = $('#ctaFinalText');
    if (type === 'discovery_call_flow_ibs') {
      $title.textContent = 'Tu siguiente paso no cabe en una clase.';
      $text.textContent = 'A tu nivel la conversación es sobre arquitectura competitiva de largo plazo, no sobre más IA. Agendemos 45 minutos en directo.';
      $btn.textContent = 'Agendar Discovery call →';
      $btn.href = CFG.URL_DISCOVERY;
    } else {
      $title.textContent = '7 de 10 empresarios instalan la Fórmula A³ en desorden y vuelven a empezar.';
      $text.textContent = 'En Amplifica corregimos las 2 trampas que te hacen reiniciar: el paso que saltaste en Fase 1 y el que instalaste antes de tiempo. Semana a semana, en vivo.';
      $btn.textContent = 'Entrar a Amplifica →';
      $btn.href = CFG.URL_AMPLIFICA;
    }
  }

  function formatMaybeBold(s) {
    if (!s) return '';
    // soporta markdown **bold**
    return escapeHtml(String(s)).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* --------- Flow de arranque --------- */
  function startQuiz() {
    state.route = null;
    state.isOffIcp = false;
    state.queue = ['Q1'];
    state.cursor = 0;
    state.answers = {};
    state.timings = { quizStartedAt: null, questionShownAt: {}, timeOnQuestion: {} };
    saveState();
    track('quiz_started');
    renderQuestion();
  }

  function tryResume() {
    const saved = loadState();
    if (!saved || !saved.queue || !saved.queue.length) return false;
    // solo resumimos si había al menos una respuesta registrada
    if (!Object.keys(saved.answers || {}).length) return false;
    Object.assign(state, saved);
    renderQuestion();
    return true;
  }

  /* --------- Binding de eventos --------- */
  function bind() {
    $('#btnStart').addEventListener('click', () => {
      track('landing_cta_clicked');
      startQuiz();
    });
    $('#btnBack').addEventListener('click', back);
    $('#captureForm').addEventListener('submit', onSubmit);
    // btnRetry handler se asigna dinámicamente en showErrorWithFallback()
  }

  /* --------- Boot --------- */
  async function boot() {
    try {
      await loadConfig();
      bind();
      // intento resumir si el usuario había arrancado
      const params = new URLSearchParams(location.search);
      if (params.get('reset') === '1') {
        clearState();
        show('landing');
        return;
      }
      if (!tryResume()) {
        show('landing');
      }
    } catch (err) {
      console.error('Boot error:', err);
      $('#errorMsg').textContent = 'No se pudo cargar el diagnóstico. Intenta recargar la página.';
      show('error');
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
