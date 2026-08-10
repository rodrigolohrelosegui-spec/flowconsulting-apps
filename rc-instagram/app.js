// === Ramiro Cubria Dashboard · Front logic ===
const D = DASHBOARD_DATA;

// Chart.js global theme
Chart.defaults.color = '#8b8b99';
Chart.defaults.borderColor = '#2d2d36';
Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.font = { size: 11 };
Chart.defaults.plugins.tooltip.backgroundColor = '#0a0a0c';
Chart.defaults.plugins.tooltip.borderColor = '#2d2d36';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 6;

const PALETTE = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#ec4899','#14b8a6','#a855f7','#f97316','#06b6d4','#84cc16','#eab308'];

// === KPIs ===
document.getElementById('kpi-posts').textContent = D.kpis.total_posts.toLocaleString();
document.getElementById('kpi-stories').textContent = D.kpis.total_stories.toLocaleString();

// === SIDEBAR NAV ===
const sections = [
  { id:'hero', label:'Snapshot', num:'01' },
  { id:'funnel', label:'Embudo de 4 capas', num:'02' },
  { id:'temporal', label:'Evolución temporal', num:'03' },
  { id:'calendar', label:'Calendario', num:'04' },
  { id:'mix', label:'Mix estratégico', num:'05' },
  { id:'performance', label:'Performance', num:'06' },
  { id:'top-posts', label:'Top performers', num:'07' },
  { id:'carousels-deep', label:'Carruseles deep', num:'08' },
  { id:'stories-vi', label:'Video vs Imagen', num:'09' },
  { id:'stories-gallery', label:'Stories galería', num:'10' },
  { id:'hooks', label:'Hooks', num:'11' },
  { id:'arcs', label:'Arcos narrativos', num:'12' },
  { id:'benchmarks', label:'Benchmarks', num:'13' },
  { id:'length-corr', label:'Correlaciones longitud', num:'14' },
  { id:'topic-cross', label:'Topic Crossroads', num:'15' },
  { id:'caption-strategy', label:'Caption Strategy', num:'16' },
  { id:'percentiles', label:'Percentiles', num:'17' },
  { id:'topics', label:'Topics & Tools', num:'18' },
  { id:'whitespace', label:'White Space', num:'19' },
  { id:'radar', label:'Radar 12D', num:'20' },
  { id:'maturity', label:'Maturity Stage', num:'21' },
  { id:'truths', label:'5 Verdades', num:'22' },
];

const nav = document.getElementById('nav');
sections.forEach(s => {
  const btn = document.createElement('a');
  btn.href = `#${s.id}`;
  btn.className = 'nav-btn group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-200 hover:bg-ink-800 transition';
  btn.dataset.section = s.id;
  btn.innerHTML = `
    <span class="nav-num text-[10px] font-mono bg-ink-800 text-ink-400 px-1.5 py-0.5 rounded">${s.num}</span>
    <span class="flex-1">${s.label}</span>
  `;
  nav.appendChild(btn);
});

// active section on scroll
const navLinks = document.querySelectorAll('.nav-btn');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`[data-section="${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-30% 0px -60% 0px' });

document.querySelectorAll('section').forEach(s => observer.observe(s));

// === FUNNEL CHART (doughnut) ===
new Chart(document.getElementById('funnelChart'), {
  type: 'doughnut',
  data: {
    labels: ['Atracción · 695 posts', 'Confianza · 139 stories', 'Cierre · 11 imgs', 'Conversión · 95 menciones'],
    datasets: [{
      data: [695, 139, 11, 95],
      backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'],
      borderColor: '#18181d',
      borderWidth: 2,
    }]
  },
  options: {
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.label}` }
      }
    }
  }
});

// Layer toggle
window.toggleLayer = (n) => {
  const el = document.getElementById(`layer-${n}`);
  el.classList.toggle('hidden');
};

// === TEMPORAL CHARTS ===
const monthlyLabels = D.monthly.map(m => m.label);
const monthlyPosts = D.monthly.map(m => m.posts);
const monthlyVideos = D.monthly.map(m => m.videos);
const monthlyCarousels = D.monthly.map(m => m.carousels);
const monthlyPlays = D.monthly.map(m => m.plays_med);
const monthlyComments = D.monthly.map(m => m.comments_med);
const monthlyLikes = D.monthly.map(m => m.likes_med);

new Chart(document.getElementById('monthlyVolumeChart'), {
  type: 'bar',
  data: {
    labels: monthlyLabels,
    datasets: [
      { label: 'Reels', data: monthlyVideos, backgroundColor: '#10b981', stack: 'a', borderRadius: 4 },
      { label: 'Carruseles', data: monthlyCarousels, backgroundColor: '#3b82f6', stack: 'a', borderRadius: 4 },
    ]
  },
  options: {
    plugins: { legend: { position: 'top', align: 'end' } },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, grid: { color: '#22222a' }, ticks: { callback: v => v } }
    }
  }
});

