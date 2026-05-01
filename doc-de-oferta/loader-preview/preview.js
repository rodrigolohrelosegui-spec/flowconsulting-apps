/* ============================================================
   Preview · Loader Cinemático para Offer Clarity Scanner
   - Reusa estructura completa del loader del Diagnóstico
   - Solo adapta el copy al contexto del scanner narrativo
   - Auto-loop: al terminar las 6 escenas reinicia
   ============================================================ */
(function () {
  'use strict';

  /* ---------- DOM helpers ---------- */
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const escapeHtml = (s) => String(s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ---------- Background dots ---------- */
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

  /* ---------- Scenes ---------- */
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

  /* ---------- Percent ---------- */
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

  /* ---------- Typewriter ---------- */
  async function typewriter(el, text, speed=28, opts={}) {
    el.innerHTML = '';
    const cursor = document.createElement('span');
    cursor.className = opts.cursorClass || 'cli__cursor';
    el.appendChild(cursor);
    for (let i = 0; i < text.length; i++) {
      cursor.insertAdjacentText('beforebegin', text[i]);
      const ch = text[i];
      const wait = ch === ',' ? speed * 4 : ch === '.' ? speed * 6 : ch === '\n' ? speed * 2 : speed;
      await sleep(wait);
    }
    if (opts.removeCursor) cursor.remove();
  }

  /* ============================================================
     SCENE 1 · CLI · ingesta del copy del lead
     ============================================================ */
  async function playScene1(payload, firstName) {
    const cliBody = $('#cliBody');
    if (!cliBody) return;
    cliBody.innerHTML = '';
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City'; } catch { return 'America/Mexico_City'; }})();
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');
    const ctxLen = payload.ctxLen || 1420;
    const hash = Math.random().toString(16).slice(2,6) + '-' + Math.random().toString(16).slice(2,6) + '-' + Math.random().toString(16).slice(2,6);
    const lines = [
      { html: `<span class="prompt">&gt;</span> Sesión iniciada · <span class="accent">${hh}:${mm}:${ss}</span> · ${tz}` },
      { html: `<span class="prompt">&gt;</span> Recibido de <span class="accent">${escapeHtml(firstName)}</span>: bio + landing + oferta · ${ctxLen} caracteres de copy` },
      { html: `<span class="prompt">&gt;</span> Idioma: ES · Origen: ${(document.referrer && (() => { try { return new URL(document.referrer).hostname; } catch { return 'directo'; }})()) || 'directo'}` },
      { html: `<span class="prompt">&gt;</span> Encriptando datos... <span class="ok">[✓]</span>` },
      { html: `<span class="prompt">&gt;</span> Hash de sesión: <span class="muted">${hash}</span>` },
      { html: `<span class="prompt">&gt;</span> Conectando con el motor de análisis narrativo...<span class="cli__cursor"></span>` }
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
      if (wait > 0) await sleep(wait);
    }
    await sleep(2400);
  }

  /* ============================================================
     SCENE 2 · 9 patrones narrativos evaluándose
     ============================================================ */
  function computeScannerPatterns() {
    // Para preview: matches predeterministas para mostrar variedad (5 match, 4 skip)
    return [
      { key:'promesa_generica',         label:'Promesa genérica',                   match: true  },
      { key:'mecanismo_ausente',        label:'Mecanismo único ausente',            match: true  },
      { key:'vehiculo_invisible',       label:'Vehículo roto invisible',            match: true  },
      { key:'prueba_sin_numeros',       label:'Prueba sin números',                 match: true  },
      { key:'voz_founder_no_cliente',   label:'Voz del founder, no del cliente',    match: false },
      { key:'avatar_borroso',           label:'Avatar borroso',                     match: true  },
      { key:'brecha_q6_vs_copy',        label:'Brecha entre lo que decís y lo que hacés', match: false },
      { key:'frase_saturada',           label:'Frase saturada del mercado',         match: true  },
      { key:'coherencia_baja',          label:'Coherencia narrativa baja',          match: false }
    ];
  }
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
      await sleep(1000);
      chip.classList.remove('is-checking');
      chip.classList.add(p.match ? 'is-match' : 'is-skip');
      if (p.match) {
        matchCount++;
        counter.textContent = matchCount;
        caption.textContent = `Patrón detectado: ${p.label}`;
      } else {
        caption.textContent = `${p.label}: no aplica a tu copy`;
      }
      await sleep(750);
    }
    caption.textContent = `${matchCount} patrones detectados en tu narrativa.`;
    await sleep(700);
  }

  /* ============================================================
     SCENE 3 · contraste con 200 ofertas auditadas
     ============================================================ */
  async function playScene3() {
    const grid = $('#casesGrid');
    const caption = $('#casesCaption');
    const score = $('#casesScore');
    if (!grid) return;
    grid.innerHTML = '';
    const cases = [
      { i:'C', sub:'Coach' },         { i:'C', sub:'Consultor' },     { i:'A', sub:'Agencia' },
      { i:'E', sub:'Experto' },       { i:'M', sub:'Mentor' },        { i:'F', sub:'Formador' },
      { i:'P', sub:'Profesional' },   { i:'E', sub:'Estratega' },     { i:'F', sub:'Founder' },
      { i:'C', sub:'Creador' },       { i:'A', sub:'Asesor' },        { i:'E', sub:'Educador' },
      { i:'C', sub:'Consultor' },     { i:'A', sub:'Agencia' },       { i:'C', sub:'Coach' },
      { i:'E', sub:'Experto' },       { i:'F', sub:'Founder' }
    ];
    const winnerIdx = Math.floor(cases.length * 0.30);
    const scan = document.createElement('div');
    scan.className = 'cases-scan';
    grid.appendChild(scan);
    cases.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'case-card';
      card.innerHTML = `<div>${c.i}</div><div class="case-card__sub">${escapeHtml(c.sub)}</div>`;
      grid.appendChild(card);
      setTimeout(() => card.classList.add('is-revealed'), 110 * i);
    });
    await sleep(110 * cases.length + 400);
    caption.textContent = 'Cruzando tu copy con 200 ofertas auditadas en los últimos 5 años…';
    scan.classList.add('is-running');
    await sleep(1700);
    scan.classList.remove('is-running');
    await sleep(300);
    caption.textContent = 'Identificando patrones recurrentes en ofertas del mismo bracket…';
    scan.classList.add('is-running');
    await sleep(1700);
    scan.classList.remove('is-running');
    caption.textContent = 'Aislando el patrón narrativo dominante en tu copy…';
    await sleep(1100);
    const winnerCard = grid.querySelectorAll('.case-card')[winnerIdx];
    if (winnerCard) winnerCard.classList.add('is-winner');
    caption.textContent = 'Patrón narrativo identificado';
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

  /* ============================================================
     SCENE 4 · knowledge graph: aislando la frase que rompe
     ============================================================ */
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
      c.style.opacity = '0';
      c.style.transition = 'opacity .4s';
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
    caption.textContent = 'Mapeando 47 elementos narrativos de tu copy…';
    await sleep(3200);
    const waves = [
      { count: 12, cap: 'Filtrando por impacto en conversión…' },
      { count: 5,  cap: 'Eliminando los que ya funcionan bien…' },
      { count: 3,  cap: 'Aislando los de mayor costo en ventas…' },
      { count: 1,  cap: 'Encontrando la frase que más sabotea conversión…' }
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
        await sleep(140);
      }
      counter.textContent = w.count;
      await sleep(1000);
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
    caption.textContent = 'Tu frase que rompe identificada.';
    await sleep(1800);
  }

  /* ============================================================
     SCENE 5 · document writing
     ============================================================ */
  async function playScene5(firstName) {
    const docBody = $('#docBody');
    if (!docBody) return;
    const fragments = [
      `${firstName}, basado en tu copy lo primero que veo es un patrón claro…`,
      `Calibrando el análisis al bracket y madurez de tu negocio…`,
      `Cruzando tu narrativa con las 200 ofertas auditadas…`,
      `Verificando que cada cambio se pueda implementar esta semana…`,
      `Pesando lo que perdés sin moverlo contra lo que ganás moviéndolo…`,
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

  /* ============================================================
     SCENE 6 · verification checklist + spoiler
     ============================================================ */
  async function playScene6() {
    const list = $('#checklist');
    if (!list) return;
    const items = [
      'Análisis personalizado a tu copy real',
      'Tono calibrado a tu negocio',
      '4 pilares narrativos evaluados',
      'Frase que rompe identificada en tu input',
      'Trim and Stack aplicado a tu oferta',
      'Big Domino de la semana aislado',
      'La verdad incómoda que ningún consultor te diría'
    ];
    list.innerHTML = '';
    const liEls = items.map(text => {
      const li = document.createElement('li');
      li.className = 'cli-item';
      li.innerHTML = `<span class="cli-item__icon">⠋</span><span>${escapeHtml(text)}</span>`;
      list.appendChild(li);
      return li;
    });
    for (let i = 0; i < liEls.length; i++) {
      const li = liEls[i];
      li.classList.add('is-running');
      await sleep(1300);
      li.classList.remove('is-running');
      li.classList.add('is-done');
      li.querySelector('.cli-item__icon').textContent = '✓';
    }
    // Spoiler reveal
    $('#spoilerArchetype').textContent = 'Mecanismo Único';
    $('#spoiler').hidden = false;
    setPercentClean100();
    await sleep(2400);
  }

  /* ============================================================
     RUN ORCHESTRATOR (preview · loop infinito)
     ============================================================ */
  let running = false;
  async function runPreview() {
    if (running) return;
    running = true;

    // Reset visual state
    $('#cliBody').innerHTML = '';
    $('#patternsGrid').innerHTML = '';
    $('#casesGrid').innerHTML = '';
    $('#kgEdges').innerHTML = '';
    $('#kgNodes').innerHTML = '';
    $('#kgFinal').innerHTML = '';
    $('#docBody').innerHTML = '';
    $('#checklist').innerHTML = '';
    $('#spoiler').hidden = true;
    $('#patternsCount').textContent = '0';
    $('#casesScore').textContent = '0';
    $('#leverCount').textContent = '47';
    document.querySelector('.lever-redacted')?.classList.remove('is-visible');
    setPercent(1);

    const payload = { ctxLen: 1420 };
    const firstName = 'Jorge';
    const patterns = computeScannerPatterns();

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
    }

    transitionTo(5);
    await tweenPercent(82, 95, 5500);
    await playScene6();

    await sleep(2400);
    running = false;
    // Auto-loop
    runPreview();
  }

  /* ---------- Boot ---------- */
  function init() {
    spawnDots();
    runPreview();
    $('#btnRestart').addEventListener('click', () => {
      // Force restart: cancel current loop by reloading visual state on next tick
      running = false;
      runPreview();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
