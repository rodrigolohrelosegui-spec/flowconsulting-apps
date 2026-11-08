// Plan de Contenido — Rodrigo Lohr / Flow Consulting
// Datos del plan 21 días (3 semanas)

const PILLARS = {
  ilusion: { name: "Ilusión de Apalancamiento", short: "Ilusión", color: "var(--cyan)" },
  casos: { name: "Casos curados con números reales", short: "Casos", color: "var(--cyan-bright)" },
  sistemas: { name: "Sistemas Estúpidamente Simples", short: "Sistemas", color: "var(--cyan-mid)" },
  psicologia: { name: "Psicología del fundador", short: "Psicología", color: "var(--cyan-deep)" },
  filosofia: { name: "Filosofía e Industria", short: "Filosofía", color: "var(--cyan-deeper)" },
};

const KEYWORDS = ["FLOW", "MAPA", "CASO", "SISTEMA", "LIBRE", "LIFESTYLE", "DIAGNOSTICO"];

const PLAN = {
  totals: {
    days: 21,
    pieces: 141,
    reels: 21,
    carruseles: 10,
    stories: 110,
  },
  weeks: [
    {
      n: 1,
      label: "Calibración",
      subtitle: "Testear hooks, identificar qué resuena",
      pieces: { reels: 4, carruseles: 2, stories: 25, total: 31 },
      cadence: "8-10 posts/sem",
      kpi: "30+ posts · CR mediana > 0.5% · Comments del avatar correcto",
      days: [
        {
          date: "1 mayo", weekday: "Lunes",
          focus: "Apertura del posicionamiento",
          slots: [
            { type: "reel", n: 1, pillar: "ilusion", hook: "Hook-C", structure: "Estructura-2", keyword: "SISTEMA", magnet: "Diagnóstico", topic: "Escalar tu negocio te va a quemar — te explico por qué", duration: "60-75s" },
            { type: "carrusel", n: 1, archetype: "noticias_actualizaciones", slides: 4, pillar: "sistemas", keyword: "MAPA", topic: "Lo que cambió en el negocio digital LATAM en 2026" },
            { type: "stories", n: 3, arc: "arc_introduccion", description: "Lifestyle behind-scenes Rodrigo + intro Infinite Flow System + question box" },
          ]
        },
        {
          date: "2 mayo", weekday: "Martes",
          focus: "Arc Mary Carmen (caso #1)",
          slots: [
            { type: "stories", n: 4, arc: "arc_caso_mary_carmen", description: "S1 endeudada → $15K/sem · S2 lo que hizo distinto · S3 números reales con captura · S4 de 7 personas a 1" },
          ]
        },
        {
          date: "3 mayo", weekday: "Miércoles",
          focus: "Caso disecccionado + Stack IA",
          slots: [
            { type: "reel", n: 2, pillar: "casos", hook: "Hook-A", structure: "Estructura-4", keyword: "CASO", magnet: "Lifestyle", topic: "Mary Carmen $15K/sem (caso disecccionado)", duration: "60-90s" },
            { type: "carrusel", n: 2, archetype: "lista_retrospectiva", slides: 5, pillar: "psicologia", keyword: "FLOW", topic: "5 errores que cometí escalando mis primeras ofertas" },
            { type: "stories", n: 4, arc: "arc_caso_mary_carmen", description: "Cierre arc Mary Carmen + question box \"¿Cuántas horas trabajas?\" + lifestyle" },
          ]
        },
        {
          date: "4 mayo", weekday: "Jueves",
          focus: "Behind-scenes + métricas propias",
          slots: [
            { type: "stories", n: 4, arc: "arc_metricas_propias", description: "Rodrigo muestra dashboard real Flow Consulting · predicar con el ejemplo · lifestyle" },
          ]
        },
        {
          date: "5 mayo", weekday: "Viernes",
          focus: "Caso Erika Herrera",
          slots: [
            { type: "reel", n: 3, pillar: "sistemas", hook: "Hook-B", structure: "Estructura-1", keyword: "SISTEMA", magnet: "Diagnóstico", topic: "¿Cómo automatizar tu captación con IA en 30 minutos?", duration: "45-60s" },
            { type: "stories", n: 4, arc: "arc_caso_erika_herrera", description: "Erika 60% margen negativo → 80% rentabilidad · $21K primera semana · sin contratar · 3 movimientos" },
          ]
        },
        {
          date: "6 mayo", weekday: "Sábado",
          focus: "Síndrome del impostor (Erick Gamio)",
          slots: [
            { type: "reel", n: 4, pillar: "psicologia", hook: "Hook-E", structure: "Estructura-3", keyword: "FLOW", magnet: "Diagnóstico", topic: "Cobrar barato no es humildad. Es desalineación. (Erick Gamio precios 50x)", duration: "75-90s" },
            { type: "stories", n: 3, arc: "arc_postergar_quemar", description: "★ EL MÁS CONVERTIDOR · S1 nurturing video · S2 autoridad estadística · S3 IMAGEN urgencia matemática + CTA DIAGNOSTICO", isStar: true },
          ]
        },
        {
          date: "7 mayo", weekday: "Domingo",
          focus: "Lifestyle / descanso",
          slots: [
            { type: "stories", n: 3, arc: "lifestyle_quiet_luxury", description: "Naturaleza + lectura Naval/McKeown + cierre semanal con question box" },
          ]
        },
      ]
    },
    {
      n: 2,
      label: "Consolidación",
      subtitle: "Escalar arcos que rinden, serializar narrativas",
      pieces: { reels: 7, carruseles: 3, stories: 35, total: 45 },
      cadence: "14-16 posts/sem",
      kpi: "60+ posts · P75 plays > 30K · Primeros leads vía DM keyword",
      days: [
        {
          date: "8 mayo", weekday: "Lunes",
          focus: "Doble reel + Stack IA",
          slots: [
            { type: "reel", n: 5, pillar: "ilusion", hook: "Hook-D", structure: "Estructura-3", keyword: "SISTEMA", topic: "Hay una forma de automatizar el 80% de la captación sin gastar más en ads" },
            { type: "reel", n: 6, pillar: "casos", hook: "Hook-A", structure: "Estructura-4", keyword: "CASO", magnet: "Lifestyle", topic: "Caso Daniel Marcos +$350K record histórico Growth Institute" },
            { type: "carrusel", n: 3, archetype: "utilitario_herramientas", slides: 5, pillar: "sistemas", keyword: "SISTEMA", topic: "Stack de IA del Infinite Flow System (Claude + ManyChat + Make + Loom + ChatGPT)" },
            { type: "stories", n: 5, arc: "arc_caso_daniel_marcos", description: "3 video con cifras + 2 stories filosofía con citas Naval/McKeown" },
          ]
        },
        {
          date: "9 mayo", weekday: "Martes",
          focus: "Top N filosofía",
          slots: [
            { type: "reel", n: 7, pillar: "filosofia", hook: "Hook-E", structure: "Estructura-5", keyword: "LIBRE", topic: "Las 3 razones por las que tu negocio factura pero no te libera" },
            { type: "stories", n: 5, arc: "arc_resultados_propios_internos", description: "Rodrigo muestra métricas internas de Flow Consulting + 1 IMAGEN costo oportunidad" },
          ]
        },
        {
          date: "10 mayo", weekday: "Miércoles",
          focus: "Caso Andrés + Versus comparación",
          slots: [
            { type: "reel", n: 8, pillar: "sistemas", hook: "Hook-B", structure: "Estructura-1", keyword: "MAPA", magnet: "Diagnóstico", topic: "¿Cómo agendar 10 calls/semana sin postear todos los días?" },
            { type: "carrusel", n: 4, archetype: "versus_comparacion", slides: 4, pillar: "ilusion", keyword: "FLOW", topic: "Escalar headcount vs Escalar sistema (15 personas/$50K vs 2 personas/$80K)" },
            { type: "stories", n: 5, arc: "arc_caso_andres_mora", description: "Andrés academia de arte sin escalar · ROAS 42x · $60K/mes con menos de $4K en ads + 2 lifestyle" },
          ]
        },
        {
          date: "11 mayo", weekday: "Jueves",
          focus: "Cobrar barato (Erick Gamio)",
          slots: [
            { type: "reel", n: 9, pillar: "psicologia", hook: "Hook-C", structure: "Estructura-2", keyword: "FLOW", magnet: "Lifestyle", topic: "Cobrar barato no es humildad. Es desalineación (Erick Gamio: $147 → $5,000)" },
            { type: "stories", n: 5, arc: "arc_objeciones", description: "Recolectar objeciones del question box anterior y responder 1 por story" },
          ]
        },
        {
          date: "12 mayo", weekday: "Viernes",
          focus: "Caso Omar + Lanzamientos vs Evergreen",
          slots: [
            { type: "reel", n: 10, pillar: "casos", hook: "Hook-A", structure: "Estructura-4", keyword: "CASO", magnet: "Lifestyle", topic: "Caso Omar Cabrera $49K → $150K solo ajustando guión" },
            { type: "carrusel", n: 5, archetype: "educativo_negativo", slides: 5, pillar: "ilusion", keyword: "SISTEMA", topic: "5 cosas que NO funcionan en lanzamientos en 2026" },
            { type: "stories", n: 5, arc: "arc_lanzamientos_vs_evergreen", description: "3 video (problema, contraste, sistema) + 2 IMÁGENES (costo emocional + CTA caso Omar)" },
          ]
        },
        {
          date: "13 mayo", weekday: "Sábado",
          focus: "Caso Joao Guerra (cardiólogo)",
          slots: [
            { type: "reel", n: 11, pillar: "casos", hook: "Hook-A", structure: "Estructura-4", keyword: "CASO", magnet: "Lifestyle", topic: "Joao Guerra $60K-$80K en 2 meses, ROAS 14x (sistema funciona en cualquier industria)" },
            { type: "stories", n: 5, arc: "arc_caso_joao", description: "3 video + 2 behind-scenes Rodrigo workflow" },
          ]
        },
        {
          date: "14 mayo", weekday: "Domingo",
          focus: "Lifestyle + cierre semanal",
          slots: [
            { type: "stories", n: 5, arc: "lifestyle_quiet_luxury", description: "Lifestyle Quiet Luxury + question box semanal para alimentar arcos siguientes" },
          ]
        },
      ]
    },
    {
      n: 3,
      label: "Cadencia industrial",
      subtitle: "Optimizar Topic Crossroads · Primer cierre atribuible al sistema",
      pieces: { reels: 10, carruseles: 5, stories: 50, total: 65 },
      cadence: "18-22 posts/sem",
      kpi: "90+ leads · CR mediana > 1.5% · Primer cliente captado por contenido",
      hito: "Necesita editor dedicado antes de empezar esta semana",
      days: [
        {
          date: "15 mayo", weekday: "Lunes",
          focus: "Manifiesto + Caso Inés €30K",
          slots: [
            { type: "reel", n: 12, pillar: "ilusion", hook: "Hook-C", structure: "Estructura-2", keyword: "LIBRE", topic: "Manifiesto: Más es menos. La industria del scaling te miente." },
            { type: "reel", n: 13, pillar: "casos", hook: "Hook-A", structure: "Estructura-4", keyword: "CASO", topic: "Caso Inés Arroyo €30K en 2 meses tras 7 sin facturar" },
            { type: "carrusel", n: 6, archetype: "noticias_actualizaciones", slides: 5, pillar: "sistemas", keyword: "MAPA", topic: "Lo que viene en IA + marketing en Q3 2026" },
            { type: "stories", n: 7, arc: "arc_caso_ines", description: "3 video + 2 behind-scenes + 1 lifestyle + 1 IMAGEN urgencia" },
          ]
        },
        {
          date: "16 mayo", weekday: "Martes",
          focus: "IA + 4 horas semanales",
          slots: [
            { type: "reel", n: 14, pillar: "sistemas", hook: "Hook-D", structure: "Estructura-3", keyword: "SISTEMA", topic: "Claude + ManyChat ahora pueden agendar calls sin que veas el DM (demo screen)" },
            { type: "reel", n: 15, pillar: "filosofia", hook: "Hook-E", structure: "Estructura-5", keyword: "LIBRE", magnet: "Lifestyle", topic: "Las 4 horas semanales no son una mentira — son una decisión (Tim Ferriss)" },
            { type: "stories", n: 7, arc: "arc_dia_normal_rodrigo", description: "Workflow real con cronómetro · cuánto demora cada parte de su día + 1 lifestyle + 1 IMAGEN ROI" },
          ]
        },
        {
          date: "17 mayo", weekday: "Miércoles",
          focus: "Caso Maryell + Tutorial Diagnóstico",
          slots: [
            { type: "reel", n: 16, pillar: "casos", hook: "Hook-A", structure: "Estructura-4", keyword: "CASO", topic: "Caso Maryell Cisneros $70K/mes (transición espiritualidad)" },
            { type: "reel", n: 17, pillar: "sistemas", hook: "Hook-B", structure: "Estructura-1", keyword: "MAPA", magnet: "Diagnóstico", topic: "¿Cómo crear tu primer Evergreen funnel en 1 semana?" },
            { type: "carrusel", n: 7, archetype: "tutorial_directo", slides: 5, pillar: "sistemas", keyword: "FLOW", topic: "El proceso de Diagnóstico de Infinite Flow paso a paso (conecta con quiz online)" },
            { type: "stories", n: 7, arc: "arc_caso_maryell", description: "3 video + 2 educativo respondiendo objeciones + 2 IMAGEN costo oportunidad" },
          ]
        },
        {
          date: "18 mayo", weekday: "Jueves",
          focus: "Equipo no escala + Caso Julio",
          slots: [
            { type: "reel", n: 18, pillar: "ilusion", hook: "Hook-D", structure: "Estructura-3", keyword: "SISTEMA", topic: "El equipo que no escala: cuándo CONTRATAR mata el negocio" },
            { type: "reel", n: 19, pillar: "casos", hook: "Hook-A", structure: "Estructura-4", keyword: "CASO", topic: "Caso Julio Iero $2K → $75K/mes (agencia de marketing)" },
            { type: "stories", n: 7, arc: "arc_caso_julio", description: "3 video + question box \"¿Cuánta gente tenés en tu equipo?\" + 3 stories educativo respondiendo" },
          ]
        },
        {
          date: "19 mayo", weekday: "Viernes",
          focus: "Top 5 patrones + Lifestyle vs Tradicional",
          slots: [
            { type: "reel", n: 20, pillar: "filosofia", hook: "Hook-E", structure: "Estructura-5", keyword: "LIBRE", magnet: "Lifestyle", topic: "Las 5 cosas que aparecen en TODOS los negocios atrapados" },
            { type: "carrusel", n: 8, archetype: "versus_comparacion", slides: 4, pillar: "filosofia", keyword: "LIBRE", topic: "Lifestyle business vs Empresa tradicional (cifras + lifestyle real)" },
            { type: "stories", n: 7, arc: "arc_filosofia_libertad", description: "3 video con citas Naval/McKeown + 2 lifestyle Quiet Luxury + 2 nurturing" },
          ]
        },
        {
          date: "20 mayo", weekday: "Sábado",
          focus: "Big Domino + Aprendizajes",
          slots: [
            { type: "reel", n: 21, pillar: "sistemas", hook: "Hook-B", structure: "Estructura-1", keyword: "MAPA", magnet: "Diagnóstico", topic: "Cómo identificar tu Big Domino del próximo trimestre" },
            { type: "carrusel", n: 9, archetype: "lista_retrospectiva", slides: 5, pillar: "casos", keyword: "FLOW", topic: "Mis 5 aprendizajes top de los últimos 90 días con clientes" },
            { type: "carrusel", n: 10, archetype: "antes_despues", slides: 4, pillar: "casos", keyword: "CASO", topic: "Antes/después de un cliente real en 90 días (Mary Carmen o Daniel Marcos)" },
            { type: "stories", n: 8, arc: "arc_lifestyle_completo", description: "Lifestyle real (5 stories) + question box + 2 IMÁGENES cierre semanal con costo de oportunidad acumulado" },
          ]
        },
        {
          date: "21 mayo", weekday: "Domingo",
          focus: "Reflexión + Filosofía + ROI semanal",
          slots: [
            { type: "stories", n: 7, arc: "lifestyle_quiet_luxury", description: "4 lifestyle (lectura, gym, naturaleza) + 2 filosóficas con citas (Naval, Tim Ferriss) + 1 IMAGEN ROI semanal con métricas propias" },
          ]
        },
      ]
    },
  ],
  pillarsDist: [
    { pillar: "ilusion", percentage: 40 },
    { pillar: "casos", percentage: 25 },
    { pillar: "sistemas", percentage: 15 },
    { pillar: "psicologia", percentage: 15 },
    { pillar: "filosofia", percentage: 5 },
  ],
  leadMagnets: [
    {
      slug: "lifestyle",
      name: "Lifestyle",
      url: "https://apps.flowconsulting.co/lifestyle/",
      keyword: "LIFESTYLE",
      type: "Long-form HTML interactivo",
      promise: "Cómo Mary Carmen pasó de endeudada a $60K/mes con +80% de ganancia",
      structure: "4 partes: Problema · Rediseño · Proceso · Patrón (6 casos en video)",
      whenToUse: "Reels narrativos · educativos largos · casos de éxito · contenido top de awareness",
      cases: ["Mary Carmen", "Erika Herrera", "Alejandra Ramírez", "Regina Righi", "Inés Arroyo", "Maryell Cisneros"],
    },
    {
      slug: "diagnostico",
      name: "Diagnóstico",
      url: "https://apps.flowconsulting.co/diagnostico/",
      keyword: "DIAGNOSTICO",
      type: "Quiz interactivo · 4 minutos",
      promise: "En 4 min sabés en qué fase del Sistema Infinite Flow estás, cuál es tu Big Domino, y qué mover los próximos 90 días",
      structure: "Captura: Nombre + Email · Entrega: arquetipo + fase + Big Domino + plan 30/60/90",
      whenToUse: "Reels lead-getter técnicos · contenido problem aware · cierre de arcos · urgencia matemática",
      cta: "Agendar llamada de diagnóstico (45 min, sin compromiso)",
    },
  ],
};
