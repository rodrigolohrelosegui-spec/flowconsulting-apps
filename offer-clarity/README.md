# `_template-lm/` — Template para nuevos lead magnets de Flow Consulting

Fork limpio del `/diagnostico/` (validado en producción). Acelera la creación de un nuevo LM de ~2h a ~30-45 min.

## Qué reusar 1:1 (NO tocar al forkear)

- `assets/styles.css` — design system completo (Inter, dark theme, paleta cyan, todos los componentes: hero, progress, capture form, loader2, result blocks, vsl-block, etc.)
- Estructura de views en `index.html`: `view-landing` → `view-question` → `view-capture` → `view-loading` → `view-error` → `view-result`. Cambian los textos, no la arquitectura.
- Toda la lógica de `quiz.js` excepto el bloque CFG y `renderResult()` (cada LM tiene output diferente):
  - sessionStorage / loadState / saveState
  - track() helper agnóstico (GA4 / Plausible / dataLayer / fi-track CustomEvent)
  - Routing por Q1
  - Loader2 con dots animados + percent + ticks
  - Manejo de errores + retry
  - Validación de email
  - context_signals (timezone, referrer, UTM, device)

## Qué customizar por LM

### 1. `index.html` (sustituir strings)

| Token a buscar | Sustituir por |
|---|---|
| `El Diagnóstico del Piloto IA · Flow IBS` | Title del LM |
| `apps.flowibs.com/diagnostico/` | `apps.flowconsulting.co/<slug>/` |
| `Flow IBS` (en og:site_name, etc.) | `Flow Consulting` |
| Hero: hook + subhook + microcopy CTA | Copy específico del LM |
| Capture: titulo + subtitulo + bonus mention | Custom por LM |
| Loader2 título y steps | "Analizando tu <output>" + 6 steps narrativos |
| `view-result` completo | Custom — ver sección 4 abajo |

### 2. `assets/quiz.js` — bloque CFG (líneas 9-17)

```js
const CFG = {
  WEBHOOK_ICP: 'https://n8n-flowjorge-u59154.vm.elestio.app/webhook/<lm-slug>',
  URL_DISCOVERY: 'https://api.leadconnectorhq.com/widget/bookings/<rodrigo-call>',
  QUESTIONS_PATH: './assets/questions.json',
  STORAGE_KEY: 'fc_<lm-slug>_state_v1',
  REQUEST_TIMEOUT_MS: 45000
};
```

### 3. `assets/questions.json` — todo el cuestionario

- Cambiar `diagnostic_id`, `version`, `last_updated`
- Reescribir `routes` (si aplica routing por avatar/programa)
- Reescribir `questions[]` — cada pregunta con su scoring y options

### 4. `renderResult()` en `quiz.js` — output específico del LM

Cada LM produce un output diferente:
- LM #2 Offer Clarity Scanner → 4 scores + radar chart + frase específica que rompe el flujo
- LM #1 Infinite Flow Funnel → calculadora "estás dejando $X" + diagrama funnel
- LM #5 SO Fundador → PDF descargable con valores+visión+metas
- LM #6 Ventas HT → guión personalizado para llamadas
- LM #4 Ciclo de Flow → mapa de energía + plan 30 días
- LM #7 Flywheel → SVG personalizado con ruedas
- LM #8 Effortless Content → 10 hooks + calendario 7 días
- LM #9 Cuello de Botella → triage que redirige a otro LM

Reescribir `renderResult(data)` y la sección `<section class="view-result">` del HTML.

### 5. Backend n8n

Duplicar el workflow `diagnostico-icp` en n8n. Cambiar:
- Webhook path → `<lm-slug>`
- System prompt (ver `system_prompt_template.md`)
- Output parser para nueva estructura de respuesta IA
- GHL tag → `lm-<lm-slug>`
- Email template

### 6. GHL

- Tag por LM: `lm-<lm-slug>` + estados `incompleto/completo`
- Custom fields ya creados sirven (LEAD_MAGNET_RESPUESTAS + BUSINESS_CONTEXT)
- Email template específico por LM

## Procedimiento de fork (orden)

```bash
# 1. Fork
cp -r _template-lm/ <lm-slug>/

# 2. Lee la spec del LM en memoria:
#    ~/.claude/projects/.../memory/flowconsulting_lead_magnets_pipeline.md

# 3. Aplica voz Rodrigo:
#    /Users/jorgeortizjarquin/Documents/FLOW IBS/Clients/Flow Consulting Rodrigo/client_docs/RODRIGO_VOZ_AUTENTICA.md

# 4. Aplica narrativa:
#    notion_arquitectura_narrativa_rodrigo.md (Big Idea, UVP, pilares, casos)

# 5. Casos de estudio largos:
#    casos_de_estudio_v2.md

# 6. Customiza index.html, questions.json, quiz.js (CFG + renderResult)

# 7. Backend: duplicar workflow n8n + system_prompt_v1.md basado en template

# 8. Deploy
git add . && git commit -m "feat: LM <slug> · v1" && git push origin main
```

## Frameworks a apilar (mínimo 3 por LM)

- **Belief Ladder de Cole Gordon** — construir mínimo 4 de 7 creencias en el LM
- **Voz Rodrigo** — calibrar contra `RODRIGO_VOZ_AUTENTICA.md`
- **Hormozi Big Four modificadores** — apilar 2-3 en hooks (New / Only / Fast / Easy / Safe)
- **Capa narrativa correcta** — Capa 1 (atracción) o Capa 2 (conversión), nunca Capa 3 antes de proof
- **Quick win en primeros 5-10 min** — el primer resultado tangible debe llegar rápido

Ver detalles en:
- `~/.claude/projects/.../memory/leadmagnets_playbook.md`
- `~/.claude/projects/.../memory/hormozi_advanced_frameworks.md`
- `~/.claude/projects/.../memory/flowconsulting_narrativa.md`

## Verificación E2E (cada LM debe pasar)

Ver checklist en `CHECKLIST.md`.
