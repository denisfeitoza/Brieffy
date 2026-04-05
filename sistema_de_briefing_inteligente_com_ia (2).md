# 🧠 Sistema de Briefing Inteligente com IA

## 📌 Visão Geral

Criar um sistema de briefing adaptativo que coleta informações de empresas de forma inteligente, evitando redundância e otimizando a experiência do usuário.

O sistema deve:
- Adaptar perguntas com base nas respostas
- Permitir respostas em texto e áudio
- Evitar perguntas repetidas
- Gerar insights, score e ativos de marca automaticamente
- Permitir pausa e continuidade

---

## 🧩 Estrutura do Sistema

### 1. Base Fixa (Perguntas Essenciais)

Perguntas obrigatórias que sempre serão feitas:
- Nome da empresa
- O que a empresa faz
- Público-alvo (se não informado via áudio)
- Objetivo principal (site, branding, tráfego, etc)

---

### 2. Motor Adaptativo (Lógica Inteligente)

O sistema deve funcionar com base em um estado (state) atualizado em tempo real.

#### 📦 Exemplo de estado:
```json
{
  "empresa": "",
  "descricao": "",
  "publico": "",
  "objetivo": "",
  "tem_identidade_visual": false
}
```

#### ⚙️ Regras:
- Se uma informação já foi respondida → não perguntar novamente
- Se uma resposta abre contexto → aprofundar
- Se não relevante → pular bloco inteiro

#### 🔒 Controle:
- Máximo de perguntas por seção
- Máximo total de perguntas
- Evitar loops infinitos

---

### 3. Entrada Multimodal

#### 🎤 Áudio
- Usuário pode responder via áudio livre
- Transcrição automática
- Extração de:
  - Intenção
  - Público
  - Dores
  - Linguagem

#### ✍️ Texto
- Campo aberto
- Respostas rápidas via clique

---

## ⚡ Sistema de Respostas Rápidas (UX Otimizada)

Para acelerar o preenchimento:

### 🧠 Modelo de pergunta híbrida

Exemplo:

**Qual faixa etária você quer atingir?**

Opções:
- Jovens (18–25)
- Adultos (25–45)
- Alta renda
- Personalizar

Usuário pode:
- Clicar e avançar rapidamente
- Ou escrever manualmente

---

## 🎯 Sistema de Sugestões Inteligentes

Após coleta de dados, o sistema entra em modo de sugestão.

### 🔁 Fluxo:
1. IA gera opções
2. Usuário escolhe
3. Pode gerar mais opções
4. Escolhe uma e avança

---

## 🎨 Geração de Assets

### 1. Slogans
- Gerar 3 opções
- Botão "Gerar mais"
- Usuário seleciona uma

---

### 2. Paleta de Cores

#### UI:
- Blocos visuais com cores
- Cada opção com múltiplos quadrados

#### Dados:
- Gerar códigos HEX
- Exemplo:
```json
{
  "primary": "#000000",
  "secondary": "#FFFFFF",
  "accent": "#FF5733"
}
```

#### Interação:
- Escolher opção
- Gerar novas

---

### 3. Outros Assets possíveis
- Headline
- Tom de voz
- Estrutura de site

---

## 📊 Sistema de Score (Diagnóstico)

Avaliação automática baseada nas respostas.

### 🧠 Métricas sugeridas:
- Clareza da marca (0–10)
- Clareza do dono (0–10)
- Maturidade digital (0–10)
- Definição de público (0–10)
- Posicionamento (0–10)

### 📌 Exemplo:
```json
{
  "clareza_marca": 6,
  "clareza_dono": 3,
  "publico": 4,
  "maturidade": 5
}
```

---

## 🧠 Geração de Insights

O sistema deve gerar análises automáticas:

Exemplos:
- "O público-alvo não está bem definido"
- "A comunicação está genérica"
- "Falta diferenciação clara"

---

## 📄 Output Final

### 1. Documento estruturado
- Todas as respostas organizadas

### 2. Diagnóstico
- Score completo

### 3. Estratégia
- Recomendações práticas

### 4. Assets escolhidos
- Slogan
- Cores
- Direção de marca

---

## 💾 Persistência

O sistema deve permitir:
- Salvar progresso
- Retomar depois
- Histórico de respostas
- **Resetar Briefing**: Permite apagar o histórico de interações e recomeçar a conversa mantendo os dados basais da empresa (Acesso via menu "Mais Opções").

---

## ⚠️ Pontos Críticos

### 1. Evitar repetição
- Validar estado antes de perguntar

