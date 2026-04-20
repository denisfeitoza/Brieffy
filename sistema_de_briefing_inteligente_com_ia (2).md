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
- **Acesso Simplificado**: Links de briefing possuem segurança opcional via senha de documento (passphrase), eliminando a necessidade de senhas redundantes de acesso inicial e reduzindo o atrito para o cliente. Se o campo for deixado em branco, o link será público.

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

---

# 📎 ANEXO U — LÓGICA DE PROGRESSO ONISCIENTE (OMNISCIENT PROGRESS) ✅ IMPLEMENTADO

## 🧠 Conceito
A barra de progresso não deve ser apenas um reflexo linear de perguntas, mas um indicador psicológico de avanço que garante que o usuário nunca se sinta "parado" e que a finalização seja sempre celebrada.

## ⚙️ Regras de Cálculo (`displayProgress`)

### 1. Diluição por Complexidade (Skill Dilution)
O progresso é escalado com base no número de **Pacotes de IA (Skills)** selecionados.
- Mais skills = mais profundidade esperada.
- A lógica aplica um fator de diluição para evitar que a barra chegue a 100% antes de cobrir os objetivos de todos os pacotes.

### 2. Piso de Percepção (Progress Floor)
Garante que cada interação do usuário resulte em um avanço visual, mesmo que a IA ainda esteja em fase de exploração profunda.
- **Avanço Mínimo**: ~4% por step (pergunta respondida).
- **Impacto**: Elimina a sensação de "barra travada" em briefings longos.

### 3. Teto de Briefing (Briefing Cap)
Durante a fase de perguntas, o progresso é limitado a **95%**.
- Os últimos 5% são reservados exclusivamente para a transição de **Geração de Documento**.
- Isso evita a desilusão de ver "100%" e ainda receber mais perguntas.

### 4. Conclusão Forçada
- **Estado 'Finish'**: Ao detectar que o documento foi gerado ou o briefing foi finalizado (`isFinished`), a barra salta instantaneamente para **100%**.
- **Estado 'Upload'**: Se o usuário atingir a tela de gatilho manual de geração, a barra também é forçada a **100%**.

## 🎨 Especificações Visuais (Design System)
- **Cor Primária**: Laranja Brieffy (`#ff6029`).
- **Indicador**: "Accent Pill" (Pílula de destaque) no header com fundo `#FFF2ED` e texto bold.
- **Animação**: Transição de largura suave (0.8s) com easing `easeOut` para uma sensação premium.

---

# 🛡️ ANEXO V — SEGURANÇA, VALIDAÇÃO E RATE LIMIT (HARDENING) ✅ IMPLEMENTADO

> Esta seção documenta as regras de segurança, validação de input e rate limiting introduzidas pela auditoria de bugs e melhorias. Toda nova rota / feature DEVE seguir estas regras.

## 1. 🔐 Headers de Segurança Globais

Aplicados em `next.config.ts` (`async headers()`) **e** em `src/proxy.ts` (middleware) para garantir cobertura mesmo quando a resposta vem de uma redireção interna do middleware.