new Chart(document.getElementById('monthlyEngagementChart'), {
  type: 'line',
  data: {
    labels: monthlyLabels,
    datasets: [
      { label: 'Plays mediana', data: monthlyPlays, borderColor: '#10b981', backgroundColor: '#10b98133', tension: 0.3, yAxisID: 'y1', fill: false, pointRadius: 4 },
      { label: 'Likes mediana', data: monthlyLikes, borderColor: '#3b82f6', backgroundColor: '#3b82f633', tension: 0.3, yAxisID: 'y2', fill: false, pointRadius: 4 },
      { label: 'Comments mediana', data: monthlyComments, borderColor: '#f59e0b', backgroundColor: '#f59e0b33', tension: 0.3, yAxisID: 'y2', fill: false, pointRadius: 4 },
    ]
  },
  options: {
    plugins: { legend: { position: 'top', align: 'end' } },
    scales: {
      x: { grid: { display: false } },
      y1: { type: 'linear', position: 'left', grid: { color: '#22222a' }, title: { display: true, text: 'Plays', color: '#10b981' } },
      y2: { type: 'linear', position: 'right', grid: { display: false }, title: { display: true, text: 'Likes / Comments', color: '#3b82f6' } }
    }
  }
});

// === CALENDAR HEATMAP ===
function buildHeatmap(containerId, dataMap, colorBase, maxKey) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!dataMap.length) return;

  const dates = dataMap.map(d => d.date);
  const minDate = new Date(dates[0]);
  const maxDate = new Date(dates[dates.length - 1]);
  // Find max value for normalization
  const maxVal = Math.max(...dataMap.map(d => d[maxKey] || 0)) || 1;

  // Build a map for quick lookup
  const valueMap = {};
  dataMap.forEach(d => { valueMap[d.date] = d[maxKey] || 0; });

  // Generate all days from min to max
  const days = [];
  const cur = new Date(minDate);
  cur.setDate(cur.getDate() - cur.getDay()); // align to sunday
  while (cur <= maxDate) {
    const iso = cur.toISOString().slice(0, 10);
    days.push({ date: iso, value: valueMap[iso] || 0, dow: cur.getDay() });
    cur.setDate(cur.getDate() + 1);
  }

  // Group into weeks (columns)
  const weeks = [];
  let week = [];
  days.forEach(d => {
    week.push(d);
    if (d.dow === 6) { weeks.push(week); week = []; }
  });
  if (week.length) weeks.push(week);

  // CSS grid: rows = 7 days, cols = N weeks
  container.style.gridTemplateColumns = `repeat(${weeks.length}, 12px)`;
  container.style.gridTemplateRows = 'repeat(7, 12px)';
  container.style.gridAutoFlow = 'column';

  // Day labels on first column? skip for compact look. Just render cells.
  weeks.forEach((wk, wi) => {
    // Pad missing days (start of first week)
    for (let i = 0; i < 7; i++) {
      const day = wk.find(d => d.dow === i);
      const cell = document.createElement('div');
      cell.style.gridColumn = wi + 1;
      cell.style.gridRow = i + 1;
      cell.className = 'heatmap-cell rounded-sm';
      if (!day) {
        cell.style.background = 'transparent';
      } else {
        const intensity = day.value / maxVal;
        const opacity = day.value === 0 ? 0 : Math.max(0.2, intensity);
        if (day.value === 0) {
          cell.style.background = '#22222a';
        } else {
          // tailwind colors as hex
          const colorMap = {
            'green': '#10b981',
            'purple': '#8b5cf6'
          };
          cell.style.background = colorMap[colorBase];
          cell.style.opacity = opacity.toFixed(2);
        }
        cell.title = `${day.date} · ${day.value} ${maxKey}`;
      }
      container.appendChild(cell);
    }
  });

  // Add month labels above
  const monthLabels = document.createElement('div');
  monthLabels.style.gridColumn = '1 / -1';
  monthLabels.style.gridRow = '0';
  monthLabels.style.display = 'flex';
  monthLabels.style.justifyContent = 'space-between';
  monthLabels.style.color = '#5a5a68';
  monthLabels.style.fontSize = '10px';
  monthLabels.style.marginBottom = '4px';
}

buildHeatmap('postsHeatmap', D.calendar, 'green', 'posts');
buildHeatmap('storiesHeatmap', D.calendar, 'purple', 'stories');