### 2. Controle da IA
- IA não decide tudo
- Seguir regras estruturadas

### 3. UX fluida
- Interface leve
- Clique rápido
- Barra de progresso

### 4. Qualidade do output
- Evitar respostas genéricas
- Garantir profundidade

---

## 🚀 Expansões Futuras

- Chat com IA pós-briefing
- Geração de propostas automáticas
- Integração com CRM
- Criação automática de páginas/site

---

## 🧠 Conceito Central

Sistema deve funcionar como:

→ Um consultor inteligente
→ Um diagnóstico guiado
→ Um gerador de estratégia

Não é apenas um formulário.

É um motor de decisão.


---

# 📎 ANEXO A — FLUXO COMPLETO DO USUÁRIO (STEP BY STEP)

## 1. Entrada
- Usuário inicia briefing
- Opção:
  - Começar do zero
  - Continuar briefing salvo

---

## 2. Coleta Inicial (Modo rápido)

### Opção 1: Áudio livre
- Pergunta:
  - “Explique seu negócio da forma que quiser”

### Opção 2: Formulário guiado
- Perguntas base

---

## 3. Processamento Inteligente

Sistema extrai automaticamente:
- Segmento
- Público
- Objetivo
- Problemas
- Nível de clareza

---

## 4. Perguntas Adaptativas

Loop controlado:

```
while (informação incompleta && limite não atingido) {
  perguntar baseado no estado
}
```

---

## 5. Modo Sugestão (Interativo)

Sistema muda de coleta → construção

Usuário passa a:
- Escolher opções
- Refinar decisões

---

## 6. Finalização

- Geração de:
  - Documento
  - Score
  - Estratégia

---

# 📎 ANEXO B — MODELO DE DECISÃO (QUESTION TREE)

Exemplo simplificado:

```
[Objetivo]
 ├── Site
 │    ├── Perguntar páginas
 │    ├── Perguntar estilo visual
 │
 ├── Tráfego
 │    ├── Perguntar orçamento
 │    ├── Perguntar canais
 │
 └── Branding
      ├── Perguntar identidade atual
      ├── Perguntar referências
```

---

# 📎 ANEXO C — MODELO DE PROMPT PARA IA

## 🎯 Geração de perguntas

"Baseado no estado atual do usuário, gere a próxima melhor pergunta.

Regras:
- Não repetir informações já respondidas
- Não gerar mais de 1 pergunta
- Priorizar clareza
- Pergunta deve ser objetiva"

---

## 🎯 Geração de slogans

"Crie 3 slogans para uma empresa com base nos seguintes dados:

[estado]

Regras:
- Curto
- Memorável
- Diferente entre si"

---

## 🎯 Geração de paleta de cores

"Crie 3 paletas de cores para uma marca com base nos seguintes dados:

[estado]

Formato:
- Lista de HEX
- Nome emocional da paleta"

---

# 📎 ANEXO D — MODELO DE SCORE (LÓGICA)

## 🧠 Clareza do dono

Critérios:
- Sabe explicar o negócio?
- Define público?
- Tem objetivo claro?

Pontuação:
- 0–3 → confuso
- 4–6 → médio
- 7–10 → claro

---

## 🧠 Clareza da marca

- Posicionamento definido?
- Diferenciação?

---

## 🧠 Maturidade digital

- Tem site?
- Roda tráfego?
- Tem branding?

---

# 📎 ANEXO E — MODELO DE DADOS (ESTRUTURA COMPLETA)

```json
{
  "empresa": {},
  "respostas": {},
  "estado": {},
  "score": {},
  "assets": {
    "slogan": "",
    "cores": [],
    "tom": ""
  },
  "insights": []
}
```

---

# 📎 ANEXO F — REGRAS DE UX (CRÍTICAS)

- Sempre mostrar progresso (%)
- Nunca mais de 1 pergunta por vez
- Sempre permitir pular
- Sempre permitir voltar
- Botões grandes e clicáveis
- Feedback instantâneo

---

# 📎 ANEXO G — FAIL SAFES (ANTERROS DE ERRO)

## Problema: IA gera lixo
→ Solução: validar saída antes de exibir

## Problema: usuário trava
→ Solução: botão “não sei responder”

## Problema: respostas vagas
→ Solução: IA pede refinamento

---

# 📎 ANEXO H — IDEIAS AVANÇADAS

- Heatmap de decisões do usuário
- Perfil comportamental do dono
- Clusterização de empresas
- Treinamento de modelos internos

---

# 📎 CONCLUSÃO

Este sistema deve ser tratado como:

→ Produto
→ Ativo estratégico
→ Motor de inteligência de negócio