| Header | Valor | Por quê |
|---|---|---|
| `X-Frame-Options` | `SAMEORIGIN` | Bloqueia clickjacking (iframe externo). |
| `X-Content-Type-Options` | `nosniff` | Impede que browsers "adivinhem" MIME e executem texto como script. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Não vaza paths internos para sites de terceiros. |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=(), payment=()` | Microfone só para gravação interna (transcribe). Demais APIs bloqueadas. |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (apenas em produção) | Força HTTPS por 2 anos. |

## 2. 🚦 Rate Limiting (Vercel KV / Upstash Redis)

`src/lib/rateLimit.ts` é **assíncrono** (`await checkRateLimit(...)`) e usa um store distribuído quando há credenciais Upstash; cai para in-memory em dev. Em produção sem KV configurado, emite warning único.

### Variáveis de ambiente reconhecidas (qualquer combinação)
```
KV_REST_API_URL=...        KV_REST_API_TOKEN=...
UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=...
```

### Limites aplicados (janela de 60s salvo indicado)

| Endpoint | Escopo | maxRequests |
|---|---|---|
| `POST /api/briefing` | `user.id` ou IP | conforme já existente |
| `POST /api/briefing/generate-dossier` | `dossier:user.id` | 10 |
| `POST /api/briefing/summarize-document` | `summarize_doc:user.id` | 20 |
| `POST /api/briefing/suggest-packages` | user.id ou IP | 30 |
| `POST /api/analyze-document` | `analyze_doc:user.id` | 20 |
| `POST /api/transcribe` | user.id ou IP | 30 |
| `POST /api/briefing/verify-access` | IP+session: 5/15min, session: 50/15min | brute-force protection |

Toda resposta 429 inclui `{ error, retryAfter, resetAt }` para o cliente esperar o tempo correto.

## 3. 🪪 Ownership / IDOR

- Toda rota que aceita um identificador externo (`sessionId`, `templateId`, `briefingId`) **deve** validar que o recurso pertence ao `auth.uid()` antes de qualquer escrita ou chamada LLM.
- Quando se usa `supabaseAdmin` (service role), a checagem **não** é opcional — RLS é ignorada.
- Implementado em:
  - `POST /api/briefing/generate-dossier` (session.user_id)
  - `POST /api/sessions/generate` (template.user_id)
  - `PATCH /api/sessions/[id]` (`.select('id')` confirma update real → 404 se zero linhas)
  - `DELETE /api/templates/[id]` (verifica erro de cada cascade delete antes de prosseguir)

## 4. 🎯 Validação de Input

### URLs (SSRF)
- `analyze-document`: `isAllowedFileUrl()` permite **somente** o bucket Supabase configurado ou hosts em `ANALYZE_DOC_ALLOWED_HOSTS`. Bloqueia http://, IPs internos, links externos.

### Redirects (Open Redirect)
- `auth/callback`: `safeNextPath()` aceita só paths relativos (`/...`), bloqueia `//`, `/\\`, esquemas (`/path:`) e strings >512 chars. Fallback: `/dashboard`.

### Uploads
- `upload-logo`: allowlist explícita `image/png | image/jpeg | image/webp`. **SVG removido** (vetor de XSS via `<script>` interno). Extensão derivada do MIME validado (não do `file.name`).
- `analyze-document`: `MAX_DOWNLOAD_BYTES = 15MB` (Content-Length + verificação real do buffer). Heurística `looksBinary()` substitui detecção falha por `\x00`.
- `transcribe`: `MAX_AUDIO_BYTES = 25MB` (limite Whisper).

### Numéricos
- `packages POST/PUT`: `max_questions` clampeado em `[1, 50]`, `sort_order` em `[0, 9999]`.
- `aiConfig.ts`: helper `toFiniteNumber(raw, fallback, {min, max, integer})` aplicado a `temperature` (0-2), `max_tokens` (64-32000), `maxHistory`, `timeoutMs`, `basalThreshold`. Garante que `NaN`/`Infinity` nunca chegam ao payload do LLM.

### Strings em Prompts (Prompt Injection)
- `summarize-document`: `sanitizeFileName()` remove caracteres de controle e limita tamanho antes de injetar `fileName` no system prompt.

## 5. 📭 Não Vazar Erros Internos

Catches em rotas API retornam mensagens **genéricas** (`"Internal error"`, `"Failed to fetch packages"`). `error.message`, `error.stack` e `details` **nunca** são enviados ao client. Logs detalhados ficam apenas em `console.error` (visível só no servidor).

## 6. 🎨 Resiliência Visual / Frontend

