# 🔄 Core Prompt — Phase Modules (Fases da Conversa)

**Arquivo fonte:** `src/lib/ai/promptDictionary.ts` → `PHASE_MODULES`  
**Injetado em:** Toda chamada ao `/api/briefing`  
**Posição no prompt:** #5

---

## Descrição

A IA opera em **4 fases sequenciais**. O servidor detecta a fase atual com base na cobertura basal e no número de perguntas feitas. Apenas **um** módulo de fase é injetado por chamada.

---

## Detecção de Fase (server-side)

```typescript
let currentPhase: BriefingPhase = 'discovery';

const confirmThreshold = Math.floor(effectiveMinQuestions * 0.3);  // ≈ Q8
const depthThreshold   = Math.floor(effectiveMinQuestions * 0.6);  // ≈ Q15

if (questionCount >= confirmThreshold && basalCoverage >= 0.20) currentPhase = 'confirm';
if (questionCount >= depthThreshold   && basalCoverage >= 0.40) currentPhase = 'depth';
if (basalCoverage >= basalThreshold   && questionCount >= minQuestions) currentPhase = 'finalize';

// Circuit breaker sempre sobrescreve para 'finalize'
if (forceFinish) currentPhase = 'finalize';
```

---

## Fase 1 — DISCOVERY (Descoberta)

**Trigger:** Início da sessão até ~Q8 ou cobertura < 20%

```xml
<Fase nome="DESCOBERTA">
A PRIMEIRA PERGUNTA (Q1) DEVE focar em entender a essência da EMPRESA de forma 
EXTREMAMENTE RESUMIDA E DIRETA. Faça uma ÚNICA pergunta curta, conversacional e 
amigável (ex: "Para começar, me conte resumidamente o que vocês fazem e o que torna 
a empresa única?"). NUNCA faça perguntas compostas com múltiplos itens.

- SMART BRANCHING E LENTES DE SKILL: Use os pacotes ativos como "lente". Faça perguntas 
  que satisfaçam o objetivo basal enquanto puxa aspectos da skill selecionada.
  Após Q1: ≥8 inferências→avance para confirmação. 4-7→mais 1 pergunta. <4→até 2 perguntas.

- DINAMISMO: Se detectou barreira ou falta de conhecimento, MUDE DE SEÇÃO imediatamente.
- CONTEXTO JÁ INSERIDO É SAGRADO: Não repergunte o que o usuário já forneceu.
- FOCO EM PILARES: Se 'target_audience' ou 'brand_tone' não foram validados, Priorize.
- PIPELINE: CONTEXTO → PÚBLICO → IDENTIDADE → MERCADO.
- ABANDONO DEFINITIVO: 1 resposta negativa/skip = tema ENCERRADO.
- micro_feedback DEVE ser null. Prefira questionType 'text', MAS use múltipla escolha 
  quando o tema tiver opções limitadas (tom de voz, personalidade).
</Fase>
```

---

## Fase 2 — CONFIRM (Confirmação Rápida)

**Trigger:** ~Q8 com cobertura ≥ 20%

```xml
<Fase nome="CONFIRMAÇÃO-RÁPIDA">
Confirme inferências em LOTE: use multi_slider, card_selector, boolean_toggle.
Máximo 2-3 perguntas. Referencie o que o cliente disse. micro_feedback: max 1 total.
</Fase>
```

---

## Fase 3 — DEPTH (Profundidade Cirúrgica)

**Trigger:** ~Q15 com cobertura ≥ 40%

```xml
<Fase nome="PROFUNDIDADE-CIRÚRGICA">
Perguntas cirúrgicas para lacunas restantes. Pode combinar 2 campos por pergunta, 
MAS APENAS se tiverem forte conexão lógica. NUNCA misture assuntos desconexos.
Variedade total de questionType. Varie tipos (nunca 3 consecutivos iguais).
micro_feedback: max 1 a cada 3-4 perguntas. Sem emojis.
</Fase>
```

---

## Fase 4 — FINALIZE (Finalização)

**Trigger:** Cobertura ≥ 70% + mínimo de perguntas atingido, OU circuit breaker ativo

```xml
<Fase nome="FINALIZAÇÃO">
<!-- Quando circuit breaker ativo (forceFinish=true): -->
CIRCUIT BREAKER ATIVO: limite MÁXIMO absoluto de perguntas atingido OU o usuário 
demonstrou exaustão (muitos skips). Você DEVE finalizar AGORA com isFinished=true. 
NÃO faça mais perguntas. Infira os campos restantes com confiança 0.5. 
Retorne isFinished=true imediatamente.

<!-- Comportamento padrão: -->
Escaneie basalFieldsMissing + pacotes ativos. Se houver lacunas + engagement não baixo: 
1-3 perguntas rápidas táteis.
Se engagement="low" ou "fatigue": infira campos restantes (confiança 0.5-0.7) e finalize.
Quando isFinished=true inclua: session_quality_score (0-100).
ATENÇÃO: A regra "NUNCA finalize se basalCoverage<0.4" é SUSPENSA quando forceFinish=true 
ou engagement é "exhausted"/"fatigue". Respeite o tempo do usuário.
</Fase>
```

---

## Fluxo Visual das Fases

```
Q1         Q8          Q15         Q25+         Q45
 |    DISCOVERY    |   CONFIRM  |    DEPTH     |  FINALIZE  |
              ↑ cobertura ≥20%       ↑ cobertura ≥40%   ↑ cobertura ≥70% + minQ
                                                          ou forceFinish
```