E não apenas como formulário.


---

# 📎 ANEXO I — MULTI-IDIOMA (AUTO-DETECÇÃO + UX)

## 🌍 Requisitos
- Sistema padrão em inglês
- Detectar automaticamente o idioma do usuário
- Permitir resposta em qualquer idioma (texto ou áudio)
- Manter consistência de idioma durante a sessão

## ⚙️ Lógica
- Detectar idioma na primeira entrada (texto ou transcrição)
- Salvar em `state.language`
- Traduzir perguntas automaticamente quando necessário
- Normalizar dados internamente (ex: inglês) para processamento

## 📌 UX
- Aviso claro:
  - “You can answer in any language”
- Manter fluidez sem trocar idioma inesperadamente

---

# 📎 ANEXO J — MOTOR DE ANTECIPAÇÃO (THINK AHEAD ENGINE)

## 🧠 Conceito
A IA deve sempre pensar 3–5 passos à frente.

## ⚙️ Funcionamento
Para cada pergunta atual:
1. Simular próximos caminhos possíveis
2. Identificar lacunas de informação
3. Priorizar perguntas de maior impacto
4. Reordenar perguntas dinamicamente

## 🔁 Reavaliação contínua
- A cada nova resposta:
  - Recalcular rota
  - Ajustar prioridades

## 📌 Regra crítica
- Nunca perguntar algo que será respondido naturalmente em breve

---

# 📎 ANEXO K — AUTO-CRÍTICA DA IA (QUALITY LOOP) ✅ IMPLEMENTADO

## 🧠 A IA deve se perguntar sempre (5-step verification):
1. "Eu já tenho essa informação (explícita ou inferida)?" → se SIM, pular
2. "Posso inferir isso do que já sei?" → se SIM, adicionar às inferences e pular
3. "Essa pergunta melhora significativamente o briefing?" → se NÃO, pular
4. "Estou perguntando algo que o usuário já implicou?" → se SIM, pular
5. "Existe uma pergunta mais rica que cobre múltiplos campos de uma vez?" → se SIM, usar essa

## 🔁 Loop de validação (implementado no system prompt)
```
Before generating nextQuestion:
if (already_known || can_infer || low_value || already_implied) {
  skip_question()
  if (can_infer) add_to_inferences()
}
if (exists_richer_question) use_richer_question()
```

---

# 📎 ANEXO L — BUILDER DE FORMULÁRIOS (ADMIN)

## 🎯 Objetivo
Permitir criação de novos briefings por categoria.

## 🧩 Estrutura
Admin define:
- Nome do formulário
- Categoria principal
- Subcategorias
- Objetivos de extração

## 📦 Exemplos de categorias
- Identidade visual
- Marketing
- Website
- Aplicativo / Plataforma
- Sistema interno
- Agente de IA

---

## 🧠 Estrutura por categoria
Cada formulário deve ter:

### 1. Campos obrigatórios (basais)
Nunca podem faltar

### 2. Campos adaptativos
Dependem do contexto

### 3. Objetivos de extração
Exemplo:
- Definir público
- Definir posicionamento
- Identificar dores
- Identificar diferenciais

---

# 📎 ANEXO M — MODELO DE CONFIGURAÇÃO DE FORMULÁRIO

```json
{
  "nome": "Identidade Visual",
  "categoria": "branding",
  "objetivos": [
    "definir publico",
    "definir posicionamento",
    "extrair personalidade"
  ],
  "campos_basais": [
    "nome_empresa",
    "descricao"
  ]
}
```

---

# 📎 ANEXO N — MOTOR DE EXTRAÇÃO (INTENT ENGINE) ✅ IMPLEMENTADO

## 🧠 Função
Extrair informações mesmo quando não explicitadas diretamente.

## 📌 Exemplo
Usuário diz:
“Eu vendo para empresários que faturam mais de 50k”

Sistema extrai:
- **Explícito** → `target_audience = empresários`
- **Implícito** → `audience_class = mid-high` (confiança: 0.9)
- **Implícito** → `pricing_tolerance = high` (confiança: 0.85)
- **Implícito** → `communication_style = professional` (confiança: 0.8)
- **Implícito** → `brand_positioning = premium` (confiança: 0.75)

## ⚙️ Implementação Técnica

### Auto-Merge de Inferências
Inferências com confiança ≥ 0.7 são automaticamente mescladas no `updates`, preenchendo campos basais sem precisar perguntar.

### Controle de Profundidade (Depth Control)
- **Aprofundar** (1 follow-up máx): dores genuínas, nichos inesperados, incerteza sobre identidade
- **NUNCA aprofundar**: logística, preços, processos internos, dados pessoais