- `getContrastColor()`: valida regex `^[0-9a-f]{3}$|^[0-9a-f]{6}$/i`, fallback `#ffffff`.
- `DashboardClient`: `basal_coverage` clampeado para `[0, 1]` antes de calcular `%` da barra.
- `MultiSliderQuestion` / `DynamicInput`: re-sincronizam estado quando `props` mudam (signature de `sliders`/`initialValues`/`activeMessage.userAnswer`).
- `TypeformWizard`: `setDirection` movido para `useEffect` (evitar re-render infinito).
- `BriefingContext.submitAnswer`: usa `snapshotMessages` (não a state stale) ao logar interação.
- `ensureSessionInDb`: idempotente via `inflightSessionPromises` map (evita duplicação por double-click / Strict Mode).
- `exportZip`: `folderName` recebe sufixo `_{idSuffix}` para evitar colisão entre sessões com mesmo nome.

## 7. 📱 Mobile / A11y / Performance

- **Tap targets**: mínimo 44×44px em `DocumentEditor`, `dashboard/layout`, link "Powered by".
- **Logos**: migrados para `next/image` com `unoptimized` para SVG. Bucket Supabase já em `images.remotePatterns`.
- **HeroSection**: respeita `prefers-reduced-motion` E viewport `(max-width: 767px)` → reduz ambient particles 12→4 e orbital 5→2.
- **AILoadingSplash**: input de senha agora tem `<label htmlFor>`, `aria-label`, `aria-invalid`, `aria-describedby`, `autoComplete="current-password"`.
- **Bundle**: `exportZip` (JSZip + file-saver) carregado via dynamic import sob demanda no dashboard.
- **Storage do briefing**: trocado de `localStorage` para `sessionStorage` — dados sensíveis não persistem em dispositivos compartilhados.

## 8. ⚙️ TanStack Query — Defaults Globais

`src/app/providers.tsx`:
```ts
new QueryClient({
  defaultOptions: {
    mutations: { retry: 0 },          // nunca duplicar ações destrutivas (delete, dossier, charge)
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,    // não destruir input do usuário ao trocar de aba
    },
  },
});
```

## 9. 🌐 i18n — Strings Consolidadas

Adicionadas em `src/i18n/dashboardTranslations.ts` (PT/EN/ES):
- `dashboard.untitled`
- `status.finished` / `status.in_progress` / `status.pending`

Toda nova string visível ao usuário **deve** entrar em um arquivo de i18n — nunca hardcoded em JSX.

## 10. ✅ Checklist para novas rotas/features

Antes de fazer merge:
- [ ] Auth checada (`supabase.auth.getUser()`).
- [ ] Ownership do recurso validada (não confiar só em RLS quando usar service role).
- [ ] `await checkRateLimit(...)` com escopo `feature:user.id` ou `feature:ip:{ip}`.
- [ ] Inputs numéricos clampeados (range definido).
- [ ] Strings vindas do usuário sanitizadas antes de irem para LLM.
- [ ] URLs externas validadas contra allowlist (SSRF).
- [ ] Upload com MIME allowlist + size cap.
- [ ] Catches retornam mensagem genérica; detalhe só em `console.error`.
- [ ] Headers de segurança herdados de `next.config.ts` (não sobrescrever).
- [ ] Strings visíveis em `src/i18n/*`.

---

# 📎 ANEXO W — IA, CUSTOS E ROBUSTEZ DO MOTOR (AUDITORIA 2) ✅ IMPLEMENTADO

> Captura as decisões da segunda auditoria (28 itens P0/P1/P2). Mantém a memória institucional sobre **por que** cada controle existe — o motor LLM é caro e frágil, então toda mudança passa por: custo, observabilidade, segurança e UX.

## 1. 🔐 Admin Supabase Centralizado (`src/lib/supabase/admin.ts`)

- Único módulo autorizado a instanciar o cliente com `SUPABASE_SERVICE_ROLE_KEY`.
- `getSupabaseAdmin()` lança imediatamente se a chave estiver ausente — usado em rotas críticas (onboarding, settings, quota, briefing writes).
- `getSupabaseAdminOptional()` retorna `null` com warning — reservado para caminhos não-críticos (ex.: `usageLogger`), onde silenciar é aceitável.
- **Por quê**: antes existiam fallbacks silenciosos para `anon`, mascarando bugs em produção e permitindo escritas que nunca chegavam ao banco.

