# 📣 Skill — Campanha & Lançamento

**ID:** `campaign-launch`  
**Slug DB:** `campaign_launch`  
**Departamento:** Marketing  
**Ícone:** Megaphone  
**Máx. perguntas únicas:** 10  
**Arquivo fonte:** `src/lib/skill-templates.ts`

---

## Propósito

> Construir a base estratégica de uma campanha — do porquê à execução.

**Sinais de profundidade monitorados:** `campanha`, `lançamento`, `mídia paga`, `conversão`, `ROI`

---

## Campos Únicos para Extrair

| Campo | Descrição |
|---|---|
| `campaign_objective` | Objetivo principal da campanha (em uma frase) |
| `campaign_type` | Tipo: Awareness / Geração de Leads / Lançamento / Sazonalidade... |
| `campaign_duration` | Duração estimada (1–12 meses) |
| `target_channels` | Canais selecionados para a campanha |
| `budget_range` | Faixa de investimento (perguntada por ÚLTIMO) |
| `success_metrics` | O que define o sucesso ("o que te faria dizer que funcionou?") |
| `creative_requirements` | Necessidades criativas identificadas |
| `key_messages` | Mensagens-chave a comunicar |

---

## System Prompt Fragment

```
SKILL: Campanha & Lançamento
CAMPOS ÚNICOS PARA EXTRAIR: campaign_objective, campaign_type, campaign_duration, 
target_channels, budget_range, success_metrics, creative_requirements, key_messages

ESTRATÉGIA CONVERSACIONAL (sequência WHY→WHO→HOW→WHAT):
1. Comece pelo PORQUÊ: "Que problema essa campanha resolve?" ou 
   "O que muda no mundo se essa campanha funcionar?"
2. Depois QUEM: público emerge do contexto do negócio, não de formulários demográficos
3. Então COMO: canais emergem de onde o público vive. "Onde seu cliente ideal passa 
   o tempo online?"
4. Por fim O QUÊ: necessidades criativas seguem naturalmente de tudo acima
5. Orçamento por ÚLTIMO — precedido por contexto de valor
```

---

## Perguntas Sugeridas (Sequência WHY→WHO→HOW→WHAT)

| # | Pergunta | Tipo | Campo alvo |
|---|---|---|---|
| 1 | "Em uma frase, qual o grande objetivo dessa campanha?" | `text` | `campaign_objective` |
| 2 | Tipo de campanha | `single_choice` [Awareness, Leads, Lançamento, Reposicionamento, Sazonal, Outro] | `campaign_type` |
| 3 | "Quais canais você já usa que trazem resultado?" | `multiple_choice` com canais relevantes | `target_channels` |
| 4 | Duração estimada | `slider` (1–12 meses) | `campaign_duration` |
| 5 | "Qual seria um resultado que te faria considerar essa campanha um sucesso?" | `text` | `success_metrics` |
| 6 | "Em termos de investimento, qual faixa faz sentido para esse momento?" | `single_choice` com ranges | `budget_range` |

---

## Regras da Skill

- ❌ **Proibido:** Perguntar orçamento antes de estabelecer contexto de valor
- ✅ Se o cliente não sabe o tipo de campanha → ajude-o a descobrir via perguntas sobre objetivo
- ✅ Cruzar com campos basais `target_audience` e `communication_channels` — não reperguntar
- ✅ Orçamento é sempre o **último** item a ser coletado, com contexto de ROI já estabelecido