### Filtro de Irrelevância
- Respostas vagas → marcar campo como parcial, seguir em frente
- Histórias tangenciais → extrair o útil, redirecionar educadamente
- Máx 2 perguntas sobre o mesmo tópico

### Formato de Resposta JSON
```json
{
  "inferences": {
    "extracted": [
      { "field": "audience_class", "value": "mid-high", "confidence": 0.9, "source": "mentioned 50k revenue" }
    ],
    "skipped_topics": ["internal_processes"],
    "depth_decision": "dig_deeper | move_on | skip"
  }
}
```

### Persistência
Inferências são salvas na coluna `inferences` (jsonb) da tabela `briefing_interactions` para análise futura.

---

# 📎 ANEXO O — PERFORMANCE E FLUIDEZ

## ⚡ Requisitos
- Resposta da IA < 1s ideal
- Transição instantânea entre perguntas
- Sem loading visível sempre que possível

## 🧠 Estratégia
- Pré-gerar próximas perguntas (buffer)
- Cache de respostas
- Paralelizar processamento

---

# 📎 ANEXO P — MODO ADMIN (VISÃO INTERNA)

## 📊 O que mostrar:
- Respostas completas
- Score detalhado
- Insights
- Histórico de decisões

## 🧠 Uso interno:
- Criar propostas
- Alimentar agentes de IA
- Analisar padrão de clientes

---

# 📎 ANEXO Q — PADRÃO DE QUALIDADE DO OUTPUT

## 📌 O resultado final deve ser:
- Claro
- Acionável
- Específico
- Personalizado

## ❌ Evitar:
- Generalizações
- Frases vagas
- Conteúdo genérico

---

# 📎 ANEXO R — EXPANSÃO AUTOMÁTICA DE PRODUTOS

## 🧠 O sistema pode sugerir novos caminhos:

Exemplo:
Se usuário seleciona “site”
→ sugerir:
- Landing page
- Blog
- Área de membros

Se seleciona “agente de IA”
→ sugerir:
- Atendimento
- Vendas
- Suporte interno

---

# 📎 CONCLUSÃO FINAL (NÍVEL PRODUTO)

Este sistema deve:

→ Pensar
→ Adaptar
→ Antecipar
→ Extrair
→ Gerar valor

Ele não responde.

Ele conduz.

---

## ANEXO S — SISTEMA DE PACOTES DE CATEGORIAS (AI SKILLS) ✅ REFATORADO

### Conceito
Pacotes de IA são **módulos de expertise invisíveis** que se injetam no motor conversacional. Para o cliente que responde, a experiência deve ser UMA conversa unificada — não uma série de formulários por categoria.

### Arquitetura
- **Tabela**: `briefing_category_packages` (slug, name, description, icon, system_prompt_fragment, max_questions, tier, briefing_purpose, depth_signals[], is_archived, is_default_enabled, sort_order)
- **Sessão**: `briefing_sessions.selected_packages` (JSONB array de slugs)
- **API CRUD**: `/api/briefing/packages` (GET com filtro `is_archived`, POST, PUT, DELETE)
- **Admin UI**: `/dashboard/packages` — CRUD completo com editor de system prompt
- **Seleção**: `GenerateLinkModal` — step intermediário com multi-select visual por tier

### Taxonomia de Pacotes (4 Tiers)

#### 🎨 Tier: Branding
| Slug | Nome | Max Q | Foco |
|------|------|-------|------|
| `primal_branding` | Primal Branding Complete | 10 | 7 pilares da marca (historia, crença, ícones, rituais, palavras, inimigo, líder) |
| `visual_identity` | Visual Identity & Applications | 10 | Estilo visual, tipografia, aplicações |
| `rebranding` | Rebranding & Repositioning | 10 | Diagnóstico e aspiração para reforma de marca |
| `founder_vision` | Founder Story & Vision | 8 | Narrativa pessoal do fundador, motivação, valores |

#### 📊 Tier: Strategy
| Slug | Nome | Max Q | Foco |
|------|------|-------|------|
| `business_model_canvas` | Business Model Canvas | 12 | Os 9 blocos do modelo de negócio |
| `marketing` | Marketing & Communication | 10 | Estratégia e posicionamento (inicia com multi_slider DNA) |
| `sales` | Customer Acquisition & Sales | 10 | Jornada de compra, objeções, conversão |