## 2. 💸 Logger de Custo de IA (`api_usage`)

- Toda chamada LLM (briefing, dossier, suggest-packages, colors, analyze-document, transcribe, translate) passa por `usageLogger`.
- Loga: `provider`, `model`, `route`, `prompt_tokens`, `completion_tokens`, `total_tokens`, `cost_usd_cents` estimado, `latency_ms`, `status`.
- Tabela `api_usage` é a fonte da verdade para o painel admin de custos.
- **Por quê**: sem isso, regressão de custo (modelo trocado, prompt inflado, retry storm) só era percebida na fatura.

## 3. ♻️ Compactação de Estado e Histórico

- `compactCurrentState` / `compactFullState` filtram chaves vazias, truncam strings longas e limitam arrays antes de irem ao LLM.
- `compactHistory` aplica o mesmo princípio ao histórico do dossier final.
- **Por quê**: contexto inflado = custo linear + risco de estourar `maxTokens` e devolver JSON quebrado. Compactar antes do envio é o controle mais barato.

## 4. 🌍 Idioma Intransigente

- `GOLDEN_RULES` carrega regra explícita: a IA responde **sempre** em `targetLang`.
- `compileSystemPrompt` injeta `buildLanguageRule(targetLang)` dinamicamente.
- `suggest-packages` recebe `chosenLanguage` do cliente; eliminamos o "in Portuguese" hardcoded.
- **Por quê**: usuário escolhia inglês e recebia pacote em PT — quebra de confiança imediata.

## 5. 🚫 Markdown Proibido em UI Direta

- `buildOutputFormat` declara que `nextQuestion.text` e `options[].label` devem ser **plain text**.
- Frontend renderiza esses campos sem parser — qualquer `**` ou `#` viraria literal.

## 6. 🎛️ Sampling Configurável (`top_p`, `presence_penalty`, `frequency_penalty`)

- `aiConfig.LLMConfig` e `SettingsOverride` aceitam os três parâmetros.
- `app_settings` no admin pode sobrescrever sem deploy.
- Aplicado na rota principal de briefing e no fallback.
- **Por quê**: permite calibrar criatividade vs. consistência por ambiente sem mexer em código.

## 7. 🛡️ Sanitização de `system_prompt_fragment`

- `buildPackagePrompts` passa `pkg.name` e `pkg.system_prompt_fragment` por `sanitizeFragment` antes de costurar no prompt final.
- Remove tags suspeitas (`<system>`, `</system>`, `<|im_start|>`, etc.) e limita comprimento.
- **Por quê**: admin malicioso (ou prompt injection via copy/paste) poderia reescrever GOLDEN_RULES.

## 8. 🔁 LLM Fallback no Último Retry

- Após `MAX_RETRIES - 1` falhas, a rota principal usa `getLLMFallbackConfig()` (modelo alternativo configurado em `app_settings`).
- Mantém o briefing vivo quando o provedor primário está degradado.
- Fallback também propaga `top_p`/penalties.

## 9. 🧨 AbortController em Fetches LLM

- Toda chamada server→LLM tem `AbortController` com `timeoutMs` vindo de `app_settings`.
- Cliente desconectou? Cancelamos o upstream e paramos de pagar tokens órfãos.

## 10. 🪪 Validação de Env (`src/lib/env.ts`)

- `assertServerEnv()` roda no primeiro toque de qualquer client admin.
- Lança para vars **obrigatórias** ausentes (fora do build phase do Next).
- Avisa para vars opcionais (LLM, Stripe).
- Proxy `ENV` provê acesso tipado ao restante do código.

## 11. 📜 Logger Estruturado (`src/lib/logger.ts`)

- `createLogger(scope)` retorna `{ debug, info, warn, error }`.
- `debug`/`info` são no-op em produção; `warn`/`error` sempre emitem JSON estruturado.
- Substituiu `console.log` em `api/briefing`, `analyze-document`, `colors`, `transcribe`, `generate-dossier`.

