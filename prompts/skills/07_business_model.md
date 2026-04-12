# 💡 Skill — Modelo de Negócio & Estratégia

**ID:** `business-model`  
**Slug DB:** `business_model`  
**Departamento:** Operations  
**Ícone:** Lightbulb  
**Máx. perguntas únicas:** 8  
**Arquivo fonte:** `src/lib/skill-templates.ts`

---

## Propósito

> Entender a mecânica do negócio — como gera valor, como monetiza, o que sustenta.

**Sinais de profundidade monitorados:** `modelo de negócio`, `receita`, `escalabilidade`, `investimento`, `crescimento`

---

## Campos Únicos para Extrair

| Campo | Descrição |
|---|---|
| `revenue_model` | Modelo de receita principal |
| `cost_structure` | Maior custo operacional atual |
| `key_partnerships` | Parceiros estratégicos inestimáveis |
| `distribution_channels` | Como o produto/serviço chega ao cliente |
| `growth_strategy` | Estratégia de crescimento atual ou planejada |
| `scalability_assessment` | Gargalos para escalar |
| `business_maturity` | Nível de maturidade do modelo (1–10) |

---

## System Prompt Fragment

```
SKILL: Modelo de Negócio & Estratégia
CAMPOS ÚNICOS PARA EXTRAIR: revenue_model, cost_structure, key_partnerships, 
distribution_channels, growth_strategy, scalability_assessment, business_maturity

ESTRATÉGIA CONVERSACIONAL:
- Comece pelo valor entregue: "Se eu fosse seu cliente, o que ganho ao escolher você?"
- Explore monetização de forma natural: "Como seu faturamento se distribui — 
  muitos clientes pequenos, poucos grandes, ou um mix?"
- Use abordagem de futuro: "Se pudesse dobrar de tamanho em 1 ano, o que seria o gargalo?"
```

---

## Perguntas Sugeridas (Sequência)

| # | Pergunta | Tipo | Campo alvo |
|---|---|---|---|
| 1 | "Em poucas palavras, qual é a principal forma como sua empresa ganha dinheiro?" | `text` | `revenue_model` |
| 2 | Modelo de receita | `single_choice` [Venda de produtos, Serviços, Assinatura/Recorrente, Marketplace/Comissão, Licenciamento, Outro] | `revenue_model` |
| 3 | "Qual seu maior custo operacional hoje?" | `text` | `cost_structure` |
| 4 | Maturidade do negócio | `slider` (1–10) | `business_maturity` |
| 5 | "Quem são seus parceiros mais estratégicos? Sem quem a operação para?" | `text` | `key_partnerships` |
| 6 | "Qual o maior obstáculo para crescer nos próximos 12 meses?" | `text` | `scalability_assessment` + `growth_strategy` |

---

## Regras da Skill

- ❌ **Proibido:** Usar jargões de startup (LTV, CAC, MRR) a menos que o cliente os use primeiro
- ✅ **Negócio novo:** Foco em validação
- ✅ **Negócio maduro:** Foco em otimização e escala
- ✅ Cruzar com campos basais `services_offered` e `sector_segment` — contextualizar as perguntas
