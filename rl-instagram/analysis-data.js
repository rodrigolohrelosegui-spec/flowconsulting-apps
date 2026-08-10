// Datos de las secciones 01-07 del informe

const ANALYSIS = {
  // ============= 01 · Estrategia general =============
  strategy: {
    thesis: "La estructura del embudo de Ramiro es replicable. El tono no. Donde Ramiro vende con dolor + urgencia + lenguaje rioplatense crudo, Rodrigo vende con claridad + alineación + sabiduría pausada.",
    comparison: [
      { dim: "Promesa", ramiro: "Genera más clientes", rodrigo: "Gana más, trabaja menos, sé más feliz" },
      { dim: "Tono", ramiro: "Rioplatense crudo, urgencia, dolor", rodrigo: "Pausado, primeros principios, claridad" },
      { dim: "Pillar dominante", ramiro: "Prueba social masiva (50%)", rodrigo: "Filosofía + alineación + casos curados" },
      { dim: "CTA principal", ramiro: "Comentá YO → ManyChat", rodrigo: "Llamada de diagnóstico (única)" },
      { dim: "Awareness target", ramiro: "79% en niveles 3-4", rodrigo: "60-70% en niveles 2-3" },
      { dim: "Avatar", ramiro: "Coaches recién empezando", rodrigo: "Empresarios $10K-$75K MRR" },
      { dim: "Moat cultural", ramiro: "Acento argentino directo", rodrigo: "Quiet Luxury + sabiduría LATAM" },
    ],
    funnel: [
      { layer: 1, name: "Atracción", channel: "Reels + Carruseles", mechanism: "Big Idea + ángulos contrarian", cta: "Comentá [KEYWORD] → ManyChat → lead magnet" },
      { layer: 2, name: "Confianza", channel: "Stories video", mechanism: "Casos curados + behind-scenes + lifestyle real", cta: "Mostrar el modelo que enseña — vivirlo, no predicarlo" },
      { layer: 3, name: "Cierre", channel: "Stories imagen", mechanism: "ROI matemático + comparativos antes/después", cta: "Ratio 1:9 vs stories video · Cierre con dolor matemático" },
      { layer: 4, name: "Conversión", channel: "DM + Llamada de diagnóstico", mechanism: "Conversación 1-1 con prospecto pre-calificado", cta: "La llamada hace la venta — el contenido pre-vende" },
    ],
    pillars: [
      { num: "01", name: "La Ilusión de Apalancamiento", percentage: 40, role: "Big Idea — ningún competidor ataca este ángulo. Es lo que hace a Rodrigo único.", subtopics: ["Facturación vs rentabilidad real", "Equipo grande = más caos", "Burnout que rompe el efecto compuesto", "Anti-hustle culture"] },
      { num: "02", name: "Casos curados con números reales", percentage: 25, role: "Los 18 casos son su biblioteca de prueba. Asset real del negocio.", subtopics: ["Mary Carmen $15K/sem", "Erika Herrera 80% rentabilidad", "Daniel Marcos +$350K", "Andrés Mora ROAS 42x", "Erick Gamio precios 50x"] },
      { num: "03", name: "Sistemas Estúpidamente Simples", percentage: 15, role: "El 'cómo' del Infinite Flow System. IA, automatización, lean ops.", subtopics: ["Focus for Flow Funnel", "IA como Iron Man (no sustitución)", "Lead Flow Infinito", "1 persona facturando más que equipo de 7"] },
      { num: "04", name: "Psicología del fundador", percentage: 15, role: "El background de psicología es diferenciador. Casi nadie en el espacio lo tiene.", subtopics: ["Síndrome del impostor sobre precio", "'Sale más caro no tomar acción'", "Burnout como adicción a productividad", "Identidad como cuello de botella"] },
      { num: "05", name: "Filosofía e Industria", percentage: 5, role: "Posiciones contrarian. Tim Ferriss / Naval / McKeown territory.", subtopics: ["'El wey de los funnels no resuelve nada'", "Lifestyle business design", "IKIGAI aplicado", "Crítica a programas masivos"] },
    ],
    mix: {
      purpose: [{ label: "Valor", value: 70 }, { label: "Venta", value: 20 }, { label: "Viralidad", value: 10 }],
      funnel: [{ label: "TOFU", value: 40 }, { label: "MOFU", value: 45 }, { label: "BOFU", value: 15 }],
      awareness: [
        { label: "Unaware", value: 15 },
        { label: "Problem aware", value: 30 },
        { label: "Solution aware", value: 35 },
        { label: "Product aware", value: 15 },
        { label: "Most aware", value: 5 },
      ],
      formato: [
        { label: "Reels educativos", value: 40 },
        { label: "Carruseles", value: 30 },
        { label: "Stories video", value: 20 },
        { label: "Stories imagen", value: 10 },
      ],
    },
  },

  // ============= 03 · Reels =============
  reels: {
    intro: "Los reels son la Capa 1 (Atracción) del embudo. Su función es generar reach + capturar leads. NO son contenido educativo puro — cada reel debe tener un objetivo claro: VIRAL (reach) o LEAD-GETTER (CR + DM).",
    insight: "Insight contraintuitivo: el reel #1 viral de Ramiro (2M plays) generó solo 756 comentarios. El reel #30 (150K plays) generó 12,571 comentarios y CR 8.3%. Reach NO es leads. Optimizar por views es el espejismo.",
    si: [
      "Anclar con cifra real en el hook (no 'mucho dinero', sino 'Mary Carmen $15K/sem')",
      "Prometer entrega en el hook y cumplirla EXACTAMENTE en el CTA (cero bait-and-switch)",
      "Pasos numerados para reels de tutorial — baja la fricción cognitiva",
      "Usar 'Resultado:' como separador antes del clímax",
      "Keyword corta y memorable (FLOW, MAPA, CASO — no frases)",
      "Especificar tiempo de entrega del lead magnet ('en menos de un minuto')",
      "Ir al punto en los primeros 5 segundos (cero setup en lead-getters)",
      "Crítica al método convencional ANTES de mostrar la solución propia",
    ],
    no: [
      "Tono crudo de Ramiro / palabrotas — Rodrigo NO es Ramiro",
      "Conceptos abstractos sin ancla numérica (toda idea necesita cifra o caso)",
      "Mezclar objetivos: o viral o lead-getter, nunca dos a la vez",
      "CTA después del segundo 60 si el objetivo es lead-getter",
      "Keywords largas o frases ('comenta para info' — convierte menos que 'comenta IA')",
      "Educación pura sin gancho de lead magnet (CR paupérrimo)",
      "Asumir que más plays = más leads (es inverso para CR)",
      "Repetir el mismo hook en variantes — el hook quema con repetición",
    ],
    hooks: [
      { code: "HOOK-A", name: "Cifra de cliente + mecanismo misterioso", template: "[CIFRA ESPECÍFICA] logró [CLIENTE] en [TIEMPO] con [MECANISMO VAGO]", example: "Mary Carmen pasó de $4K a $15K por semana sin contratar a nadie más. Hizo lo contrario de lo que le habían dicho.", note: "La cifra no redonda. El mecanismo contraintuitivo." },
      { code: "HOOK-B", name: "Pregunta de tutorial con tiempo ridículo", template: "¿Cómo [HACER X DEL SISTEMA] en [TIEMPO MUY CORTO]?", example: "¿Cómo simplificar tu oferta a una sola línea de servicio en menos de 20 minutos?", note: "Para reels lead-getter técnicos. Sweet spot 6-10 palabras." },
      { code: "HOOK-C", name: "Declaración negativa + contraste con la realidad", template: "[LO QUE TODOS HACEN] no es ambicioso. Es el problema.", example: "Tener un equipo de 15 personas no es señal de éxito. Es señal de que el modelo no cierra.", note: "Atacar la creencia, NO al avatar. Reencuadre filosófico." },
      { code: "HOOK-D", name: "Novedad + validación fría", template: "[NOVEDAD] existe. Y contradice lo que el mercado lleva años repitiendo.", example: "Hay una forma de automatizar el 80% de la captación sin aumentar el presupuesto en ads.", note: "Tono analítico. La autoridad viene de anticipar, no reaccionar." },
      { code: "HOOK-E", name: "Pregunta directa que duele", template: "¿[Pregunta que el avatar no se atreve a hacerse]?", example: "¿Cuántos años más vas a escalar el negocio antes de preguntarte si estás escalando el problema correcto?", note: "La tensión es el gancho. Sin responderla en el hook." },
    ],
    structures: [
      { num: 1, name: "Pasos numerados", flow: "Hook → 'Son [N] pasos' → Paso 1 → Paso 2 → Paso 3 → 'Resultado' → CTA keyword", duration: "30-55s", cr: "0.5%-8%", use: "Lead-getters técnicos" },
      { num: 2, name: "Problema → Contraste → Sistema", flow: "Hook crítico → '¿Por qué es problema?' → Contraste con caso → Mecanismo en 3 pasos → CTA", duration: "50-80s", cr: "0.1%-0.5%", use: "Reencuadre de creencias" },
      { num: 3, name: "Insight contrarian + demostración + implicación", flow: "Hook contrarian → 'Te explico por qué' → Argumento lógico con dato → Contraste estándar → Implicación → CTA", duration: "60-90s", cr: "0.05%-0.2%", use: "Viral + brand · Reach alto" },
      { num: 4, name: "Caso de éxito disecccionado", flow: "Hook con cifra → '¿Qué hizo exactamente?' → Pasos del caso → Resultado → 'Patrón en todos mis casos' → CTA", duration: "60-90s", cr: "0.15%-0.5%", use: "Conversión calificada" },
      { num: 5, name: "Top N elementos del sistema", flow: "Hook tipo lista → 'Las [N] cosas' → Items → 'La más importante...' → CTA", duration: "60-90s", cr: "0.1%-0.4%", use: "Lista densa de valor" },
    ],
    duration: [
      { obj: "Lead-getter técnico", time: "30-55s", reason: "CR máximo cuando el viewer llega al CTA con energía" },
      { obj: "Lead-getter narrativo", time: "55-75s", reason: "Necesita setup para que el caso conecte" },
      { obj: "Viral / reach", time: "60-90s", reason: "El desarrollo necesita espacio para generar el insight compartible" },
      { obj: "Top N / lista", time: "60-90s", reason: "Cada ítem necesita espacio mínimo para valer" },
    ],
  },

  // ============= 04 · Stories =============
  stories: {
    intro: "Las stories son las Capas 2-3 del embudo (Confianza + Cierre). 90% video / 10% imagen. Las imágenes son la artillería de cierre con dolor matemático.",
    insight: "Datos del análisis: 48% de stories de Ramiro son autoridad_proof. Ratio video:imagen = 10.9:1. 53% de stories en BOFU. 82% van en arcos de 3-18 stories. Ningún sticker excepto mention/link/question_box.",
    categories: [
      { num: "01", name: "AUTORIDAD_PROOF", pct: 48, role: "Casos reales con cifras y nichos. La maquinaria de prueba social diaria." },
      { num: "02", name: "EDUCATIVO", pct: 17.6, role: "Insight breve aplicable. 1 idea por story." },
      { num: "03", name: "NURTURING", pct: 9.9, role: "Conexión emocional / valores / behind scenes" },
      { num: "04", name: "CTA_DIRECTO", pct: 6.1, role: "Story sola con keyword DM" },
      { num: "05", name: "VENTA_DIRECTA", pct: 3.8, role: "Pitch directo de oferta paga" },
      { num: "06", name: "LIFESTYLE", pct: 3.8, role: "Quiet Luxury — el modelo que se vive" },
      { num: "07", name: "BEHIND_SCENES", pct: 3.8, role: "Proceso interno, equipo, sistema funcionando" },
      { num: "08", name: "URGENCIA", pct: 3.1, role: "Cierre matemático con dolor (formato imagen)" },
      { num: "09", name: "LEAD_MAGNET", pct: 2.3, role: "Entregable gratis a cambio de keyword" },
    ],
    si: [
      "Serializar TODO en arcos. 82% de las stories deben ser parte de una secuencia",
      "Casos reales con cifras NO redondas ('$38,400/mes' > '$40K')",
      "1 imagen por cada 9 videos (ratio inviolable)",
      "Stories de imagen SOLO para cierre matemático con costo de oportunidad",
      "Question box para recoger objeciones del avatar",
      "Mention sticker SOLO en testimonios (validación de identidad del cliente)",
      "Link sticker SOLO en stories de cierre (Capa 3) hacia el lead magnet",
      "Música sin letra o instrumental cinematic (estilo Quiet Luxury)",
    ],
    no: [
      "NO usar polls, countdowns, quizzes, emoji_sliders (zero usos en Ramiro)",
      "NO publicar stories sueltas sin arco contextual",
      "NO usar stickers como decoración (cada uno tiene función estratégica)",
      "NO mostrar lifestyle flashy (Lambos, mansiones) — Quiet Luxury, no ostentación",
      "NO repetir el mismo arco más de 1 vez cada 3-4 semanas",
      "NO mezclar emociones por capa: video=confianza, imagen=urgencia/pérdida",
      "NO hacer screenshot retocado — autenticidad visible (capturas reales con timestamps)",
    ],
    videoVsImage: [
      { metric: "Función", video: "Construir confianza", image: "Cerrar con dolor matemático" },
      { metric: "Funnel stage", video: "MOFU dominante", image: "73% BOFU" },
      { metric: "Emoción dominante", video: "Confianza, inspiración, aspiración", image: "Urgencia, miedo a perder" },
      { metric: "CTA explícito", video: "12% (88% sin CTA — pre-vende pasivamente)", image: "18% dm_directo" },
      { metric: "Hook tipo dolor", video: "7%", image: "27% (4× más)" },
      { metric: "Trigger urgencia", video: "0.08/story", image: "0.45/story (5.6× más)" },
      { metric: "Trigger miedo perder", video: "0.04/story", image: "0.45/story (11× más)" },
    ],
    arcs: [
      { name: "arc_resultados_clientes", count: 18, role: "El más largo · Desfile diario de casos" },
      { name: "arc_resultados_clientes_abril", count: 8, role: "Variante mensual del anterior" },
      { name: "arc_postergar_quemar", count: 5, role: "★ EL MÁS CONVERTIDOR — Reencuadra inacción como pérdida activa", isStar: true },
      { name: "arc_inaccion_costo_23k", count: 4, role: "Costo de oportunidad matemático" },
      { name: "arc_sistema_contenido", count: 3, role: "Explicación técnica del Infinite Flow" },
      { name: "arc_posicionamiento", count: 3, role: "Quién es y por qué es distinto" },
      { name: "arc_problemas_trafico", count: 3, role: "Diagnóstico de problemas comunes" },
      { name: "arc_explicacion_servicio", count: 3, role: "Cómo funciona la mentoría" },
      { name: "arc_caso_destacado", count: 2, role: "Caso individual destacado" },
      { name: "arc_metricas_propias", count: 2, role: "Métricas internas de la marca" },
    ],
  },

  // ============= 05 · Carruseles =============
  carouseles: {
    intro: "Los carruseles son la pieza más potente para engagement profundo: generan 90% más comments que reels (190 vs 100 mediana). Con 18 casos de éxito, Rodrigo tiene munición perfecta.",
    insight: "Hallazgo brutal: el arquetipo MÁS publicado por Ramiro (antes_despues, 47 carruseles, 29% del total) es el de PEOR performance (52 comments avg). El arquetipo noticias_actualizaciones (21 carruseles) es 33× más efectivo.",
    archetypes: [
      { name: "noticias_actualizaciones", n: 21, comments: 4037, ratio: 33 },
      { name: "tutorial_directo", n: 3, comments: 1390, ratio: 11 },
      { name: "utilitario_herramientas", n: 28, comments: 1277, ratio: 9 },
      { name: "educativo_negativo", n: 11, comments: 1070, ratio: 10 },
      { name: "lista_retrospectiva", n: 40, comments: 312, ratio: 3 },
      { name: "versus_comparacion", n: 6, comments: 192, ratio: 2 },
      { name: "antes_despues", n: 47, comments: 52, ratio: 1, isWorst: true },
    ],
    slides: [
      { count: 4, n: 2, engagement: 3398, comments: 2315, isStar: true },
      { count: 5, n: 14, engagement: 1286, comments: 920 },
      { count: 6, n: 25, engagement: 589, comments: 293 },
      { count: 7, n: 37, engagement: 519, comments: 196 },
      { count: 8, n: 64, engagement: 229, comments: 54, isWorst: true },
      { count: 9, n: 11, engagement: 442, comments: 120 },
      { count: 10, n: 6, engagement: 894, comments: 423 },
    ],
    formula: `SLIDE 1 — COVER (HOOK + PROMESA)
   Texto grande + elemento visual fuerte
   Promesa específica con cifra cuando aplica

SLIDE 2 — CONTEXTO O PROBLEMA
   Establece la tensión que justifica el carrusel

SLIDES 3-5 — DESARROLLO
   El "cómo" o la lista o los pasos
   1 idea principal por slide

SLIDE FINAL — CTA + KEYWORD
   "Comentá [KEYWORD] y te lo envío en menos de un minuto"
   Lead magnet específico, no genérico`,
    rules: [
      "Cover sin emoji excesivo. Texto grande, claro, contraste alto.",
      "Una idea por slide. Si el slide 3 tiene 3 ideas, son 3 slides distintos.",
      "Cifras específicas en el cover (no '$10K', sino '$15,234' o '$15K/sem')",
      "Slide final con UN solo CTA. Una keyword. Un lead magnet.",
      "4-5 slides óptimo. Máximo absoluto: 6. NUNCA pasar de 7.",
      "Texto por slide: 12-25 palabras max. Más texto = menos engagement.",
    ],
    si: [
      "Aplicar Quiet Luxury: nogal, cuero, mármol negro, naturaleza, luz natural",
      "Tipografía limpia: serif para títulos (Instrument Serif), sans para body (Open Sans)",
      "Paleta acotada: cyan + dark theme + acentos de blanco",
      "Cifras específicas no redondas (38,400 > 40K)",
      "Cover con elemento visual fuerte: screenshot, gráfico, foto de cliente",
      "Cierre con keyword DM y promesa de tiempo de entrega",
      "Repurpose de stories y reels al formato carrusel",
    ],
    no: [
      "Carruseles de 8+ slides (peor performance del análisis)",
      "Antes/después como arquetipo dominante (peor ROI a pesar de ser intuitivo)",
      "Demasiado texto por slide (>30 palabras = abandono)",
      "Templates genéricos de Canva con stock photos",
      "Emojis decorativos sin función estratégica",
      "Mezclar 3 ideas en un solo slide",
      "Cover sin promesa específica o sin gancho de cifra",
      "Cierre sin keyword DM (carrusel sin CTA es branding puro, no captación)",
    ],
    weeklyStrategy: [
      { day: "Lunes", archetype: "noticias_actualizaciones", topic: "Novedad de IA / herramienta / mercado", pillar: "Sistemas Estúpidamente Simples" },
      { day: "Miércoles", archetype: "utilitario_herramientas", topic: "Stack de IA del Infinite Flow", pillar: "Sistemas + Casos" },
      { day: "Jueves", archetype: "lista_retrospectiva", topic: "5 errores comunes en escalamiento", pillar: "Ilusión de Apalancamiento" },
      { day: "Viernes", archetype: "versus_comparacion", topic: "Escalar headcount vs Escalar sistema", pillar: "Filosofía / Big Idea" },
      { day: "Sábado", archetype: "tutorial_directo", topic: "Cómo hacer X paso por paso", pillar: "Casos curados" },
    ],
  },

  // ============= 06 · Roadmap =============
  roadmap: [
    {
      num: "01", phase: "Calibración", days: "1-30",
      cadence: "8-10 posts/semana",
      mix: "4 reels + 2 carruseles + 2-4 stories/día",
      focus: "Testear hooks, ángulos, ver qué resuena con audiencia",
      kpi: "30+ posts publicados · CR mediana > 0.5% · Comments del avatar correcto",
    },
    {
      num: "02", phase: "Consolidación", days: "31-60",
      cadence: "14-16 posts/semana",
      mix: "6-7 reels + 3-4 carruseles + 4-6 stories/día",
      focus: "Empezar a serializar arcos. 3-5 stories por arco. 1 caso/semana en stories.",
      kpi: "60+ posts acumulados · P75 plays > 30K · Primeros leads vía DM keyword",
    },
    {
      num: "03", phase: "Aceleración", days: "61-90",
      cadence: "18-22 posts/semana",
      mix: "8-10 reels + 5-6 carruseles + 6-8 stories/día (ratio 9:1 video:imagen)",
      focus: "Identificar Topic Crossroads (pillars vs minas de oro). Doblar lo que rinde, cortar lo que no.",
      kpi: "90+ leads · CR mediana > 1.5% · Primer caso de cliente captado por contenido",
    },
  ],
  hito: "Hito operativo crítico: en semana 5 (al llegar a 14 posts/sem) necesitás tener al menos 1 editor dedicado. Sin ese hito, escalar daña la calidad y el sistema colapsa.",

  // ============= 07 · KPIs =============
  kpis: {
    metrics: [
      { metric: "Plays mediana (reels)", p50: "32,383", m3: "5K-15K", m6: "15K-30K", m12: "30K-60K" },
      { metric: "Likes mediana", p50: "320", m3: "50-150", m6: "150-300", m12: "300-500" },
      { metric: "Comments mediana", p50: "92", m3: "20-50", m6: "50-100", m12: "100-200" },
      { metric: "CR mediana", p50: "1.41%", m3: "0.8-1.5%", m6: "1.5-2.5%", m12: "2.5-4%" },
      { metric: "CR top 5%", p50: "4.74%", m3: "3%", m6: "5%", m12: "7%+" },
      { metric: "Leads/mes", p50: "—", m3: "30-50", m6: "80-120", m12: "150-200" },
      { metric: "Calls/mes", p50: "—", m3: "5-10", m6: "15-25", m12: "30-40" },
      { metric: "Cierres/mes", p50: "—", m3: "1-3", m6: "3-7", m12: "8-15" },
    ],
    percentiles: [
      { pct: "P50 (mediana)", plays: "32,383", likes: "320", comments: "92", cr: "1.41%" },
      { pct: "P75", plays: "59,041", likes: "535", comments: "210", cr: "2.01%" },
      { pct: "P90", plays: "108,737", likes: "933", comments: "529", cr: "3.16%" },
      { pct: "P95", plays: "157,524", likes: "1,281", comments: "1,041", cr: "4.74%" },
      { pct: "P99 (top 1%)", plays: "647,958", likes: "3,107", comments: "3,887", cr: "11.21%" },
    ],
    howToUse: "Replicar este cálculo sobre los posts de Rodrigo cuando alcance ~50 piezas publicadas. Cada post nuevo se compara contra su propio P50/P75/P90. P99 = top 1% = candidato a viral. P50 = baseline. Bajo P25 = bandera roja.",
  },
};
