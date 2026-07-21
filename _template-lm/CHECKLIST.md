# Checklist por Lead Magnet

Aplicar al final de cada LM antes de marcarlo DONE.

## Fase A — Brief narrativo
- [ ] Avatar específico identificado (de los 5 programas FC)
- [ ] Capa narrativa elegida (1 atracción / 2 conversión)
- [ ] Nivel de awareness target definido (Schwartz 1-5)
- [ ] Casos de estudio relevantes elegidos (mínimo 2)
- [ ] Hook principal + 5 alternativos redactados
- [ ] CTA final + razón para actuar ahora

## Fase B — Mecánica IA
- [ ] Output personalizado definido (PDF / score / guión / mapa / SVG)
- [ ] 5-12 preguntas en `questions.json` con scoring claro
- [ ] `system_prompt_v1.md` redactado (rol + arquetipos + fases + reglas + voz Rodrigo + output JSON schema)
- [ ] Validado con 2-3 inputs de prueba

## Fase C — Frontend
- [ ] Fork de `_template-lm/` completado
- [ ] `index.html` con copy del LM (hero + capture + loader + result)
- [ ] `quiz.js` CFG actualizado (webhook, storage_key, urls)
- [ ] `renderResult()` adaptado al output del LM
- [ ] Test local con `python3 -m http.server` — flujo completo funciona
- [ ] OG image custom creada (`assets/og-image.png`)

## Fase D — Backend n8n
- [ ] Workflow duplicado de `diagnostico-icp` en n8n
- [ ] Webhook path cambiado a `<lm-slug>`
- [ ] System prompt pegado y validado con test runs
- [ ] Output parser ajustado al nuevo schema
- [ ] GHL: tag creado, custom fields conectados, email template configurado
- [ ] Workflow activado

## Fase E — Deploy + verificación
- [ ] Card en `flowibs-apps/index.html` raíz agregada
- [ ] `git add . && git commit && git push origin main`
- [ ] GitHub Pages live (~2 min)
- [ ] **Smoke test E2E en producción:**
  - [ ] Abrir landing → no errores en consola
  - [ ] Completar quiz → webhook recibe payload
  - [ ] IA responde en <30s → render correcto en frontend
  - [ ] Contacto creado en GHL con tag `lm-<slug>` y custom fields llenos
  - [ ] Email entregado con resultado
  - [ ] Click en CTA final → redirige a discovery call

## Quality gates (Belief Ladder + Trim & Stack)
- [ ] El LM construye mínimo 4 de 7 creencias (Pain / Doubt / Cost / Desire / Money / Support / Trust)
- [ ] Quick win tangible en primeros 5-10 min
- [ ] Mínimo 2 testimonios con números específicos integrados
- [ ] Voz check: suena a Rodrigo (validado contra `RODRIGO_VOZ_AUTENTICA.md`)
- [ ] Trim & Stack: cada componente del LM es alto valor / bajo costo de entrega
- [ ] CTA con razón para actuar ahora
- [ ] No resuelve el problema completo (give the WHAT and WHY, sell the HOW)

## Métrica de éxito (primeros 30 días)
- [ ] ≥30% de opt-in completion
- [ ] ≥10% click-through al CTA final (booking)
- [ ] ≥2% conversión a llamada agendada

## Tracking (Meta Pixel)

No hay que hacer nada: el pixel oficial de Flow Consulting ya viene incluido en
`index.html` mediante `<script src="/shared/fc-pixel.js" defer></script>`.

- Fuente única: `/shared/fc-pixel.js` en la raíz del repo (dataset "Flow Consulting - Oficial").
- Si algún día cambia el pixel, se cambia SOLO en ese archivo y aplica a todos
  los lead magnets a la vez. No pegar el snippet de Meta en páginas sueltas.
- Verificar que dispara: abrir la página y en la consola correr
  `fbq.getState().pixels.map(p => p.id)` → debe devolver el ID oficial.