// === MIX CHARTS (donuts) ===
function donutChart(canvasId, dataObj, opts = {}) {
  const labels = Object.keys(dataObj);
  const values = Object.values(dataObj);
  const total = values.reduce((a,b)=>a+b,0);
  return new Chart(document.getElementById(canvasId), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: PALETTE.slice(0, labels.length),
        borderColor: '#18181d',
        borderWidth: 2,
      }]
    },
    options: {
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 8, padding: 6, font: { size: 10 } } },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} (${(ctx.parsed/total*100).toFixed(0)}%)` }
        }
      }
    }
  });
}

donutChart('postsPillarChart', D.mix.posts_pillar);
donutChart('postsPurposeChart', D.mix.posts_purpose);
donutChart('postsAwarenessChart', D.mix.posts_awareness);
donutChart('storiesCategoryChart', D.mix.stories_category);
donutChart('storiesFunnelChart', D.mix.stories_funnel);
donutChart('storiesEmotionChart', D.mix.stories_emotion);

// === ARCH PLAYS BAR ===
const archSorted = [...D.arch_perf].sort((a,b) => b.plays_med - a.plays_med);
new Chart(document.getElementById('archPlaysChart'), {
  type: 'bar',
  data: {
    labels: archSorted.map(a => a.archetype),
    datasets: [{
      label: 'Plays mediana',
      data: archSorted.map(a => a.plays_med),
      backgroundColor: archSorted.map((a, i) => i < 3 ? '#10b981' : '#3b82f6'),
      borderRadius: 4,
    }]
  },
  options: {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#22222a' }, ticks: { callback: v => v >= 1000 ? (v/1000).toFixed(0)+'K' : v } },
      y: { grid: { display: false } }
    }
  }
});

const archByUses = [...D.arch_perf].sort((a,b) => b.uses - a.uses);
new Chart(document.getElementById('archUsesChart'), {
  type: 'bar',
  data: {
    labels: archByUses.map(a => a.archetype),
    datasets: [{
      label: 'Veces usado',
      data: archByUses.map(a => a.uses),
      backgroundColor: archByUses.map(a => a.uses > 100 ? '#f59e0b' : a.uses < 15 ? '#ef4444' : '#3b82f6'),
      borderRadius: 4,
    }]
  },
  options: {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#22222a' } },
      y: { grid: { display: false } }
    }
  }
});

// === STORIES VIDEO vs IMAGE TABLE ===
const viTable = document.getElementById('viCompareTable');
D.vi_compare.metrics.forEach(m => {
  let diff = '';
  let diffColor = 'text-ink-300';
  if (m.video > 0 && m.image > 0) {
    const ratio = m.image / m.video;
    if (ratio >= 1.5) { diff = `${ratio.toFixed(1)}× más en imagen`; diffColor = 'text-warn-500'; }
    else if (ratio <= 0.66) { diff = `${(1/ratio).toFixed(1)}× más en video`; diffColor = 'text-info-500'; }
    else diff = '≈ similar';
  } else if (m.image > m.video) {
    diff = 'solo en imagen';
    diffColor = 'text-warn-500';
  } else if (m.video > m.image) {
    diff = 'solo en video';
    diffColor = 'text-info-500';
  }

  const maxVal = Math.max(m.video, m.image, 1);
  const videoBar = (m.video / maxVal * 100);
  const imageBar = (m.image / maxVal * 100);

  const row = document.createElement('div');
  row.className = 'grid grid-cols-12 items-center gap-2';
  row.innerHTML = `
    <div class="col-span-4 text-sm">${m.label}</div>
    <div class="col-span-3">
      <div class="flex items-center gap-2 justify-end">
        <span class="text-xs text-ink-300 stat-num">${m.video}${m.unit}</span>
        <div class="w-20 h-1.5 bg-ink-700 rounded-full overflow-hidden">
          <div class="h-full bg-info-500 rounded-full" style="width:${videoBar}%"></div>
        </div>
      </div>
    </div>
    <div class="col-span-3">
      <div class="flex items-center gap-2 justify-end">
        <span class="text-xs text-ink-300 stat-num">${m.image}${m.unit}</span>
        <div class="w-20 h-1.5 bg-ink-700 rounded-full overflow-hidden">
          <div class="h-full bg-warn-500 rounded-full" style="width:${imageBar}%"></div>
        </div>
      </div>
    </div>
    <div class="col-span-2 text-xs text-right ${diffColor} font-medium">${diff}</div>
  `;
  viTable.appendChild(row);
});

// === HOOK TEMPLATES ===
const hookContainer = document.getElementById('hookTemplates');
D.hook_templates.forEach((h, i) => {
  const card = document.createElement('div');
  card.className = 'bg-ink-800 rounded-xl p-5 border border-ink-700 hover:border-purple-600/50 transition';
  card.innerHTML = `
    <div class="flex items-center gap-2 mb-3">
      <div class="text-xs font-mono text-purple-500 bg-purple-600/20 px-2 py-0.5 rounded">H${String(i+1).padStart(2,'0')}</div>
      <div class="text-xs text-ink-400">CR esperado <b class="text-accent-500 stat-num">${h.cr}%</b></div>
    </div>
    <div class="font-bold mb-2">${h.name}</div>
    <div class="text-xs text-ink-300 font-mono bg-ink-900 p-2 rounded mb-2">${h.template}</div>
    <div class="text-sm text-ink-200 italic">"${h.ejemplo}"</div>
    <div class="text-xs text-ink-400 mt-2">Frecuencia: ${h.uses}</div>
  `;
  hookContainer.appendChild(card);
});

// === ARCS BAR ===
new Chart(document.getElementById('arcsChart'), {
  type: 'bar',
  data: {
    labels: D.arcs.map(a => a.arc),
    datasets: [{
      label: 'Stories en el arco',
      data: D.arcs.map(a => a.stories),
      backgroundColor: D.arcs.map((a, i) => i < 3 ? '#10b981' : '#8b5cf6'),
      borderRadius: 4,
    }]
  },
  options: {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#22222a' } },
      y: { grid: { display: false }, ticks: { font: { size: 10 } } }
    }
  }
});

// === TOPICS / TOOLS / PAINS LISTS ===
function renderList(containerId, items, key, valueKey) {
  const container = document.getElementById(containerId);
  const max = Math.max(...items.map(x => x[valueKey]));
  items.forEach(item => {
    const pct = (item[valueKey] / max * 100);
    const row = document.createElement('div');
    row.innerHTML = `
      <div class="flex items-center justify-between text-xs mb-1">
        <span class="text-ink-200 truncate">${item[key]}</span>
        <span class="text-ink-400 stat-num ml-2">${item[valueKey]}</span>
      </div>
      <div class="h-1 bg-ink-700 rounded-full overflow-hidden">
        <div class="h-full bg-accent-500 rounded-full" style="width:${pct}%"></div>
      </div>
    `;
    container.appendChild(row);
  });
}

renderList('topTopicsList', D.top_topics.slice(0, 12), 'topic', 'count');
renderList('toolsList', D.tools, 'tool', 'count');
renderList('painsList', D.top_pains, 'pain', 'count');

// === TOP POSTS · TABS WITH VISUAL CARDS ===
function fmt(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(0) + 'K';
  return n.toString();
}

function renderTopPosts(tab) {
  const dataMap = {
    'viral': D.top_performers.top_reels_viral,
    'cr': D.top_performers.top_reels_cr,
    'carouselsLikes': D.top_performers.top_carousels_likes,
    'carouselsComments': D.top_performers.top_carousels_comments,
  };
  const items = dataMap[tab] || [];
  const grid = document.getElementById('topPostsGrid');
  grid.innerHTML = '';
  items.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'post-card';
    const metricDisplay = p.metric_label === 'plays' ? fmt(p.metric_value) :
                          p.metric_label === 'CR%' ? p.metric_value + '%' :
                          fmt(p.metric_value);
    const metricLabelDisplay = p.metric_label === 'plays' ? '👁' :
                                p.metric_label === 'CR%' ? '🎯' :
                                p.metric_label === 'likes' ? '❤️' : '💬';
    card.innerHTML = `
      <div class="post-thumb">
        <img src="${p.thumb}" alt="${(p.alt || '').replace(/"/g,'&quot;')}" loading="lazy" onerror="this.style.opacity=0.2;this.alt='No thumb'" />
        <div class="rank-badge">#${p.rank}</div>
        <div class="metric-badge">${metricLabelDisplay} ${metricDisplay}</div>
      </div>
      <div class="body">
        <div class="text-xs text-ink-400 stat-num">${p.timestamp}</div>
        <div class="text-sm font-medium text-ink-100 line-clamp-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${p.hook_text || p.alt || p.caption.slice(0,80) || 'Sin hook'}</div>
        <div class="text-xs text-ink-300 mt-auto flex flex-wrap gap-1">
          ${p.archetype ? `<span class="bg-ink-700 px-1.5 py-0.5 rounded text-[10px]">${p.archetype}</span>` : ''}
          ${p.cta_keyword ? `<span class="bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded text-[10px]">${p.cta_keyword}</span>` : ''}
        </div>
        <div class="text-[10px] text-ink-400 stat-num mt-1">
          ${fmt(p.plays)}p · ${fmt(p.likes)}❤ · ${fmt(p.comments)}💬 · CR ${p.cr}%
        </div>
      </div>
      <div class="links">
        <a href="${p.post_url}" target="_blank" class="link-ig">📷 Instagram</a>
        <a href="${p.airtable_url}" target="_blank" class="link-at" title="Ver en Airtable">AT</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

