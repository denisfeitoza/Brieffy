# 📈 Skill — Análise de Mercado & Posicionamento

**ID:** `market-analysis`  
**Slug DB:** `market_analysis`  
**Departamento:** Marketing  
**Ícone:** TrendingUp  
**Máx. perguntas únicas:** 8  
**Arquivo fonte:** `src/lib/skill-templates.ts`

---

## Propósito

> Mapear o terreno competitivo — onde a empresa está, onde quer chegar e contra quem compete.

**Sinais de profundidade monitorados:** `concorrentes`, `pricing`, `diferencial competitivo`, `market share`

---

## Campos Únicos para Extrair

| Campo | Descrição |
|---|---|
| `market_position` | Posição percebida no mercado |
| `pricing_strategy` | Estratégia de precificação (premium, competitivo, etc.) |
| `sales_cycle` | Ciclo de venda (curto, médio, longo) |
| `competitor_strengths` | Pontos fortes dos concorrentes mencionados |
| `competitor_weaknesses` | Fraquezas dos concorrentes identificadas |
| `unique_value_proposition` | Proposta de valor única |
| `market_trends` | Tendências de mercado que preocupam ou animam |

---

## System Prompt Fragment

```
SKILL: Análise de Mercado & Posicionamento
CAMPOS ÚNICOS PARA EXTRAIR: market_position, pricing_strategy, sales_cycle, 
competitor_strengths, competitor_weaknesses, unique_value_proposition, market_trends

ESTRATÉGIA CONVERSACIONAL:
- Aborde concorrentes por ADMIRAÇÃO, não confronto. 
  "Qual empresa você secretamente admira — o que inveja nela?"
- Precificação por ângulos oblíquos: "Se um cliente comparasse seu preço ao do 
  [concorrente], o que você diria?"
- Extraia tamanho de mercado por implicações, não perguntas diretas
- Use boolean_toggle para validar hipóteses de posicionamento 
  ("Pelo que entendi, vocês competem mais por qualidade que por preço. Está correto?")
```

---

## Perguntas Sugeridas (Sequência)

| # | Pergunta | Tipo | Campo alvo |
|---|---|---|---|
| 1 | "Se eu fosse seu cliente ideal e estivesse pesquisando, que outras 3 opções eu encontraria antes de chegar em você?" | `text` | `competitors` (extração natural) |
| 2 | "O que te faz perder clientes? E o que te faz ganhar?" | `text` | `competitor_strengths` + `unique_value_proposition` |
| 3 | Posicionamento competitivo (4 dimensões) | `multi_slider` Preço vs Mercado / Inovação / Atendimento / Escopo | `market_position` + `pricing_strategy` |
| 4 | "Qual tendência do seu mercado te preocupa ou anima mais?" | `text` | `market_trends` |

---

## Regras da Skill

- ❌ **Proibido:** "Quais são seus concorrentes?" (abordagem direta de interrogatório)
- ✅ Se o cliente diz que não conhece concorrentes → RESPEITE e mude para precificação
- ✅ Se o cliente não mencionar preço → abordar de forma natural sem intimidar
- ✅ Cruzar com campos basais `competitors` e `competitive_differentiator` — não duplicar

---

## multi_slider de Posicionamento

```json
[
  {"label": "Preço vs Mercado", "min": 1, "max": 5, "minLabel": "Mais barato", "maxLabel": "Premium"},
  {"label": "Inovação", "min": 1, "max": 5, "minLabel": "Tradicional", "maxLabel": "Pioneiro"},
  {"label": "Atendimento", "min": 1, "max": 5, "minLabel": "Self-service", "maxLabel": "High-touch"},
  {"label": "Escopo", "min": 1, "max": 5, "minLabel": "Nicho", "maxLabel": "Full-service"}
]
```
