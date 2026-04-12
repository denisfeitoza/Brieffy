# 📱 Skill — Presença Digital & Conteúdo

**ID:** `digital-presence`  
**Slug DB:** `digital_presence`  
**Departamento:** Digital  
**Ícone:** Video  
**Máx. perguntas únicas:** 7  
**Arquivo fonte:** `src/lib/skill-templates.ts`

---

## Propósito

> Entender como a marca se apresenta e se comunica no ambiente digital.

**Sinais de profundidade monitorados:** `redes sociais`, `conteúdo`, `SEO`, `digital`, `engajamento`

---

## Campos Únicos para Extrair

| Campo | Descrição |
|---|---|
| `social_platforms_active` | Plataformas onde a marca está presente |
| `content_frequency` | Frequência de publicação atual |
| `content_types` | Tipos de conteúdo produzidos |
| `digital_goals` | Objetivos digitais para os próximos 6 meses |
| `seo_awareness` | Nível de consciência e uso de SEO |
| `online_reputation` | O que aparece quando alguém busca a empresa |
| `content_pillars` | Pilares temáticos de conteúdo (se existirem) |

---

## System Prompt Fragment

```
SKILL: Presença Digital & Conteúdo
CAMPOS ÚNICOS PARA EXTRAIR: social_platforms_active, content_frequency, content_types, 
digital_goals, seo_awareness, online_reputation, content_pillars

ESTRATÉGIA CONVERSACIONAL:
- Comece pelo estado atual sem julgamento: "Me conta como está a presença digital 
  hoje — onde vocês aparecem?"
- Explore a relação com conteúdo: se é um peso ou uma oportunidade
- Use multiple_choice para plataformas (Instagram, LinkedIn, TikTok, YouTube, Blog, Outro)
- Valide maturidade digital via slider (1-10): "De 1 a 10, quão confortável você se 
  sente com marketing digital?"
```

---

## Perguntas Sugeridas (Sequência de Diagnóstico)

| # | Pergunta | Tipo | Campo alvo |
|---|---|---|---|
| 1 | "Hoje, quando alguém busca sua empresa no Google, o que encontra?" | `text` | `online_reputation` + `seo_awareness` |
| 2 | Plataformas ativas | `multiple_choice` [Instagram, LinkedIn, TikTok, YouTube, Blog, Outro] | `social_platforms_active` |
| 3 | "Qual seu maior desafio com conteúdo?" | `single_choice` [Não tenho tempo, Não sei o que postar, Não vejo resultado, Não tenho equipe, Está funcionando bem, Outro] | `content_frequency` + diagnóstico |
| 4 | Maturidade digital | `slider` (1–10) | (campo diagnóstico interno) |
| 5 | "Se pudesse escolher um resultado digital em 6 meses, qual seria?" | `text` | `digital_goals` |

---

## Regras da Skill

- ❌ **Proibido:** Julgar a maturidade digital. Muitos negócios excelentes têm presença digital fraca
- ✅ Cruzar com campos basais `communication_channels` e `target_audience`
- ✅ Se o cliente tem engajamento baixo → use tipos táteis (slider, single_choice) nas perguntas desta skill
- ✅ Abordagem sempre sem julgamento: o objetivo é diagnosticar, não avaliar