## 12. 🛟 Error Boundaries

- `src/app/error.tsx` → fallback de rota com botão "Tentar novamente" + `digest` do erro.
- `src/app/global-error.tsx` → fallback do root layout (HTML/CSS puros, sem dependências).
- Combinado com Sentry para correlação por `digest`.

## 13. 🔗 OG Dinâmico em `/b/[sessionId]`

- `generateMetadata` lê `briefing_purpose` e `session_name` para gerar título/descrição.
- Link compartilhado mostra contexto real, não placeholder genérico.

## 14. 🪙 Concurrency Otimista em `briefing_sessions`

- Coluna `version` (integer, default 0).
- `updateSessionStateInDb(sessionId, state, expectedVersion?)` faz `UPDATE ... WHERE version = expectedVersion` e retorna `{ ok, conflict, newVersion }`.
- Caller que não passa `expectedVersion` mantém o comportamento legado (compat).
- **Por quê**: previne sobrescrita silenciosa quando duas abas/clientes salvam ao mesmo tempo.

## 15. 📦 `xlsx` → `@e965/xlsx`

- Substituído pelo fork mantido com patches de CVEs conhecidas.
- Import e mensagem de erro em `analyze-document` atualizados.

## 16. 🧭 RPC `create_session_if_under_quota`

- Atomic: confere quota e cria sessão na mesma transação.
- Substitui o padrão "SELECT count + INSERT" (race-condition em quotas).

## 17. 🧼 Sanitização de `hint`/`context` em `colors/route.ts`

- Strings vindas do cliente são truncadas e escapadas antes de irem ao prompt — bloqueia prompt injection mirando a paleta.

## 18. 🛡️ DOMPurify no `DocumentEditor`

- HTML proveniente de tradução/IA passa por DOMPurify antes de ir ao Tiptap.
- Remove `<script>`, `on*` handlers, `javascript:` URLs.

## 19. ♿ Overlay Mobile do Admin

- Recebe `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- Focus trap próprio (sem dep), `Escape` fecha, foco volta ao trigger.
- `body.overflow = hidden` enquanto aberto.

## 20. 🎚️ `viewport` Export Separado

- `src/app/layout.tsx` agora exporta `const viewport: Viewport` ao lado do `metadata`.
- Atende ao requisito do Next 14+ e habilita `themeColor` light/dark + `viewportFit: cover` (notch).

## 21. 🧰 TranslateDocumentAction Controlado

- Dropdown agora usa `open` controlado em vez de `document.body.click()`.
- Re-tradução fecha o menu via `setOpen(false)` — sem efeitos colaterais em outros listeners.

## 22. 🧩 `getSessionById(id, userId?)`

- Aceita `userId` opcional para reforçar ownership server-side antes de devolver o registro.
- Padrão recomendado em qualquer rota autenticada que toque `briefing_sessions`.

## 23. 🧪 `isDepthQuestion` (legado)

- Marcado como deprecated em `src/lib/types.ts`.
- Não usar em lógica nova; mantido apenas para compat de payloads antigos.

## ✅ Checklist de Regressão (rotas LLM)

Antes de mergear qualquer rota nova que chame LLM:

- [ ] `usageLogger` registrando custo + latência.
- [ ] `AbortController` ligado ao request do cliente.
- [ ] Inputs do usuário passam por sanitização antes do prompt.
- [ ] Estado/histórico passam por `compact*` antes de serializar.
- [ ] `targetLang` propagado e enforced na regra de idioma.
- [ ] Fallback de modelo configurado para o último retry.
- [ ] Markdown proibido em campos plain-text da UI.
- [ ] `console.log` substituído por `createLogger(scope)`.
- [ ] `getSupabaseAdmin()` (estrito) em writes; `getSupabaseAdminOptional()` só em logging.
- [ ] Concurrency otimista (`expectedVersion`) em writes de sessão concorrentes.

