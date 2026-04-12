# 📤 Core Prompt — Output Format (Schema JSON de Saída)

**Arquivo fonte:** `src/lib/ai/promptDictionary.ts` → `buildOutputFormat()`  
**Injetado em:** Toda chamada ao `/api/briefing`  
**Posição no prompt:** #8 (penúltimo bloco, antes do BlockEvaluation)

---

## Descrição

Define o **schema JSON obrigatório** de cada resposta da IA. A IA deve retornar **exclusivamente** JSON válido neste formato. O servidor faz `JSON.parse()` e retorna ao frontend.

---

## Schema Completo

```xml
<FormatoSaida>
Retorne APENAS JSON válido com estes campos:
{
  "intent": {
    "mode": "CREATE | UPDATE | EXPLORE",
    "confidence": 0.95,
    "target_fields": []
  },
  "updates": {},
  "inferences": {
    "extracted": [
      { "field": "", "value": "", "confidence": 0 }
    ]
  },
  "basalCoverage": 0,
  "currentSection": "",
  "basalFieldsCollected": [],
  "basalFieldsMissing": [],
  "nextQuestion": {
    "text": "",
    "questionType": "",
    "options": [],
    "allowMoreOptions": false
  },
  "isFinished": false,
  "assets": null,
  "micro_feedback": null,
  "engagement_level": "{backendEngagement}",
  "active_listening": {
    "signals": [],
    "depth_question": { "text": "", "questionType": "text" }
  },
  "session_quality_score": null
}

Campos obrigatórios: intent, updates, nextQuestion (ou isFinished=true), 
basalCoverage, basalFieldsCollected, basalFieldsMissing.
</FormatoSaida>
```

---

## Campos Obrigatórios vs Opcionais

| Campo | Obrigatório | Quando preencher |
|---|---|---|
| `intent` | ✅ Sempre | Sempre |
| `updates` | ✅ Sempre | Pode ser `{}` |
| `inferences.extracted` | ✅ Sempre | Pode ser `[]` |
| `basalCoverage` | ✅ Sempre | Float 0-1 |
| `basalFieldsCollected` | ✅ Sempre | Array de strings |
| `basalFieldsMissing` | ✅ Sempre | Array de strings |
| `nextQuestion` | ✅ Ou `isFinished=true` | Quando a conversa continua |
| `isFinished` | ✅ Sempre | `true` ao finalizar |
| `assets` | Condicional | Apenas quando `isFinished=true` |
| `micro_feedback` | Opcional | Max 1 a cada 3-4 perguntas. null no skip |
| `active_listening.signals` | Opcional | Pode ser `[]` |
| `session_quality_score` | Condicional | Obrigatório quando `isFinished=true` |

---

## Tipos de `questionType` permitidos

Configuráveis pelo admin em `app_settings` (DB). Cada formato pode ser ativado/desativado.

| Tipo | Default | Descrição |
|---|---|---|
| `text` | ✅ Sempre ativo | Campo aberto livre |
| `single_choice` | ✅ Ativo | Escolha exclusiva. Exatamente 6 opções (5 reais + "Outro") |
| `multiple_choice` | ✅ Ativo | Multi-seleção. Exatamente 6 opções (5 reais + "Outro") |
| `boolean_toggle` | ✅ Ativo | Sim/Não. Sem opção "Outro" |
| `card_selector` | ✅ Ativo | Cards descritivos. Options: `[{title, description}]`. 6 cards |
| `slider` | ❌ Inativo | Escala 1-10. Requer `minOption` e `maxOption` |
| `multi_slider` | ❌ Inativo | Múltiplas dimensões. Options: `[{label, min, max, minLabel, maxLabel}]` |
| `color_picker` | ✅ Ativo | Seletor de paleta. APENAS para coleta de cores |
| `file_upload` | ✅ Ativo | Upload de assets/referências. APENAS no final |
| `font` | ❌ Inativo | Seleção de fontes Google. Nomes reais no formato "FontName - Description" |

---

## Validações Server-side do Output

Após o parse do JSON, o servidor aplica:

1. **Formato desativado**: Se `questionType` não está em `formatConfig`, força fallback para `text`
2. **multi_slider sem options válidas**: Injeta opções padrão de `Formalidade/Ousadia/Comunicação`
3. **nextQuestion null sem isFinished**: Gera fallback inteligente apontando para o campo basal mais prioritário faltante
4. **isFinished sem assets**: Injeta assets mínimos com score calculado da cobertura atual
5. **updates com valores nulos/vazios**: Remove do objeto antes de retornar (Zero-Trust Guard)

---

## Assets (quando `isFinished=true`)

```json
{
  "assets": {
    "score": {
      "clareza_marca": 0-10,
      "clareza_dono": 0-10,
      "publico": 0-10,
      "maturidade": 0-10
    },
    "insights": ["insight 1", "insight 2", "..."],
    "slogans": ["opcional"],
    "cores": [
      { "name": "Primary", "hex": "#000000" }
    ]
  },
  "session_quality_score": 0-100
}
```
