# Core Prompt — Phase Modules

> ⚠️ **SOURCE OF TRUTH:** `src/lib/ai/promptDictionary.ts` → `PHASE_MODULES`
> This document is a human-readable mirror. If you change a phase, change it
> in TypeScript first, then sync this file.

**Injected in:** Every call to `/api/briefing`
**Position in compiled prompt:** between `EXTRACTION_MODULE` and `CONSULTANT_RULES`

---

## Phase detection (server-side)

```ts
let currentPhase: BriefingPhase = 'discovery';

const confirmThreshold = Math.floor(effectiveMinQuestions * 0.3);  // ≈ Q8
const depthThreshold   = Math.floor(effectiveMinQuestions * 0.6);  // ≈ Q15

if (questionCount >= confirmThreshold && basalCoverage >= 0.20) currentPhase = 'confirm';
if (questionCount >= depthThreshold   && basalCoverage >= 0.40) currentPhase = 'depth';
if (basalCoverage >= basalThreshold   && questionCount >= minQuestions) currentPhase = 'finalize';

// Circuit breaker always wins
if (forceFinish) currentPhase = 'finalize';
```

The compiler in `compileSystemPrompt` injects exactly **one** phase module per
turn (`PHASE_MODULES[currentPhase](forceFinish)`).

---

## Phase 1 — DISCOVERY

```xml
<Fase nome="DESCOBERTA">
A PRIMEIRA PERGUNTA (Q1) DEVE ser sobre a essência da EMPRESA de forma curta e direta (ex: "Me conte resumidamente o que vocês fazem e o que torna a empresa única?"). Tipo "text".
- SMART BRANCHING: Use os pacotes ativos como "lente" já nas perguntas iniciais.
- Após Q1: ≥8 inferências→avance. 4-7→mais uma pergunta. <4→até 2 perguntas.
- DINAMISMO: Se detectou barreira em um tópico, MUDE DE SEÇÃO imediatamente.
- FOCO EM PILARES: Priorize 'target_audience' e 'brand_tone' se ainda vazios.
- PIPELINE: CONTEXTO → PÚBLICO → IDENTIDADE → MERCADO.
Dê PREFERÊNCIA ao "text" nesta fase, MAS use 'multiple_choice'/'card_selector' para temas com escolhas limitadas.
</Fase>
```

---

## Phase 2 — CONFIRM

```xml
<Fase nome="CONFIRMAÇÃO-RÁPIDA">
Confirme inferências em LOTE: use card_selector, boolean_toggle, multiple_choice.
Máximo 2-3 perguntas. Referencie o que o cliente disse.
</Fase>
```

---

## Phase 3 — DEPTH

```xml
<Fase nome="PROFUNDIDADE-CIRÚRGICA">
Perguntas cirúrgicas para lacunas restantes. Variedade total de questionType (nunca 3 consecutivos iguais).
micro_feedback: max 1 a cada 3-4 perguntas. Sem emojis.
</Fase>
```

---

## Phase 4 — FINALIZE

`PHASE_MODULES.finalize(forceFinish)` returns the same body, conditionally
prefixed when the circuit breaker fires:

```xml
<Fase nome="FINALIZAÇÃO">
<!-- prefix injected when forceFinish=true -->
CIRCUIT BREAKER ATIVO: FINALIZE AGORA com isFinished=true. NÃO faça mais perguntas. Infira campos restantes com confiança 0.5.

Se houver lacunas + engagement bom: 1-3 perguntas rápidas. Se engagement="low"/"fatigue": infira e finalize.
Quando isFinished=true inclua session_quality_score (0-100).
</Fase>
```

In this phase the compiler also drops `EXTRACTION_MODULE`, `CONSULTANT_RULES`,
and `<AllowedFormats>` from the prompt — see `compileSystemPrompt`.

---

## Visual flow

```
Q1         Q8          Q15         Q25+         Q45
 |    DISCOVERY    |   CONFIRM  |    DEPTH     |  FINALIZE  |
              ↑ basalCoverage ≥ 0.20       ↑ ≥ 0.40       ↑ ≥ basalThreshold + minQ
                                                            or forceFinish
```

---

## Related blocks always present

In addition to the phase module, every compiled prompt includes:

1. `corePersona` (with `<SystemRole>` + `<Context>`)
2. `buildLanguageRule(targetLang)` — second-pass language reminder
3. `GOLDEN_RULES`
4. `EXTRACTION_MODULE` (skipped in finalize)
5. **phase module** (this file)
6. `CONSULTANT_RULES` (skipped in finalize)
7. `behaviorRules` (block strategy + checkpoint)
8. `<AllowedFormats>` (skipped in finalize)
9. `<PreviousQuestions>` (anti-repetition, last 8)
10. `<CurrentState>` (compacted; see `src/app/api/briefing/route.ts`)
11. `buildOutputFormat()` (see `09_output_format.md`)
