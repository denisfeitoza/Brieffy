# M3 — IA de texto livre dentro da Brieffy

> **Status:** SPEC STUB. Não codar até as decisões abaixo estarem resolvidas. CLAUDE.md global §8 (swarm discovery) e §15 (agent-sdk-dev) regem essa fase.

## Intenção

Backlog item #5 do usuário: "Criar uma IA de texto para dar possibilidade do usuário fazer todo e qualquer tipo de uso dela já dentro da brieffy."

Tradução: um chat livre com IA dentro do app, fora do fluxo de briefing — pra agência usar como assistente (escrever copy, pensar estratégia, gerar drafts, brainstorm). Não é briefing — é AI-de-uso-geral acoplada ao contexto da agência.

## Decisões pendentes (bloqueiam implementação)

### 1. Escopo: chat livre vs assistente com tools nativas?

- **Opção A — Chat puro**: caixa de texto, modelo único, sem ações dentro do app. Simples. Equivalente a colar ChatGPT dentro da Brieffy.
- **Opção B — Assistente com tools**: chat + agente pode executar ações nativas (criar briefing, listar templates, exportar documento, traduzir, etc). Aciona §8 swarm discovery.
- **Opção C — Híbrido**: chat puro com 2-3 ações específicas (ex: "gerar resumo deste briefing", "traduzir este documento").

→ **Qual?**

### 2. Modelo & custo

OpenRouter já está wireado. Mas chat livre é open-ended → custo pode escalar rápido por usuário.

- Modelo padrão: GPT-4o-mini? Claude Haiku? Mantém o que já está em `aiConfig.ts`?
- Cap de tokens por turno: hoje briefing usa 8000. Chat livre quer 4000? 2000?
- Cap de turnos por sessão / por dia / por mês por usuário?
- Por usuário pago vs free: já tem `briefing_quotas.max_briefings`, precisa de `max_chat_messages`?

→ **Qual modelo e quais limites?**

### 3. Persistência

- Conversa fica salva? Em que tabela? RLS por `user_id`?
- Quanto tempo guarda? (LGPD: 90 dias? indefinido?)
- Cliente final (`/b/[sessionId]`) tem acesso? Ou só dono da agência logado?

→ **Onde guarda e por quanto tempo?**

### 4. Contexto disponível

- IA tem acesso aos briefings do user dentro do chat? (ex: "resuma todos meus briefings desta semana")
- Pode ler templates, packages, branding?
- Pode escrever / atualizar registros? (volta pra decisão #1)

→ **O que a IA vê do estado do usuário?**

### 5. Onde mora na UI

- Botão flutuante (FAB) em todas as páginas autenticadas?
- Página dedicada `/dashboard/assistant`?
- Sheet lateral (slide-out)?
- Integrado dentro de cada briefing como "perguntar à IA sobre este briefing"?

→ **Onde a porta de entrada vive?**

### 6. Guardrails (CLAUDE.md global §4.4)

- Como detectar prompt injection (user manda "ignore previous instructions")?
- Lazy loop refusal: garantir que IA não fica em ping-pong "Quer que eu inclua X?"
- Conteúdo proibido: budget, dados sensíveis, jailbreaks?
- Rate limit por IP/user?

→ **Quais guardrails são MUST-HAVE pro v1?**

### 7. Eval

- Como sabemos que a feature está funcionando? Métricas: taxa de uso, NPS, % de mensagens com follow-up, custo médio por sessão?
- Casos de teste mínimos pra rodar ANTES de cada deploy desse módulo?

→ **Qual o sinal de saúde da feature?**

## Setup técnico requerido antes de implementar

Conforme CLAUDE.md global §15.2 e §15.3:

```sh
/plugin marketplace add anthropics/claude-plugins-official
/plugin install agent-sdk-dev@claude-plugins-official
npm i @anthropic-ai/claude-agent-sdk
```

(O agent-sdk-dev é Claude Code plugin — instala localmente. O SDK é dependência do projeto.)

## Sugestão de ordem (uma vez decididas as questões acima)

1. `/gsd-ai-integration-phase` — formaliza AI-SPEC.md completo com decisões 1–7 cravadas.
2. Schema migration: tabela `assistant_conversations` + `assistant_messages` (se persistir) ou nada (se efêmero).
3. Endpoint `/api/assistant/chat` com Agent SDK.
4. Componente `<AssistantPanel />` integrado conforme decisão #5.
5. Eval suite mínima (3-5 casos de teste em CI).
6. Telemetria de uso (logar em `api_usage` com `endpoint='assistant'`).
7. Lançar como opt-in pra usuários premium primeiro (decisão #2 se aplicável).

## Anti-padrões a evitar

- Empilhar isso em cima do prompt do briefing — são jobs-to-be-done diferentes, prompt separado.
- Reusar `briefing_interactions` pra mensagens do chat — schema diferente.
- Pular eval/guardrails "pra ir rápido" — chat livre tem superfície de ataque maior que briefing.