#### 🚀 Tier: Execution
| Slug | Nome | Max Q | Foco |
|------|------|-------|------|
| `campaign_launch` | Campaign Launch Briefing | 10 | Briefing completo de campanha específica |
| `social_media` | Social Media Strategy | 10 | Plataformas, voz, conteúdo, competidores |
| `content_media` | Content & Media | 8 | Estratégia editorial, voz do fundador |
| `web_app_briefing` | Website / App Briefing | 12 | Escopo, features, conteúdo, visual, prazo |
| `ecommerce` | E-commerce & Digital | 8 | Experiência de compra online, conversão |

#### 🧠 Tier: Consulting
| Slug | Nome | Max Q | Foco |
|------|------|-------|------|
| `ai_automation` | AI & Automation Opportunities | 10 | Processos manuais, automação, agentes IA |
| `cx_mapping` | Customer Experience Mapping | 10 | Jornada completa do cliente, dores, momentos de encanto |
| `ai_management_system` | AI Management System | ∞ | Stack de tecnologia, unificação, sistema de gestão com IA |

#### 🗄️ Arquivados (internos — não relevantes para fluxo agência→cliente)
`hr_culture`, `legal`, `finance`, `logistics`, `it_infrastructure`, `product_innovation`

### Campos Novos na Tabela
- **`tier`**: string — classifica o pacote (`branding`, `strategy`, `execution`, `consulting`, `internal`)
- **`briefing_purpose`**: text — descrição do objetivo de extração para o Active Listening Engine
- **`depth_signals`**: text[] — sinais que a IA deve caçar nas entrelinhas (ex: `brand_contradiction`, `positioning_gap`)
- **`is_archived`**: boolean — oculta pacote da seleção sem deletar histórico

### Tipo de Pergunta: `multi_slider`
Para perguntas de perfil com múltiplas dimensões simultâneas:
- Renderiza até 5 mini-sliders em grid compacto
- Escala obrigatória: min=1, max=5 (NUNCA 1-10)
- Resposta JSON: `{"dimension1": 3, "dimension2": 5}`
- Usado por: Marketing, Content, Social Media

---

## ANEXO T — PERSONA DE CONSULTOR ESTRATÉGICO ✅ IMPLEMENTADO

### Conceito
O motor de briefing não é um entrevistador — é um **Consultor Estratégico** especializado. Cada pergunta é enquadrada como exploração colaborativa, nunca interrogatório.

### Framework de Descoberta (4 Fases)
```
FASE 1 — IMERSÃO (steps 1-3): Mundo do cliente
→ Foco: Identidade, contexto de mercado, relação do fundador
→ Tom: Curioso, caloroso, sem julgamento

FASE 2 — DEFINIÇÃO (steps 4-7): Quem são e para quem servem
→ Foco: Audiência, posicionamento, concorrência, personalidade de marca
→ Tom: Analítico, investigando hipóteses

FASE 3 — VALIDAÇÃO (steps 8-10): Testar hipóteses
→ Foco: Contradições, lacunas estratégicas, alinhamento de ambição
→ Tom: Desafiador (gentili), validando, buscando clareza

FASE 4 — CONSTRUÇÃO (steps 11+): Visão estratégica
→ Foco: Direção visual, tom de voz, próximos passos
→ Tom: Criativo, colaborativo, prospectivo
```

### Regras de Persona
- NUNCA perguntar sem contexto — antes da pergunta, validar hipótese ou compartilhar micro-observação
- NUNCA usar elogios genéricos ("Ótima resposta!") — sempre micro_feedback específico
- Power Questions: 1 por fase, projetadas para provocar reflexão genuína
- Adaptação de tom por tipo de package ativo (branding→criativo, strategy→analítico)

### Anti-Atrito
- Engajamento monitorado a cada resposta
- `engagement_level`: "high" | "medium" | "low"
- Quando "low": trocar para interações táteis (card_selector, boolean_toggle), comprimir perguntas
- Quando "low" + basalCoverage ≥ 0.6: considerar finalização antecipada

---

## ANEXO U — MOTOR DE ORQUESTRAÇÃO DE PACOTES ✅ IMPLEMENTADO

### Problema Resolvido
Com múltiplos pacotes ativos, o risco é gerar perguntas desconexas — o cliente sente que está respondendo vários formulários diferentes. O PACKAGE_ORCHESTRATION module resolve isso.

### Sequenciamento Obrigatório
```
1. CAMPOS BASAIS (sempre primeiro — contexto universal)
2. BRANDING: founder_vision → primal_branding → visual_identity → rebranding
3. STRATEGY: business_model_canvas → marketing → sales
4. EXECUTION: campaign_launch → social_media → content_media → web_app_briefing → ecommerce
5. CONSULTING: ai_automation → cx_mapping → ai_management_system
```

