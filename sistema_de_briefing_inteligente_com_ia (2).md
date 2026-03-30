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

## ANEXO S — SISTEMA DE PACOTES DE CATEGORIAS (AI SKILLS)

### Conceito
O sistema permite **multi-seleção de categorias** na criação de cada sessão de briefing. Cada categoria é um **pacote de skill de IA** que injeta prompts especializados no motor conversacional, adicionando **até 10 perguntas únicas** por departamento.

### Arquitetura
- **Tabela**: `briefing_category_packages` (slug, name, description, icon, system_prompt_fragment, max_questions, is_default_enabled, sort_order, department)
- **Sessão**: `briefing_sessions.selected_packages` (JSONB array de slugs)
- **API CRUD**: `/api/briefing/packages` (GET, POST, PUT, DELETE)
- **Admin UI**: `/dashboard/packages` — CRUD completo com editor de system prompt
- **Seleção**: `GenerateLinkModal` — step intermediário com multi-select visual

### Pacotes Disponíveis (14 departamentos)
| # | Slug | Nome | Departamento | Max Q | Default |
|---|------|------|-------------|-------|---------|
| 1 | `visual_identity` | Visual Identity & Applications | branding | 10 | ❌ |
| 2 | `primal_branding` | Primal Branding Complete | branding | 10 | ✅ |
| 3 | `ai_management_system` | AI Management System | technology | ∞ | ❌ |
| 4 | `marketing` | Marketing & Communication | marketing | 10 | ❌ |
| 5 | `ai_customer_service` | AI Customer Service | operations | 10 | ❌ |
| 6 | `finance` | Finance & Revenue | finance | 8 | ❌ |
| 7 | `hr_culture` | HR & Culture | people | 8 | ❌ |
| 8 | `sales` | Sales & Commercial | commercial | 10 | ❌ |
| 9 | `logistics` | Logistics & Operations | operations | 8 | ❌ |
| 10 | `product_innovation` | Product & Innovation | product | 8 | ❌ |
| 11 | `legal` | Legal & Compliance | legal | 8 | ❌ |
| 12 | `it_infrastructure` | IT & Infrastructure | technology | 8 | ❌ |
| 13 | `ecommerce` | E-commerce & Digital | digital | 8 | ❌ |
| 14 | `content_media` | Content & Media | content | 8 | ❌ |

### Tipo de Pergunta: `multi_slider`
Novo `questionType` para perguntas de perfil que medem múltiplas dimensões simultaneamente:
- Renderiza até 8 mini-sliders em grid compacto
- Cada slider tem label, range (1-5), labels min/max
- Resposta é JSON object: `{"dimension1": 3, "dimension2": 5, ...}`
- A IA decide dinamicamente quais sliders gerar com base no contexto do pacote
- Usado primariamente pelo pacote de Marketing, mas disponível para qualquer pacote

### Deduplicação Meta-Prompt
O system prompt principal inclui instruções explícitas:
1. Se uma pergunta do Pacote A já é coberta por outro pacote ou pelos campos basais, NÃO perguntar
2. A IA pode MESCLAR tópicos sobrepostos em perguntas mais ricas e combinadas
3. As perguntas de cada pacote são distribuídas pelas seções relevantes do briefing

### Regras Especiais
- **Primal Branding**: Ativado por padrão. Personaliza cada um dos 7 pilares com base nas respostas anteriores
- **AI Management System**: Sem limite de perguntas. Adapta conforme complexidade da empresa (3 apps vs 15 apps)
- **Marketing**: Inicia com pergunta `multi_slider` para mapear o DNA de marketing em uma única interação

