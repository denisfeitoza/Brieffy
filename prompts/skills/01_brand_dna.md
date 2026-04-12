# 🎨 Skill — Brand DNA & Identidade Visual

**ID:** `brand-dna`  
**Slug DB:** `brand_dna`  
**Departamento:** Branding  
**Ícone:** Palette  
**Máx. perguntas únicas:** 8  
**Arquivo fonte:** `src/lib/skill-templates.ts`

---

## Propósito

> Extrair a essência da marca — quem ela é, como se comporta, o que sente e como quer ser percebida.

**Sinais de profundidade monitorados:** `identidade visual`, `rebranding`, `posicionamento de marca`, `arquétipo`

---

## Campos Únicos para Extrair

| Campo | Descrição |
|---|---|
| `brand_archetype` | Arquétipo da marca (Herói, Sábio, Criador, Rebelde, Cuidador...) |
| `brand_values_top3` | Top 3 valores inegociáveis da marca |
| `visual_mood` | Mood visual — emoção que a marca transmite visualmente |
| `typography_preference` | Preferências tipográficas |
| `color_palette_vibe` | Vibe da paleta — não cores específicas, mas sentimentos |
| `brand_voice_dimensions` | Dimensões do tom de voz (formalidade, ousadia, comunicação) |
| `logo_status` | Status atual do logo (definido / em elaboração / do zero) |
| `symbol_references` | Símbolos, ícones ou elementos visuais que ressoam com a marca |

---

## System Prompt Fragment

```
SKILL: Brand DNA & Identidade Visual
CAMPOS ÚNICOS PARA EXTRAIR: brand_archetype, brand_values_top3, visual_mood, 
typography_preference, color_palette_vibe, brand_voice_dimensions, logo_status, 
symbol_references

ESTRATÉGIA CONVERSACIONAL:
- Use perguntas de poder: "Se sua marca desaparecesse amanhã, que vazio ela deixaria 
  no mundo?"
- Aborde identidade visual por EMOÇÕES primeiro, depois especificidades. Nunca pergunte 
  "que cores você gosta" — explore o mood e sentimento.
- Use card_selector para detecção de arquétipo/personalidade (ex: O Herói, O Sábio, 
  O Criador, O Rebelde, O Cuidador, Outro).
- Para dimensões de voz da marca, use multi_slider com escala 1-5:
  [{"label":"Formalidade","min":1,"max":5,"minLabel":"Descontraído","maxLabel":"Corporativo"},
   {"label":"Ousadia","min":1,"max":5,"minLabel":"Tradicional","maxLabel":"Disruptivo"},
   {"label":"Comunicação","min":1,"max":5,"minLabel":"Técnica/Direta","maxLabel":"Emocional/Storytelling"}]
- Explore LOGO E SÍMBOLO de forma natural: descubra se o cliente já tem um logo, se já 
  pensou em algum símbolo, ícone ou elemento visual que represente a marca. NÃO pergunte 
  de forma técnica — explore por significado e intenção.
```

---

## Perguntas Sugeridas (Sequência)

| # | Pergunta | Tipo | Campo alvo |
|---|---|---|---|
| 1 | "Se sua marca fosse uma pessoa, como ela entraria numa sala?" | `text` | `brand_archetype` (warm-up) |
| 2 | Arquétipo da marca | `card_selector` (6 opções descritivas) | `brand_archetype` |
| 3 | "Que 3 palavras NUNCA deveriam descrever sua marca?" | `text` | `brand_values_top3` (reverso) |
| 4 | Dimensões de voz | `multi_slider` (3 dimensões 1-5) | `brand_voice_dimensions` |
| 5 | "Pense em uma marca que você admira visualmente — o que nela te atrai?" | `text` | `visual_mood` |
| 6 | Status do logo | `single_choice` ["Já tenho definido", "Tenho ideias", "Aberto a sugestões", "Do zero"] | `logo_status` |
| 7 | "Se sua marca fosse representada por um único símbolo ou objeto, qual seria?" | `text` | `symbol_references` |

---

## Regras da Skill

- ❌ **Proibido:** Perguntas genéricas como "qual sua paleta de cores?" — explore sentimentos e referências
- ✅ Se `color_picker` estiver ativo nos formatos, use-o para paleta. Caso contrário, extraia por texto
- ✅ Conecte cada pergunta ao contexto do negócio, não apenas à estética
- ✅ Para logo/símbolo: se já tem logo, explore o que gosta e o que mudaria
- ✅ Se o cliente não se interessa por símbolo → registre e siga em frente (NUNCA force)