### Transições Naturais Entre Áreas
Ao mudar de tier, o motor insere uma **PIVOT PHRASE** que sinaliza naturalmente a mudança de tema:
- Basal → Branding: *"Com o contexto da empresa estabelecido, quero entrar em território mais estratégico..."*
- Branding → Strategy: *"Entendendo quem vocês são, vamos olhar como o mercado te enxerga..."*
- Strategy → Execution: *"Estratégia definida. Agora quero entender os projetos e execução..."*
- Execution → Consulting: *"Uma última camada importante — como a operação suporta tudo isso..."*

### Deduplicação Cross-Package
Quando pacotes se sobrepõem (ex: Marketing e Campaign Launch ambos perguntam sobre canais):
- Pergunta feita APENAS no contexto mais relevante (primeiro encontrado no sequenciamento)
- No segundo pacote, a IA referencia o que já sabe: *"Você mencionou Instagram principalmente — no contexto desta campanha específica..."*

### Compressão por Fadiga
Quando `engagement_level = "low"` ou `basalCoverage ≥ 0.85`:
- Mesclar perguntas de pacotes diferentes em uma única questão combinada
- Preferir `multi_slider` ou `card_selector` para consolidar múltiplas dimensões
- Finalizar mais cedo se a cobertura já for suficiente

### Princípios da Experiência do Cliente
1. O cliente deve se sentir **visto e compreendido** durante toda a conversa
2. Cada pergunta deve parecer que **constrói sobre a anterior**
3. **Nunca** fazer o cliente sentir que está preenchendo um formulário
4. **Variedade obrigatória**: máximo 2 perguntas consecutivas do mesmo tipo
5. Ao fechar cada área: breve **ACKNOWLEDGMENT** antes de avançar ao próximo tier

### UI — Header Humanizado
- O cliente vê os tiers ativos no header (não os nomes técnicos dos pacotes)
- Exemplo: `✦ Marca · Estratégia · Execução` (em vez de "Primal Branding, Marketing, Social Media")
- No mobile: apenas o ícone de sparkles

---

## ANEXO V — ACTIVE LISTENING ENGINE ✅ IMPLEMENTADO

### Conceito
Em paralelo ao fluxo de perguntas, a IA realiza uma **varredura silenciosa** em cada resposta para detectar sinais estratégicos nas entrelinhas. Esses sinais alimentam:
1. O **relatório final** da agência (o usuário que criou o briefing)
2. **Perguntas de profundidade** inseridas naturalmente no fluxo
3. A **micro_feedback** exibida ao cliente entre perguntas

### Protocolo de Varredura (5 Categorias)
```
1. CONTRADIÇÃO: Esta resposta contradiz algo dito antes?
2. DOR IMPLÍCITA: Há uma frustração escondida?
3. EVASÃO: O cliente desviou do tópico?
4. AMBIÇÃO OCULTA: Uma aspiração grande escapou?
5. LACUNA ESTRATÉGICA: Há um gap crítico de conhecimento de negócio?
```

### Relevância e Sinalização
- Cada sinal recebe score de relevância (0.0 → 1.0) baseado no `briefing_purpose` da sessão
- Apenas sinais com score ≥ 0.60 são reportados
- Máximo 2 sinais por turno para evitar ruído
- `depth_signals` dos pacotes ativos guiam prioridades da varredura

### Trigger de Profundidade
Quando sinal tem relevância ≥ 0.80 E ainda não foi explorado:
- Gera `depth_question` inserida naturalmente na próxima pergunta
- Fraseada como se o consultor "acabou de perceber algo interessante"
- Máximo de 1 follow-up por tópico, então avança

### Integração com Relatório da Agência
Os sinais detectados são agregados e aparecem no relatório final como:
- **Risk & Opportunity Matrix**: contradições e lacunas detectadas
- **Executive Summary**: síntese das ambições ocultas e dores implícitas
- **Brand Health Score**: calculado parcialmente com base nos sinais

### Schema Técnico (JSON)
```json
{
  "active_listening": {
    "signals": [
      {
        "category": "hidden_ambition",
        "summary": "Mencionou escalar para mercado internacional casualmente",
        "relevance_score": 0.85
      }
    ],
    "depth_question": {
      "text": "Essa visão de expansão internacional — é algo para 2 anos ou já está no radar de curto prazo?",
      "questionType": "card_selector",
      "options": [...],
      "signal_category": "hidden_ambition"
    }
  }
}
```

---

