// Informe Rodrigo Lohr · App logic

// Progress bar + reveal on scroll
let ticking = false;
function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      const scrollPx = window.scrollY;
      const winHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = winHeight ? (scrollPx / winHeight) * 100 : 0;
      const fill = document.getElementById('progressFill');
      if (fill) fill.style.width = pct + '%';
      ticking = false;
    });
    ticking = true;
  }
}
window.addEventListener('scroll', onScroll, { passive: true });

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

function observeReveals(root = document) {
  root.querySelectorAll('.reveal').forEach(el => {
    if (!el.classList.contains('is-visible')) io.observe(el);
  });
}
observeReveals();

// =============================================
// SEC 01 — STRATEGY
// =============================================
function renderStrategy() {
  // Comparison table
  const compHTML = `
    <table class="comp-table">
      <thead><tr><th>Dimensión</th><th>Ramiro Cubria</th><th>Rodrigo Lohr</th></tr></thead>
      <tbody>
        ${ANALYSIS.strategy.comparison.map(r => `<tr><td>${r.dim}</td><td>${r.ramiro}</td><td>${r.rodrigo}</td></tr>`).join('')}
      </tbody>
    </table>
  `;
  document.getElementById('strategyComparison').innerHTML = compHTML;

  // Funnel
  const funnelEl = document.getElementById('funnelStages');
  ANALYSIS.strategy.funnel.forEach(f => {
    const div = document.createElement('div');
    div.className = 'funnel-stage';
    div.innerHTML = `
      <div class="funnel-stage__num">${f.layer}</div>
      <div class="funnel-stage__body">
        <div class="funnel-stage__name">Capa ${f.layer} · ${f.channel}</div>
        <div class="funnel-stage__title">${f.name}</div>
        <div class="funnel-stage__desc">${f.mechanism}</div>
        <div class="funnel-stage__cta">${f.cta}</div>
      </div>
    `;
    funnelEl.appendChild(div);
  });

  // Pillars
  const pillarsEl = document.getElementById('pillarsGrid');
  ANALYSIS.strategy.pillars.forEach(p => {
    const div = document.createElement('div');
    div.className = 'pillar-card';
    div.innerHTML = `
      <div class="pillar-card__num">${p.num}</div>
      <div class="pillar-card__pct-lbl">${p.percentage}% del feed</div>
      <div class="pillar-card__pct">${p.percentage}%</div>
      <div class="pillar-card__name">${p.name}</div>
      <div class="pillar-card__role">${p.role}</div>
      <div class="pillar-card__topics">${p.subtopics.map(t => `<span class="topic-pill">${t}</span>`).join('')}</div>
    `;
    pillarsEl.appendChild(div);
  });

  // Mix charts
  const mixData = ANALYSIS.strategy.mix;
  function donut(canvasId, data) {
    return new Chart(document.getElementById(canvasId), {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.value),
          backgroundColor: ['#5FE8D7', '#7FF4E5', '#14B8A6', '#3DD4C2', '#0F766E'],
          borderColor: '#0B1A22', borderWidth: 3, hoverOffset: 8,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: {
          legend: { position: 'right', labels: { font: { family: "'Montserrat'", weight: '600', size: 11 }, padding: 8, color: 'rgba(255,255,255,0.85)', boxWidth: 8, boxHeight: 8, usePointStyle: true } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%` } }
        }
      }
    });
  }
  donut('mixPurposeChart', mixData.purpose);
  donut('mixFunnelChart', mixData.funnel);
  donut('mixAwarenessChart', mixData.awareness);
  donut('mixFormatoChart', mixData.formato);
}

// =============================================
// SEC 02 — LEAD MAGNETS
// =============================================
function renderMagnets() {
  const grid = document.getElementById('magnetsGrid');
  PLAN.leadMagnets.forEach(m => {
    const card = document.createElement('div');
    card.className = 'magnet-card';
    let detailsHtml = `
      <div class="magnet-card__row">
        <div class="magnet-card__row-lbl">Promesa</div>
        <div class="magnet-card__row-val">${m.promise}</div>
      </div>
      <div class="magnet-card__row">
        <div class="magnet-card__row-lbl">Estructura</div>
        <div class="magnet-card__row-val">${m.structure}</div>
      </div>
      <div class="magnet-card__row">
        <div class="magnet-card__row-lbl">Cuándo usar</div>
        <div class="magnet-card__row-val">${m.whenToUse}</div>
      </div>
    `;
    if (m.cases) detailsHtml += `<div class="magnet-card__row"><div class="magnet-card__row-lbl">Casos en video</div><div class="magnet-card__row-val">${m.cases.join(' · ')}</div></div>`;
    if (m.cta) detailsHtml += `<div class="magnet-card__row"><div class="magnet-card__row-lbl">CTA final</div><div class="magnet-card__row-val">${m.cta}</div></div>`;

    card.innerHTML = `
      <div class="magnet-card__keyword">Keyword: ${m.keyword}</div>
      <div class="magnet-card__title">${m.name}</div>
      <div class="magnet-card__type">${m.type}</div>
      <div class="magnet-card__details">${detailsHtml}</div>
      <a href="${m.url}" target="_blank" class="magnet-card__url">
        Ver landing
        <svg class="magnet-card__url-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 17 17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
    `;
    grid.appendChild(card);
  });
}

// =============================================
// SEC 03 — REELS
// =============================================
function renderReels() {
  const r = ANALYSIS.reels;
  document.getElementById('reelsIntro').textContent = r.intro;

  document.getElementById('reelsInsight').innerHTML = `
    <svg class="insight__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/></svg>
    <div class="insight__text"><strong>Insight contraintuitivo:</strong> ${r.insight.replace('Insight contraintuitivo: ','')}</div>
  `;

  document.getElementById('reelsSi').innerHTML = r.si.map(s => `<li>${s}</li>`).join('');
  document.getElementById('reelsNo').innerHTML = r.no.map(s => `<li>${s}</li>`).join('');

  document.getElementById('reelsHooks').innerHTML = r.hooks.map(h => `
    <div class="hook-card">
      <span class="hook-card__code">${h.code}</span>
      <div class="hook-card__name">${h.name}</div>
      <div class="hook-card__template">${h.template}</div>
      <div class="hook-card__example">"${h.example}"</div>
      <div class="hook-card__note">${h.note}</div>
    </div>
  `).join('');

  document.getElementById('reelsStructures').innerHTML = `
    <div class="struct-row header">
      <div></div><div>Nombre</div><div>Flow narrativo</div><div>Duración</div><div>CR esperado</div><div>Cuándo usar</div>
    </div>
    ${r.structures.map(s => `
      <div class="struct-row">
        <div class="struct-num">0${s.num}</div>
        <div class="struct-name">${s.name}</div>
        <div class="struct-flow">${s.flow}</div>
        <div class="struct-meta">${s.duration}</div>
        <div class="struct-meta">${s.cr}</div>
        <div class="struct-use">${s.use}</div>
      </div>
    `).join('')}
  `;

  document.getElementById('reelsDuration').innerHTML = r.duration.map(d => `<tr><td>${d.obj}</td><td>${d.time}</td><td>${d.reason}</td></tr>`).join('');

  document.getElementById('reelsPrompt').textContent = PROMPTS.reels;
}

// =============================================
// SEC 04 — STORIES
// =============================================
function renderStories() {
  const s = ANALYSIS.stories;
  document.getElementById('storiesIntro').textContent = s.intro;

  document.getElementById('storiesInsight').innerHTML = `
    <svg class="insight__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/></svg>
    <div class="insight__text">${s.insight}</div>
  `;

  document.getElementById('storiesCategories').innerHTML = s.categories.map(c => `
    <div class="cat-card">
      <div class="cat-card__head">
        <div class="cat-card__num">${c.num}</div>
        <div class="cat-card__pct">${c.pct}%</div>
      </div>
      <div class="cat-card__name">${c.name}</div>
      <div class="cat-card__role">${c.role}</div>
    </div>
  `).join('');

  document.getElementById('storiesSi').innerHTML = s.si.map(x => `<li>${x}</li>`).join('');
  document.getElementById('storiesNo').innerHTML = s.no.map(x => `<li>${x}</li>`).join('');

  document.getElementById('storiesVI').innerHTML = s.videoVsImage.map(v => `<tr><td>${v.metric}</td><td>${v.video}</td><td>${v.image}</td></tr>`).join('');

  document.getElementById('storiesArcs').innerHTML = s.arcs.map(a => `
    <div class="arc-row ${a.isStar ? 'star' : ''}">
      <div class="arc-row__name">${a.name}${a.isStar ? '<span class="arc-row__star">★ MÁS CONVERTIDOR</span>' : ''}</div>
      <div class="arc-row__count">${a.count}</div>
      <div class="arc-row__role">${a.role}</div>
    </div>
  `).join('');

  document.getElementById('storiesPrompt').textContent = PROMPTS.stories;
}

// =============================================
// SEC 05 — CARRUSELES
// =============================================
function renderCarruseles() {
  const c = ANALYSIS.carouseles;
  document.getElementById('carruselesIntro').textContent = c.intro;

  document.getElementById('carruselesInsight').innerHTML = `
    <svg class="insight__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/></svg>
    <div class="insight__text"><strong>Hallazgo brutal:</strong> ${c.insight.replace('Hallazgo brutal: ','')}</div>
  `;

  // Archetypes table with bars
  const maxComments = Math.max(...c.archetypes.map(a => a.comments));
  document.getElementById('carruselesArchetypes').innerHTML = `
    <div class="arch-row header">
      <div>Arquetipo</div><div>Posts</div><div>Avg comments</div><div>Performance</div><div>Ratio</div>
    </div>
    ${c.archetypes.map(a => `
      <div class="arch-row ${a.isWorst ? 'worst' : ''}">
        <div class="arch-row__name">${a.name}</div>
        <div class="arch-row__metric">${a.n}</div>
        <div class="arch-row__metric">${a.comments.toLocaleString()}</div>
        <div class="arch-row__bar-track"><div class="arch-row__bar-fill" style="width: ${(a.comments / maxComments * 100)}%"></div></div>
        <div class="arch-row__ratio">${a.ratio}×</div>
      </div>
    `).join('')}
  `;

  // Slides bars
  const maxSlideCount = Math.max(...c.slides.map(s => s.n));
  document.getElementById('slidesBars').innerHTML = c.slides.map(s => {
    const heightPct = (s.n / maxSlideCount * 100);
    const cls = s.isStar ? 'star' : s.isWorst ? 'worst' : '';
    return `
      <div class="slides-bar ${cls}">
        <div class="slides-bar__bar" style="height: ${heightPct}%; position: relative;">
          <span class="slides-bar__val">${s.n}</span>
        </div>
        <div class="slides-bar__label">${s.count} slides</div>
      </div>
    `;
  }).join('');

  document.getElementById('carruselesFormula').textContent = c.formula;
  document.getElementById('carruselesRules').innerHTML = c.rules.map(r => `<li style="padding: 6px 0;">${r}</li>`).join('');
  document.getElementById('carruselesSi').innerHTML = c.si.map(x => `<li>${x}</li>`).join('');
  document.getElementById('carruselesNo').innerHTML = c.no.map(x => `<li>${x}</li>`).join('');

  document.getElementById('carruselesWeekly').innerHTML = c.weeklyStrategy.map(w => `<tr><td>${w.day}</td><td>${w.archetype}</td><td>${w.topic}</td><td>${w.pillar}</td></tr>`).join('');

  document.getElementById('carruselesPrompt').textContent = PROMPTS.carruseles;
}

// =============================================
// SEC 06 — ROADMAP
// =============================================
function renderRoadmap() {
  document.getElementById('roadmapPhases').innerHTML = ANALYSIS.roadmap.map(p => `
    <div class="phase">
      <div class="phase__num">${p.num}</div>
      <div class="phase__body">
        <div class="phase__lbl">Días ${p.days}</div>
        <div class="phase__title">${p.phase}</div>
        <div class="phase__row"><div class="phase__row-lbl">Cadencia</div><div class="phase__row-val">${p.cadence}</div></div>
        <div class="phase__row"><div class="phase__row-lbl">Mix</div><div class="phase__row-val">${p.mix}</div></div>
        <div class="phase__row"><div class="phase__row-lbl">Foco</div><div class="phase__row-val">${p.focus}</div></div>
        <div class="phase__row"><div class="phase__row-lbl">KPI</div><div class="phase__row-val">${p.kpi}</div></div>
      </div>
    </div>
  `).join('');

  document.getElementById('roadmapHito').innerHTML = `<strong>${ANALYSIS.hito.split(':')[0]}:</strong>${ANALYSIS.hito.split(':').slice(1).join(':')}`;
}

// =============================================
// SEC 07 — KPIs
// =============================================
function renderKPIs() {
  document.getElementById('kpiMetrics').innerHTML = ANALYSIS.kpis.metrics.map(m => `<tr><td>${m.metric}</td><td>${m.p50}</td><td>${m.m3}</td><td>${m.m6}</td><td>${m.m12}</td></tr>`).join('');
  document.getElementById('kpiPercentiles').innerHTML = ANALYSIS.kpis.percentiles.map(p => `<tr><td>${p.pct}</td><td>${p.plays}</td><td>${p.likes}</td><td>${p.comments}</td><td>${p.cr}</td></tr>`).join('');
  document.getElementById('kpiHowToUse').innerHTML = `<strong>Cómo usar:</strong> ${ANALYSIS.kpis.howToUse}`;
}

// =============================================
// SEC 08 — PLAN 21 DAYS (calendar)
// =============================================
let activeWeek = 0;
let selectedDay = null;

function renderWeeksTabs() {
  const tabs = document.getElementById('weeksTabs');
  tabs.innerHTML = '';
  PLAN.weeks.forEach((week, idx) => {
    const tab = document.createElement('button');
    tab.className = 'week-tab' + (idx === activeWeek ? ' active' : '');
    tab.innerHTML = `Semana ${week.n} · ${week.label}<span class="week-tab__count">${week.pieces.total}</span>`;
    tab.onclick = () => { activeWeek = idx; selectedDay = null; renderWeeksTabs(); renderWeekContent(); };
    tabs.appendChild(tab);
  });
}

function renderWeekContent() {
  const week = PLAN.weeks[activeWeek];
  const container = document.getElementById('weekContent');

  let summaryHTML = `
    <div class="week-summary">
      <div class="week-summary__cell"><div class="week-summary__num">${week.pieces.reels}</div><div class="week-summary__lbl">Reels</div></div>
      <div class="week-summary__cell"><div class="week-summary__num">${week.pieces.carruseles}</div><div class="week-summary__lbl">Carruseles</div></div>
      <div class="week-summary__cell"><div class="week-summary__num">${week.pieces.stories}</div><div class="week-summary__lbl">Stories</div></div>
      <div class="week-summary__cell"><div class="week-summary__num">${week.pieces.total}</div><div class="week-summary__lbl">Total semana</div></div>
    </div>
  `;

  if (week.hito) {
    summaryHTML = `
      <div style="background: rgba(255,200,80,0.10); border: 1px solid rgba(255,200,80,0.30); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; font-size: 14px; color: rgba(255,200,80,0.95); display: flex; align-items: center; gap: 12px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
        <span><strong>Hito operativo crítico:</strong> ${week.hito}</span>
      </div>
    ` + summaryHTML;
  }

  let daysHTML = '<div class="days-grid">';
  week.days.forEach((day, dayIdx) => {
    const slotChips = day.slots.map(s => {
      const cls = `slot-chip slot-chip--${s.type}`;
      const label = s.type === 'reel' ? 'Reel' : s.type === 'carrusel' ? 'Carrusel' : `${s.n} stories`;
      const num = s.n && s.type !== 'stories' ? `#${s.n}` : '';
      return `<span class="${cls}"><span class="slot-chip__dot"></span>${label} ${num}</span>`;
    }).join('');
    const isSelected = selectedDay && selectedDay.weekIdx === activeWeek && selectedDay.dayIdx === dayIdx;
    daysHTML += `
      <div class="day-card ${isSelected ? 'selected' : ''}" data-week="${activeWeek}" data-day="${dayIdx}">
        <div class="day-card__weekday">${day.weekday}</div>
        <div class="day-card__date">${day.date}</div>
        <div class="day-card__focus">${day.focus}</div>
        <div class="day-card__slots">${slotChips}</div>
      </div>
    `;
  });
  daysHTML += '</div>';

  container.innerHTML = summaryHTML + daysHTML;

  container.querySelectorAll('.day-card').forEach(card => {
    card.onclick = () => {
      selectedDay = { weekIdx: parseInt(card.dataset.week), dayIdx: parseInt(card.dataset.day) };
      renderWeekContent();
      renderDayDetail();
      setTimeout(() => {
        const d = document.getElementById('dayDetail');
        if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    };
  });

  renderDayDetail();
}

function renderDayDetail() {
  const existing = document.getElementById('dayDetail');
  if (existing) existing.remove();
  if (!selectedDay) return;

  const day = PLAN.weeks[selectedDay.weekIdx].days[selectedDay.dayIdx];
  const detail = document.createElement('div');
  detail.id = 'dayDetail';
  detail.className = 'day-detail active';

  let slotsHTML = '<div class="slots-timeline">';
  day.slots.forEach(slot => {
    const typeLabel = slot.type === 'reel' ? 'Reel' : slot.type === 'carrusel' ? 'Carrusel' : 'Stories';
    const numLabel = slot.n ? (slot.type === 'stories' ? `${slot.n} stories` : `#${slot.n}`) : '';
    const star = slot.isStar ? '<span class="star-badge">★ MÁS CONVERTIDOR</span>' : '';
    const titleText = slot.type === 'stories' ? `${slot.n} stories — ${slot.arc}` : slot.type === 'reel' ? `Reel #${slot.n}` : `Carrusel #${slot.n}`;

    let metaHTML = '<div class="slot-item__meta">';
    if (slot.pillar) metaHTML += `<span class="meta-pill"><span class="meta-pill__lbl">Pillar</span>${PILLARS[slot.pillar].short}</span>`;
    if (slot.archetype) metaHTML += `<span class="meta-pill"><span class="meta-pill__lbl">Arquetipo</span>${slot.archetype}</span>`;
    if (slot.hook) metaHTML += `<span class="meta-pill"><span class="meta-pill__lbl">Hook</span>${slot.hook}</span>`;
    if (slot.structure) metaHTML += `<span class="meta-pill"><span class="meta-pill__lbl">Estructura</span>${slot.structure}</span>`;
    if (slot.slides) metaHTML += `<span class="meta-pill"><span class="meta-pill__lbl">Slides</span>${slot.slides}</span>`;
    if (slot.duration) metaHTML += `<span class="meta-pill"><span class="meta-pill__lbl">Duración</span>${slot.duration}</span>`;
    if (slot.keyword) metaHTML += `<span class="meta-pill meta-pill--keyword"><span class="meta-pill__lbl">Keyword</span>${slot.keyword}</span>`;
    if (slot.magnet) metaHTML += `<span class="meta-pill meta-pill--magnet"><span class="meta-pill__lbl">Magnet</span>${slot.magnet}</span>`;
    metaHTML += '</div>';

    const description = slot.topic || slot.description;
    const iconSvg = slot.type === 'reel' ? '<polygon points="5 3 19 12 5 21 5 3"/>' : slot.type === 'carrusel' ? '<rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>' : '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>';

    slotsHTML += `
      <div class="slot-item">
        <div class="slot-item__type">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>
          ${typeLabel} ${numLabel} ${star}
        </div>
        <div class="slot-item__title">${titleText}</div>
        <div class="slot-item__topic">${description}</div>
        ${metaHTML}
      </div>
    `;
  });
  slotsHTML += '</div>';

  detail.innerHTML = `
    <div class="day-detail__header">
      <div class="day-detail__weekday">${day.weekday}</div>
      <div class="day-detail__date">${day.date}</div>
      <div class="day-detail__focus">${day.focus}</div>
    </div>
    ${slotsHTML}
  `;

  document.getElementById('weekContent').appendChild(detail);
}

// Copy buttons for system prompts
function setupCopyButtons() {
  document.querySelectorAll('.prompt-block__copy').forEach(btn => {
    btn.onclick = async () => {
      const promptKey = btn.dataset.prompt;
      const text = PROMPTS[promptKey];
      try {
        await navigator.clipboard.writeText(text);
        const original = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>Copiado';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = original;
        }, 2000);
      } catch (e) {
        alert('No se pudo copiar. Selecciona y copia manualmente.');
      }
    };
  });
}

// Chart.js defaults
Chart.defaults.font.family = "'Open Sans', system-ui, sans-serif";
Chart.defaults.color = 'rgba(255,255,255,0.65)';
Chart.defaults.borderColor = 'rgba(255,255,255,0.10)';
Chart.defaults.plugins.tooltip.backgroundColor = '#07131A';
Chart.defaults.plugins.tooltip.borderColor = '#5FE8D7';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 6;
Chart.defaults.plugins.tooltip.titleColor = '#5FE8D7';
Chart.defaults.plugins.tooltip.titleFont = { family: "'Montserrat'", weight: '700', size: 12 };

// Init all sections
renderStrategy();
renderMagnets();
renderReels();
renderStories();
renderCarruseles();
renderRoadmap();
renderKPIs();
renderWeeksTabs();
renderWeekContent();
setupCopyButtons();
observeReveals();

console.log('Informe Rodrigo Lohr · Cargado');
