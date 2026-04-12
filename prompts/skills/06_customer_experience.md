# 🤝 Skill — Experiência do Cliente & Jornada

**ID:** `customer-experience`  
**Slug DB:** `customer_experience`  
**Departamento:** Commercial  
**Ícone:** Users  
**Máx. perguntas únicas:** 7  
**Arquivo fonte:** `src/lib/skill-templates.ts`

---

## Propósito

> Mapear como o cliente vive a experiência com a marca — do primeiro contato ao pós-venda.

**Sinais de profundidade monitorados:** `jornada do cliente`, `satisfação`, `NPS`, `atendimento`, `retenção`

---

## Campos Únicos para Extrair

| Campo | Descrição |
|---|---|
| `customer_journey_stages` | Etapas da jornada mapeadas |
| `pain_points` | Pontos de dor e frustração identificados |
| `satisfaction_level` | Nível de satisfação por etapa (multi_slider) |
| `retention_strategy` | Como a empresa retém clientes |
| `referral_rate` | Taxa de indicação espontânea |
| `support_channels` | Canais de suporte utilizados |
| `onboarding_process` | Processo de onboarding de novos clientes |

---

## System Prompt Fragment

```
SKILL: Experiência do Cliente & Jornada
CAMPOS ÚNICOS PARA EXTRAIR: customer_journey_stages, pain_points, satisfaction_level, 
retention_strategy, referral_rate, support_channels, onboarding_process

ESTRATÉGIA CONVERSACIONAL:
- Peça ao cliente contar a história de UM cliente real — da descoberta à fidelização
- Explore pontos de dor por narrativa, não lista: "Em que momento um cliente fica frustrado?"
- Use multi_slider para mapear satisfação por etapa da jornada
```

---

## Perguntas Sugeridas (Sequência)

| # | Pergunta | Tipo | Campo alvo |
|---|---|---|---|
| 1 | "Me conte a jornada de um cliente típico — como ele te descobre, decide comprar, e o que acontece depois?" | `text` | `customer_journey_stages` |
| 2 | "Qual momento da experiência do cliente te deixa mais orgulhoso? E qual te preocupa?" | `text` | `pain_points` + `satisfaction_level` |
| 3 | Satisfação por etapa | `multi_slider` Descoberta / Compra / Entrega / Pós-venda (1–5) | `satisfaction_level` |
| 4 | "Seus clientes te indicam espontaneamente?" | `boolean_toggle` | `referral_rate` |
| 5 | "O que faria um cliente voltar a comprar sem você precisar pedir?" | `text` | `retention_strategy` |

---

## multi_slider de Satisfação por Etapa

```json
[
  {"label": "Descoberta",  "min": 1, "max": 5, "minLabel": "Fraco", "maxLabel": "Excelente"},
  {"label": "Compra",      "min": 1, "max": 5, "minLabel": "Fraco", "maxLabel": "Excelente"},
  {"label": "Entrega",     "min": 1, "max": 5, "minLabel": "Fraco", "maxLabel": "Excelente"},
  {"label": "Pós-venda",   "min": 1, "max": 5, "minLabel": "Fraco", "maxLabel": "Excelente"}
]
```

---

## Regras da Skill

- ❌ **Proibido:** Usar jargões como "NPS", "CSAT", "touchpoint" com o cliente — fala em linguagem humana
- ✅ **B2B:** Explorar o ciclo de vendas
- ✅ **B2C:** Explorar a experiência de compra
- ✅ Cruzar com campos basais `target_audience` e `services_offered`