## ANEXO W — RELATÓRIO PREMIUM (AGÊNCIA)

### Conceito
O documento gerado para a agência (quem criou o briefing) é de nível **board-ready** — não apenas um resumo de respostas, mas um deliverable estratégico com seções adaptativas.

### Seções do Relatório (Adaptativas por Packages Ativos)
1. **Executive Summary** — Síntese executiva (sempre presente)
2. **Dados Coletados** — Respostas organizadas por seção
3. **Active Listening Insights** — Sinais detectados nas entrelinhas
4. **Risk & Opportunity Matrix** — Riscos e oportunidades estratégicas (quando pacote strategy/consulting ativo)
5. **Competitor Positioning Map** — Análise de posicionamento vs concorrentes (quando marketing/sales ativo)
6. **Brand DNA Extract** — Extração dos pilares de marca (quando branding ativo)
7. **Brand Health Score** — Score 0-10 com dimensões (quando dados basais ≥ 80%)

### Lógica de Seções Adaptativas
```
IF packages incluem branding → incluir Brand DNA + Brand Health Score
IF packages incluem strategy/consulting → incluir Risk Matrix + Competitor Map
IF basalCoverage < 0.6 → Executive Summary mais cauteloso (menções de lacunas)
```

### Geração
- API: `/api/briefing/document`
- LLM: `max_tokens: 6000` (relatório premium)
- Formato: Markdown estruturado com seções claras
- Editável via `DocumentEditor` pelo cliente e acessível via link/senha

---

## ANEXO X — CONTEXTO ILIMITADO & COMPRIMENTO ADAPTATIVO

### Contexto Completo (Full Context Window)
O motor de briefing envia **100% do histórico** da conversa para a IA em cada chamada. Isso permite:
- Deduções cross-package (inferir respostas de um pacote com base em outro)
- Referências naturais a respostas anteriores
- Detecção de contradições entre respostas distantes
- Eliminação total de perguntas redundantes

**Configuração Admin**: O slider de "History Messages" foi substituído por um indicador "FULL" fixo. A janela de contexto acompanha o tamanho do briefing automaticamente.

### Comprimento Adaptativo (ADAPTIVE_LENGTH Module)
O briefing NÃO tem tamanho fixo — adapta-se ao engagement e contexto:

| Cenário | Range | Gatilho |
|---------|-------|---------|
| Minimal | 8-12 perguntas | Engagement baixo, poucos pacotes |
| Standard | 12-18 perguntas | Engagement bom, 1-2 pacotes |
| Deep | 18-25 perguntas | Engagement alto, 3+ pacotes |
| Máximo absoluto | 30 perguntas | Nunca ultrapassar |

**Smart Deduction**: Quando Package B faria uma pergunta similar a algo já respondido em Package A, a IA infere a resposta automaticamente com `confidence >= 0.70` e `source: "cross_package_deduction"`.

---

## ANEXO Y — REVISÃO PRÉ-FINALIZAÇÃO

### Conceito
Antes de `isFinished=true`, a IA realiza uma checagem obrigatória:

1. **Scan de gaps**: Verifica `basalFieldsMissing` e propósitos dos pacotes ativos
2. **Se engagement != low**: Gera 1-3 perguntas rápidas tácteis para fechar gaps
3. **Se engagement == low**: Infere campos restantes com confiança reduzida (0.5-0.7)
4. **Regra absoluta**: Nunca finalizar com `basalCoverage < 0.5`

### Formato das Perguntas de Fechamento
- Enquadramento: *"Antes de fecharmos, só preciso confirmar rapidamente..."*
- Tipos permitidos: `single_choice`, `boolean_toggle`, `card_selector` (nunca `text`)
- Máximo 3 perguntas de fechamento

### Métricas de Finalização
Quando `isFinished=true`, o AI retorna:
```json
{
  "session_quality_score": 78,
  "engagement_summary": {
    "overall": "high",
    "by_area": {
      "discovery": "high",
      "identity": "high",
      "audience": "medium",
      "visual": "low"
    }
  },
  "data_completeness": {
    "strong_fields": ["nome", "segmento", "publico", "diferencial"],
    "weak_fields": ["tom_comunicacao"],
    "inferred_fields": ["porte", "maturidade_digital"]
  }
}
```

---

## ANEXO Z — PAINEL DE INSIGHTS PÓS-BRIEFING

### Conceito
A página `/dashboard/[id]` exibe um painel premium de insights acima do timeline da conversa. Os dados vêm das métricas de finalização persistidas na sessão.