document.querySelectorAll('#topPostsTabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#topPostsTabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTopPosts(btn.dataset.tab);
  });
});
renderTopPosts('viral');

// === CAROUSEL DEEP DIVE CHARTS ===
new Chart(document.getElementById('carouselArchChart'), {
  type: 'doughnut',
  data: {
    labels: Object.keys(D.carousel_analysis.archetypes),
    datasets: [{
      data: Object.values(D.carousel_analysis.archetypes),
      backgroundColor: PALETTE.slice(0, Object.keys(D.carousel_analysis.archetypes).length),
      borderColor: '#18181d', borderWidth: 2,
    }]
  },
  options: {
    cutout: '55%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, padding: 5, font: { size: 10 } } } }
  }
});

new Chart(document.getElementById('carouselPillarChart'), {
  type: 'doughnut',
  data: {
    labels: Object.keys(D.carousel_analysis.pillars),
    datasets: [{
      data: Object.values(D.carousel_analysis.pillars),
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderColor: '#18181d', borderWidth: 2,
    }]
  },
  options: {
    cutout: '55%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, padding: 5, font: { size: 10 } } } }
  }
});

// Top 4 carousels with deep analysis
function renderTopCarouselsAnalysis() {
  const top4 = D.top_performers.top_carousels_comments.slice(0, 4);
  const container = document.getElementById('topCarouselsAnalysis');
  top4.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'bg-ink-800 rounded-xl border border-ink-700 overflow-hidden';
    const reasonsWhy = analyzeCarousel(c);
    card.innerHTML = `
      <div class="grid grid-cols-5 gap-0">
        <div class="col-span-2 carousel-card-thumb">
          <img src="${c.thumb}" alt="" loading="lazy" onerror="this.style.opacity=0.2" />
        </div>
        <div class="col-span-3 p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-mono text-ink-400 stat-num">#${c.rank} · ${c.timestamp}</span>
            <span class="text-xs font-bold text-accent-500 stat-num">💬 ${fmt(c.comments)}</span>
          </div>
          <div class="text-sm font-semibold text-ink-100 mb-2 leading-tight" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${c.hook_text || c.alt || c.caption.slice(0,150)}</div>
          <div class="text-[11px] text-ink-300 mb-3 stat-num">
            ❤️ ${fmt(c.likes)} · 💬 ${fmt(c.comments)} · CR ${c.cr}%
          </div>
          <div class="text-[11px] text-ink-200 mb-3 leading-relaxed"><b class="text-accent-500">Por qué funciona:</b> ${reasonsWhy}</div>
          <div class="flex gap-2 flex-wrap mb-2">
            ${c.archetype ? `<span class="bg-ink-700 px-2 py-0.5 rounded text-[10px]">${c.archetype}</span>` : ''}
            ${c.purpose ? `<span class="bg-info-600/20 text-info-500 px-2 py-0.5 rounded text-[10px]">${c.purpose}</span>` : ''}
            ${c.topic ? `<span class="bg-purple-600/20 text-purple-500 px-2 py-0.5 rounded text-[10px]">${c.topic}</span>` : ''}
          </div>
          <div class="flex gap-2">
            <a href="${c.post_url}" target="_blank" class="text-[10px] px-2 py-1 rounded bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold">Ver en Instagram →</a>
            <a href="${c.airtable_url}" target="_blank" class="text-[10px] px-2 py-1 rounded bg-ink-700 text-ink-200">Airtable</a>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function analyzeCarousel(c) {
  // Heuristic-based analysis based on the carousel data
  const reasons = [];
  if (c.archetype === 'antes_despues') reasons.push('formato antes/después que muestra transformación visible');
  if (c.archetype === 'lista_retrospectiva') reasons.push('lista numerada que invita a guardar y compartir');
  if (c.archetype === 'utilitario_herramientas') reasons.push('contenido utilitario con stack de herramientas concreto');
  if (c.archetype === 'noticias_actualizaciones') reasons.push('actualización relevante y oportuna del nicho');
  if (c.archetype === 'educativo_negativo') reasons.push('encuadre negativo que activa la objeción del avatar');
  if (c.archetype === 'versus_comparacion') reasons.push('comparación lado a lado que simplifica la decisión');
  if (c.cta_keyword) reasons.push(`CTA con keyword "${c.cta_keyword}" activa flow ManyChat`);
  if (c.purpose === 'venta') reasons.push('propósito de venta directa con prueba social');
  if (c.purpose === 'valor') reasons.push('alto valor educativo que genera saves y shares');
  if (c.topic && c.topic.includes('caso')) reasons.push('caso de éxito específico con cifras verificables');
  if (c.cr > 5) reasons.push(`CR de ${c.cr}% (15× sobre el promedio del feed)`);
  return reasons.length ? reasons.slice(0, 3).join(' + ') + '.' : 'Combinación de hook fuerte + valor entregable + estructura escaneable.';
}

renderTopCarouselsAnalysis();

// === STORIES GALLERY BY CATEGORY ===
function renderStoriesGallery(category) {
  const items = D.stories_by_category[category] || [];
  const grid = document.getElementById('storiesGallery');
  grid.innerHTML = '';
  items.forEach(s => {
    const card = document.createElement('div');
    card.className = 'post-card';
    const ctTag = s.content_type === 'image' ? '🖼️ Imagen' : '📹 Video';
    const ctColor = s.content_type === 'image' ? 'bg-warn-600/30 text-warn-500' : 'bg-purple-600/30 text-purple-500';
    card.innerHTML = `
      <div class="post-thumb">
        <img src="${s.thumb}" alt="" loading="lazy" onerror="this.style.opacity=0.2" />
        <div class="rank-badge">${s.published_at}</div>
        <div class="metric-badge" style="background:rgba(139,92,246,0.95);">${s.funnel_stage || '-'}</div>
      </div>
      <div class="body">
        <div class="flex items-center gap-2 text-[10px]">
          <span class="${ctColor} px-1.5 py-0.5 rounded">${ctTag}</span>
          ${s.emotion ? `<span class="bg-ink-700 px-1.5 py-0.5 rounded">${s.emotion}</span>` : ''}
        </div>
        <div class="text-xs font-medium text-ink-100" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${s.hook_text || s.story_text.slice(0,100)}</div>
        <div class="text-[10px] text-ink-300" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${s.story_summary}</div>
        ${s.arc ? `<div class="text-[10px] text-purple-500 mt-1">📚 ${s.arc}</div>` : ''}
      </div>
      <div class="links">
        ${s.post_url ? `<a href="${s.post_url}" target="_blank" class="link-ig">📷 Instagram</a>` : '<div class="flex-1"></div>'}
        <a href="${s.airtable_url}" target="_blank" class="link-at" title="Ver en Airtable">AT</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Build category tabs
const catTabs = document.getElementById('storiesCatTabs');
const cats = Object.keys(D.stories_by_category).sort((a,b) => D.stories_by_category[b].length - D.stories_by_category[a].length);
cats.forEach((cat, i) => {
  const btn = document.createElement('button');
  btn.dataset.cat = cat;
  btn.className = `tab-btn ${i===0?'active':''} px-3 py-1.5 rounded-lg text-xs font-medium`;
  btn.textContent = `${cat} (${D.stories_by_category[cat].length})`;
  btn.addEventListener('click', () => {
    catTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderStoriesGallery(cat);
  });
  catTabs.appendChild(btn);
});
if (cats.length) renderStoriesGallery(cats[0]);

// === BENCHMARKS ===
function renderBenchmark(containerId, items, unit = '') {
  const container = document.getElementById(containerId);
  const max = Math.max(...items.map(x => x.value));
  items.forEach(item => {
    const pct = (item.value / max * 100);
    const colorMap = {
      'accent': 'bg-accent-500',
      'info': 'bg-info-500',
      'warn': 'bg-warn-500',
      'ink': 'bg-ink-500',
    };
    const isHighlight = item.color === 'accent' || item.color === 'warn' || item.color === 'info';
    const row = document.createElement('div');
    row.innerHTML = `
      <div class="flex items-center justify-between text-xs mb-1">
        <span class="${isHighlight ? 'text-ink-100 font-semibold' : 'text-ink-300'}">${item.label}</span>
        <span class="${isHighlight ? 'text-ink-100 font-semibold' : 'text-ink-400'} stat-num">${item.value}${unit}</span>
      </div>
      <div class="h-2 bg-ink-700 rounded-full overflow-hidden">
        <div class="h-full ${colorMap[item.color] || 'bg-ink-500'} rounded-full" style="width:${pct}%"></div>
      </div>
    `;
    container.appendChild(row);
  });
}

renderBenchmark('bm_cr', D.benchmarks.comment_rate, '%');
renderBenchmark('bm_pw', D.benchmarks.posts_per_week, '');
renderBenchmark('bm_er', D.benchmarks.engagement_rate, '%');

// === LENGTH CORRELATIONS (4 charts) ===
function lengthChart(id, dataArr, xField, yField, label, color) {
  new Chart(document.getElementById(id), {
    type: 'bar',
    data: {
      labels: dataArr.map(d => d.bucket),
      datasets: [{
        label: label,
        data: dataArr.map(d => d[yField]),
        backgroundColor: color,
        borderRadius: 4,
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterBody: (items) => {
              const idx = items[0].dataIndex;
              return 'n = ' + dataArr[idx].count + ' posts';
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: '#22222a' },
          ticks: { callback: v => v >= 1000 ? (v/1000).toFixed(0) + 'K' : v }
        }
      }
    }
  });
}
lengthChart('durationChart', D.duration_perf, 'bucket', 'plays_med', 'Plays mediana', '#10b981');
lengthChart('captionLengthChart', D.caption_perf, 'bucket', 'plays_med', 'Plays mediana', '#3b82f6');
lengthChart('hookLengthChart', D.hook_perf_len, 'bucket', 'cr_med', 'CR mediana %', '#8b5cf6');
lengthChart('slidesChart', D.slides_perf, 'bucket', 'comments_med', 'Comments mediana', '#f59e0b');

// === TOPIC CROSSROADS (scatter) ===
const quadColors = { pillar: '#10b981', mina: '#f59e0b', saturated: '#3b82f6', experiment: '#5a5a68' };
const ts = D.topic_scatter.scatter;
new Chart(document.getElementById('topicScatter'), {
  type: 'scatter',
  data: {
    datasets: [
      { label: 'Pillar', data: ts.filter(t=>t.quadrant==='pillar').map(t=>({x: t.count, y: t.cr_med, topic: t.topic, plays: t.plays_med})), backgroundColor: '#10b981', pointRadius: 6 },
      { label: 'Mina de oro', data: ts.filter(t=>t.quadrant==='mina').map(t=>({x: t.count, y: t.cr_med, topic: t.topic, plays: t.plays_med})), backgroundColor: '#f59e0b', pointRadius: 6 },
      { label: 'Saturado', data: ts.filter(t=>t.quadrant==='saturated').map(t=>({x: t.count, y: t.cr_med, topic: t.topic, plays: t.plays_med})), backgroundColor: '#3b82f6', pointRadius: 5 },
      { label: 'Experimento', data: ts.filter(t=>t.quadrant==='experiment').map(t=>({x: t.count, y: t.cr_med, topic: t.topic, plays: t.plays_med})), backgroundColor: '#5a5a68', pointRadius: 4 },
    ]
  },
  options: {
    plugins: {
      legend: { position: 'top', align: 'end' },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.raw.topic}: ${ctx.raw.x} usos, ${ctx.raw.y}% CR, ${(ctx.raw.plays/1000).toFixed(0)}K plays med`
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Frecuencia (posts con este topic)', color: '#8b8b99' }, grid: { color: '#22222a' } },
      y: { title: { display: true, text: 'CR mediana %', color: '#8b8b99' }, grid: { color: '#22222a' } }
    }
  }
});

document.getElementById('qSum-pillar').textContent = D.topic_scatter.summary.pillar;
document.getElementById('qSum-mina').textContent = D.topic_scatter.summary.mina;
document.getElementById('qSum-saturated').textContent = D.topic_scatter.summary.saturated;
document.getElementById('qSum-experiment').textContent = D.topic_scatter.summary.experiment;

// Top minas and pillars
const minas = ts.filter(t => t.quadrant === 'mina').sort((a,b) => b.cr_med - a.cr_med).slice(0,10);
const pillars = ts.filter(t => t.quadrant === 'pillar').sort((a,b) => b.cr_med - a.cr_med).slice(0,10);

function renderTopicList(containerId, items, color) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach((t,i) => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between gap-2 py-1 border-b border-ink-700';
    row.innerHTML = `
      <span class="text-ink-200 truncate" style="max-width: 200px">${i+1}. ${t.topic}</span>
      <span class="text-ink-300 text-[10px] stat-num whitespace-nowrap">${t.count}× · ${t.cr_med}% CR · ${fmt(t.plays_med)}p</span>
    `;
    container.appendChild(row);
  });
}
renderTopicList('minaList', minas, '#f59e0b');
renderTopicList('pillarList', pillars, '#10b981');

// === CAPTION STRATEGY ===
const cs = D.caption_strategy;
new Chart(document.getElementById('captionDist'), {
  type: 'bar',
  data: {
    labels: Object.keys(cs.lengths_dist),
    datasets: [{
      label: 'Posts',
      data: Object.values(cs.lengths_dist),
      backgroundColor: ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444'],
      borderRadius: 4,
    }]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#22222a' } }
    }
  }
});

new Chart(document.getElementById('keywordsChart'), {
  type: 'bar',
  data: {
    labels: cs.top_keywords.slice(0,12).map(k => k.keyword),
    datasets: [
      { label: 'Veces usado', data: cs.top_keywords.slice(0,12).map(k => k.count), backgroundColor: '#3b82f6', borderRadius: 4, yAxisID: 'y1' },
      { label: 'Plays mediana', data: cs.top_keywords.slice(0,12).map(k => k.plays_med), backgroundColor: '#10b981', borderRadius: 4, yAxisID: 'y2', type: 'line', borderColor: '#10b981', borderWidth: 2, pointRadius: 4, fill: false }
    ]
  },
  options: {
    plugins: { legend: { position: 'top', align: 'end' } },
    scales: {
      x: { grid: { display: false } },
      y1: { type: 'linear', position: 'left', title: { display: true, text: 'Veces' }, grid: { color: '#22222a' } },
      y2: { type: 'linear', position: 'right', title: { display: true, text: 'Plays' }, grid: { display: false }, ticks: { callback: v => v >= 1000 ? (v/1000).toFixed(0)+'K' : v } }
    }
  }
});

// === PERFORMANCE PERCENTILES ===
function renderPctList(containerId, data, formatFn) {
  const container = document.getElementById(containerId);
  const labels = ['P50 (mediana)','P75','P90','P95','P99 (top 1%)','MAX'];
  const keys = ['p50','p75','p90','p95','p99','max'];
  const colors = ['ink','info','warn','accent','accent','danger'];
  const max = data.max;
  keys.forEach((k,i) => {
    const v = data[k];
    const pct = max ? (v/max*100) : 0;
    const colorMap = { 'ink': 'bg-ink-500', 'info': 'bg-info-500', 'warn': 'bg-warn-500', 'accent': 'bg-accent-500', 'danger': 'bg-danger-500' };
    const row = document.createElement('div');
    row.innerHTML = `
      <div class="flex items-center justify-between text-[11px] mb-1">
        <span class="text-ink-300">${labels[i]}</span>
        <span class="text-ink-100 stat-num font-medium">${formatFn(v)}</span>
      </div>
      <div class="h-1.5 bg-ink-700 rounded-full overflow-hidden">
        <div class="h-full ${colorMap[colors[i]]}" style="width:${pct}%"></div>
      </div>
    `;
    container.appendChild(row);
  });
}
renderPctList('pct_plays', D.percentiles.plays, fmt);
renderPctList('pct_likes', D.percentiles.likes, fmt);
renderPctList('pct_comments', D.percentiles.comments, fmt);
renderPctList('pct_cr', D.percentiles.cr, v => v + '%');

// Plays histogram
new Chart(document.getElementById('playsHist'), {
  type: 'bar',
  data: {
    labels: D.plays_histogram.map(b => `${fmt(b.min)}-${fmt(b.max)}`),
    datasets: [{
      label: 'Posts',
      data: D.plays_histogram.map(b => b.count),
      backgroundColor: '#10b981',
      borderRadius: 3,
    }]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: { grid: { color: '#22222a' } }
    }
  }
});

// === RADAR DE 12 DIMENSIONES ===
new Chart(document.getElementById('radarChart'), {
  type: 'radar',
  data: {
    labels: D.dimensions.map(d => d.name),
    datasets: [
      { label: 'Top creators (benchmark)', data: D.dimensions.map(d => d.benchmark_top), backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6', borderWidth: 1.5, pointRadius: 3, pointBackgroundColor: '#3b82f6' },
      { label: 'Promedio industria', data: D.dimensions.map(d => d.benchmark_avg), backgroundColor: 'rgba(245,158,11,0.10)', borderColor: '#f59e0b', borderWidth: 1.5, pointRadius: 3, pointBackgroundColor: '#f59e0b' },
      { label: 'Ramiro Cubria', data: D.dimensions.map(d => d.ramiro), backgroundColor: 'rgba(16,185,129,0.30)', borderColor: '#10b981', borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#10b981' },
    ]
  },
  options: {
    plugins: {
      legend: { position: 'top', align: 'end' },
      tooltip: {
        callbacks: {
          afterLabel: (ctx) => {
            const dim = D.dimensions[ctx.dataIndex];
            return dim.description;
          }
        }
      }
    },
    scales: {
      r: {
        min: 0, max: 100,
        grid: { color: '#2d2d36' },
        angleLines: { color: '#2d2d36' },
        pointLabels: { color: '#c5c5cf', font: { size: 11 } },
        ticks: { color: '#5a5a68', backdropColor: 'transparent', stepSize: 25 }
      }
    }
  }
});

// Dimensions list with bars
const dimensionsListEl = document.getElementById('dimensionsList');
D.dimensions.forEach(d => {
  const isStrong = d.ramiro >= 80;
  const isWeak = d.ramiro < 50;
  const colorClass = isStrong ? 'bg-accent-500' : isWeak ? 'bg-danger-500' : 'bg-info-500';
  const card = document.createElement('div');
  card.className = 'bg-ink-800 rounded-lg p-3 border border-ink-700';
  card.innerHTML = `
    <div class="flex items-center justify-between text-xs mb-1.5">
      <span class="text-ink-100 font-medium">${d.name}</span>
      <span class="stat-num font-bold ${isStrong?'text-accent-500':isWeak?'text-danger-500':'text-info-500'}">${d.ramiro}/100</span>
    </div>
    <div class="h-1 bg-ink-700 rounded-full overflow-hidden mb-1.5">
      <div class="h-full ${colorClass}" style="width:${d.ramiro}%"></div>
    </div>
    <div class="text-[10px] text-ink-400">${d.description}</div>
  `;
  dimensionsListEl.appendChild(card);
});

// Overall score and top strengths/gaps
document.getElementById('overallScore').textContent = D.overall_maturity_score + '/100';
const sortedByScore = [...D.dimensions].sort((a,b) => b.ramiro - a.ramiro);
const top3Strengths = sortedByScore.slice(0,3).map(d => `${d.name} (${d.ramiro})`).join(', ');
const top3Gaps = sortedByScore.slice(-3).reverse().map(d => `${d.name} (${d.ramiro})`).join(', ');
document.getElementById('topStrengths').textContent = top3Strengths;
document.getElementById('topGaps').textContent = top3Gaps;

// === MATURITY STAGE ===
const stageList = document.getElementById('stageList');
D.maturity_stages.forEach(s => {
  const card = document.createElement('div');
  const isMatch = s.ramiro_match;
  card.className = `${isMatch ? 'bg-warn-600/15 border-warn-500/50 ring-2 ring-warn-500/30' : 'bg-ink-800 border-ink-700'} rounded-xl p-4 border`;
  card.innerHTML = `
    <div class="text-3xl mb-2">${s.emoji}</div>
    <div class="font-bold text-sm mb-1 ${isMatch ? 'text-warn-500' : 'text-ink-100'}">${s.stage}</div>
    <div class="text-[10px] text-ink-300 leading-relaxed">${s.criteria}</div>
    ${isMatch ? '<div class="text-[10px] text-warn-500 font-bold mt-2">📍 RAMIRO ESTÁ ACÁ</div>' : ''}
  `;
  stageList.appendChild(card);
});

// Ramiro indicators
const indEl = document.getElementById('ramiroIndicators');
D.ramiro_indicators.forEach(ind => {
  const row = document.createElement('div');
  row.className = 'flex items-center justify-between py-2 border-b border-ink-700 last:border-0';
  row.innerHTML = `
    <div class="flex-1">
      <div class="text-xs text-ink-100 font-medium">${ind.indicator}</div>
      <div class="text-[10px] text-ink-400 stat-num">${ind.value}</div>
    </div>
    <span class="text-[10px] px-2 py-1 rounded ${ind.stage.includes('Saturación')||ind.stage.includes('Reinvención') ? 'bg-warn-600/20 text-warn-500' : 'bg-info-600/20 text-info-500'}">${ind.stage}</span>
  `;
  indEl.appendChild(row);
});

// Replace footer date placeholder
document.querySelector('footer p').innerHTML = document.querySelector('footer p').innerHTML.replace('{{date}}', new Date().toISOString().slice(0,10));

console.log('Dashboard ready · Sections:', sections.length, '· Posts:', D.kpis.total_posts, '· Stories:', D.kpis.total_stories);