### Componentes do Painel
1. **Score de Qualidade** — Gauge 0-100 com gradiente de cores e label interpretativo
2. **Engajamento Geral** — Badge com cor (emerald/amber/red) e pulso animado
3. **Cobertura Basal** — Barra de progresso com porcentagem
4. **Pacotes Ativos** — Contador e chips dos slugs
5. **Engajamento por Área** — Grid de cards coloridos por seção do briefing
6. **Completude dos Dados** — Breakdown visual em 3 categorias:
   - 🟢 Campos Sólidos (coleta direta e explícita)
   - 🟡 Campos Fracos (respostas rasas)
   - 🟣 Campos Inferidos (deduzidos pela IA)
7. **Sinais Detectados** — Cards do Active Listening com categoria, resumo e relevância

### Impacto na Decisão da Agência
O painel permite à agência avaliar:
- Se o briefing coletou dados suficientes para começar o projeto
- Quais áreas precisam de follow-up presencial
- Se o cliente estava engajado ou respondeu como "obrigação"
- Quais insights das entrelinhas podem ser explorados estrategicamente

### Schema (DB)
```sql
briefing_sessions.session_quality_score (integer)
briefing_sessions.engagement_summary (jsonb)
briefing_sessions.data_completeness (jsonb)
```

## ANEXO AA — DISCOVERY-FIRST FRAMEWORK ✅ IMPLEMENTADO

### Conceito
O briefing segue um modelo de "entrevista progressiva" com 3 macro-fases. As primeiras perguntas são inteiramente abertas (texto/voz), permitindo que o cliente se expresse livremente. Só depois, o sistema confirma inferências e aprofunda com perguntas estruturadas.

### Macro-Fases

#### FASE 0 — DISCOVERY (Perguntas 1-3 após seleção de idioma)
**Propósito**: Deixar o cliente falar livremente — "dump" inicial.

**Regras de IA**:
- `questionType` OBRIGATORIAMENTE `"text"` — sem exceções
- Perguntas amplas e exploratórias baseadas no contexto completo da sessão
- Intent Engine opera em potência máxima para extrair inferências
- `micro_feedback` SEMPRE `null` durante Discovery
- Sem opções "Outro" — não há opções, apenas texto livre

**Fluxo das 3 perguntas**:
1. **Negócio**: O que faz, quem é, história
2. **Desafio/Motivação**: O que trouxe até aqui, o que precisa
3. **Visão**: Como imagina o resultado ideal, onde quer chegar

**Regras de UX**:
- Badge visual: "Fale livremente — quanto mais detalhes, melhor o resultado"
- Textarea expandido (h-20/h-24)
- Botão de voz destacado com pulse animation infinita
- Placeholder convidativo: "Escreva ou grave um áudio — sem pressa, conte tudo..."
- Botões "Pular" e "Voltar" ESCONDIDOS durante Discovery
- Splash screen menciona: "Vamos começar com uma conversa aberta"

#### FASE 1 — CONFIRMATION (Perguntas 4-8)
**Propósito**: Confirmar inferências e descobrir gaps.

**Regras de IA**:
- SEMPRE referenciar o que o cliente disse na Discovery
- Tipos de pergunta fechados: `boolean_toggle`, `single_choice`, `card_selector`
- Confirmar inferências de alta confiança (>=0.7) com toggles
- Explorar gaps com cards ou choices
- `micro_feedback`: BAIXA frequência (max 1 a cada 3 perguntas), SEM emojis

#### FASE 2 — DEEP DIVE (Perguntas 9+)
**Propósito**: Fluxo normal com toda variedade de inputs.

**Regras de IA**:
- Todos os `questionType` permitidos
- `micro_feedback`: MODERADA frequência (max 1 a cada 3-4 perguntas), SEM emojis
- Segue PACKAGE_ORCHESTRATION para tópicos restantes
- Todos os módulos operam em capacidade total

### Integração com Módulos Existentes
- **RHYTHM_CONTROL**: Regra de variação de tipo SUSPENSA durante Discovery
- **CONSULTANT_PERSONA**: Tom extra caloroso e convidativo durante Discovery
- **ACTIVE_LISTENING_ENGINE**: Opera normalmente em todas as fases
- **INTENT_ENGINE**: Potência máxima durante Discovery para maximizar inferências
- **ENGAGEMENT_MONITOR**: Opera normalmente em todas as fases

### Detecção de Fase
Conta-se o número de respostas do usuário no histórico (excluindo step 0 de idioma):
- `count <= 3` → DISCOVERY
- `count <= 8` → CONFIRMATION
- `count > 8` → DEEP DIVE

