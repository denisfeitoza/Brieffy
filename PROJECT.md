# Brieffy — Product Requirements Document

> Briefings inteligentes com IA — substitui a reunião de descoberta de 2h por uma conversa adaptativa de 5min, com diagnóstico, score, documento e estratégia gerados automaticamente.
>
> **Status:** v0 (escrito a partir do código vivo + `sistema_de_briefing_inteligente_com_ia (2).md` + landing existente). Próxima revisão: quando a Onda 5/6/7 começar.

---

## 1. Problema & usuário

Agências e profissionais autônomos perdem horas em briefings repetitivos: reuniões longas com clientes, perguntas desconectadas, retrabalho por dados faltando, e PDF final que ninguém usa. O custo real é **retrabalho** (60-90% das primeiras entregas) e **tempo de operação** (cada briefing = 2-4h de reunião + transcrição + síntese).

Brieffy ataca pela ponta do cliente: o cliente recebe um link, responde em 5-15min com IA adaptativa que pula campos já preenchidos, e a agência recebe o briefing estruturado pronto pra usar — com score, insights, e documento final.

## 2. Personas & papéis

| Papel | Quem é | Permissão | O que faz |
|---|---|---|---|
| **Agência (owner)** | Dono(a) ou operador da agência | Login obrigatório, RLS por `user_id` | Cria template, configura skills, gera link, edita branding, vê dashboard, exporta documento |
| **Cliente da agência** | Quem responde ao briefing | Sem login. Acesso via link (`/b/[sessionId]`), opcionalmente gateado por senha (`edit_passphrase` ou `access_password`) | Responde via texto/voz/clique. Não vê nada da plataforma, só a marca da agência (white-label) |
| **Admin Brieffy** | Operador da plataforma | `briefing_profiles.is_admin = true` | Vê todos os briefings, usuários, custos de API, métricas globais. Bloqueia/desbloqueia contas |

## 3. Core jobs-to-be-done (top 5)

1. **Cliente responde sem fricção em até 15min** → métrica: tempo médio de conclusão, taxa de abandono mid-session
2. **Agência recebe briefing 90% completo de primeira** → métrica: `basal_coverage` médio ≥ 80% na finalização, taxa de retrabalho pós-entrega
3. **IA não repete o que o cliente já respondeu** → métrica: count de duplicates detectados por dedupe guard ([fixado em Onda 1.B](src/app/api/briefing/route.ts))
4. **Agência customiza voz/perguntas por nicho via skills** → métrica: número de skills usadas por template, distribuição de skills selecionadas
5. **White-label genuíno: cliente nunca vê "Brieffy"** → métrica: branding aplicado (logo + cor + nome) sem leak da marca-mãe nas telas do cliente

## 4. Escopo

### Dentro do escopo (v1.x atual)

- Briefing público em `/b/[sessionId]` (sem login do cliente)
- IA adaptativa via OpenRouter / Groq (multi-provider com fallback)
- 15+ skills pré-configuradas (brand DNA, market analysis, campaign launch, digital presence, customer experience, business model — em `prompts/skills/`)
- Multi-idioma (pt-BR, EN, ES) — detecção e adaptação
- Multi-modal: texto, voz (Whisper), card selector, multiple choice, color picker, slider
- White-label: logo, cor primária, cor accent, nome da empresa, tagline
- Score automático (clareza de marca, clareza de dono, público, maturidade)
- Geração de documento final em Markdown (renderizado via Tiptap pro editor)
- Tradução do documento final (PT/EN/ES)
- Senha de acesso opcional ([unificada na Onda 1.A](src/app/api/briefing/verify-access/route.ts))
- Quotas por usuário (`briefing_quotas.max_briefings`)
- Tracking de custo de API (`api_usage`)
- Dashboard básico do owner (lista briefings, vê detalhes, edita, deleta, traduz)
- Admin panel básico (lista users, vê custos, ativa/desativa contas)

### Fora do escopo (v1.x)

- ~~White-label premium com paleta customizável de 3 cores~~ (decisão do usuário em 2026-05-28 — não vai ter por enquanto)
- Equipes / multi-tenant (Onda 7 — backlog)
- IA de texto livre (Onda 6 — backlog)
- Integrações nativas com Notion / Linear / ClickUp (futuro)
- Sistema de feedback do cliente sobre o documento (futuro)
- Mobile app nativo (sempre será web-first, mobile-responsive)

### Deferred (com gatilho de re-avaliação)

- **Stripe billing / planos pagos** — gatilho: quando atingir 50+ usuários ativos ou pedido recorrente de upgrade
- **Webhooks pra integração com CRM** — gatilho: quando 3+ clientes pedirem
- **Versão Enterprise** — gatilho: deal direto com agência ≥10 funcionários

## 5. Métricas de sucesso

| Métrica | Hoje (estimativa) | Alvo v1.5 |
|---|---|---|
| Tempo médio de conclusão pelo cliente | 5-15min (variável) | mediana ≤ 10min |
| Taxa de abandono mid-session | desconhecida — instrumentar | < 30% |
| `basal_coverage` médio na finalização | ~80% (baseado em `briefing_sessions.basal_coverage`) | ≥ 85% |
| Briefings finalizados / criados | ~50% (35 totais, 7 finished com passphrase visíveis em DB) | ≥ 70% |
| Custo médio por briefing | trackeado em `api_usage` | < $0,10 USD |
| Taxa de duplicação de pergunta (detectada por dedupe) | era alta (Onda 1.B revelou steps 8/9/42 e 3/29) | < 5% após fix |

## 6. Constraints

- **Mobile-first obrigatório** ([CLAUDE.md global §3.4](CLAUDE.md)): touch targets ≥ 44px, viewport 320px+, sem hover-only
- **LGPD**: dados do cliente respondedor são PII. Não logamos full text em api_usage. RLS em todas as tabelas
- **Stack travada**: Next.js 16 + Supabase (DB+Auth+Storage+Realtime) + OpenRouter (LLM principal) + Groq (LLM fallback)
- **Sem CRM próprio** — todo CRM da agência vive na própria agência. Brieffy só entrega o briefing
- **Sem chat livre com IA** ainda (vai ser Onda 6) — IA é estritamente conversacional dentro do fluxo de briefing
- **Hosting**: provedor atual (provavelmente Vercel — sem Dockerfile no repo, deploy via push em `main`)

## 7. Integrações & superfícies externas

| Sistema | Tipo | Tabela / arquivo |
|---|---|---|
| Supabase (DB + Auth + Storage) | Backend principal | `vnjbtflgemwvjrcrvuse.supabase.co` |
| OpenRouter | LLM gateway (primary) | `src/lib/aiConfig.ts` |
| Groq | LLM fallback + Whisper para STT | `src/lib/aiConfig.ts`, `src/app/api/transcribe/route.ts` |
| Sentry | Erros (configurado se `SENTRY_DSN` setado) | `instrumentation.ts` |
| Vercel/host | Deploy via push em `main` | sem Dockerfile (avaliar pra próxima rodada se mudar pra VPS) |

## 8. Modelo de dados (sketch)

Tabelas principais (verificadas no Supabase Project `vnjbtflgemwvjrcrvuse`):

- `briefing_profiles` — dono da agência (`id` = `auth.users.id`, `display_name`, `company_name`, `logo_url`, `brand_color`, `brand_accent`, `tagline`, `is_admin`, `is_onboarded`)
- `briefing_templates` — molde reusável por agência (`user_id`, `name`, `briefing_purpose`, `depth_signals`)
- `briefing_sessions` — instância de um briefing pra um cliente (`user_id`, `template_id`, `session_name`, `selected_packages`, `access_password`, `edit_passphrase`, `status`, `company_info`, `messages_snapshot`, `final_assets`, `chosen_language`, `current_step_index`, `basal_coverage`)
- `briefing_interactions` — Q&A turno a turno (`session_id`, `step_order`, `question_text`, `question_type`, `user_answer`, `inferences`, `detected_signal`)
- `briefing_category_packages` — skills disponíveis (slug, name, icon, department, tier)
- `briefing_quotas` — `user_id`, `max_briefings`, `is_blocked`
- `api_usage` — log de custo por chamada LLM

RLS posture: todas as tabelas têm RLS ON. Service role só usado server-side (`SUPABASE_SERVICE_ROLE_KEY` em routes específicas). IDOR defense-in-depth (filtro por `user_id` mesmo com RLS).

## 9. Non-functional requirements

| NFR | Hoje | Alvo |
|---|---|---|
| **Auth** | Email/senha via Supabase Auth + captcha matemático | OAuth Google planejado, sem ETA |
| **RLS** | ON em todas as tabelas | Manter |
| **Audit** | `api_usage` para custos. Sem audit log de ações administrativas | Adicionar quando Onda 7 (equipes) for planejada |
| **Observability** | Sentry (opt-in). Logs em stdout | PostHog para product analytics — deferred |
| **Performance budget** | LLM call 5-15s; geração de documento 10-30s | Manter; cap em 45s pra translate |
| **Accessibility** | Básico (labels semânticos, focus states). Sem auditoria formal | A11y pass na Onda 4 (polish briefing) |
| **i18n** | pt-BR / EN / ES — frontend e prompts | Manter os 3, sem adição prevista |

## 10. Risk register (top 5)

| # | Risco | Likelihood | Impact | Mitigação |
|---|---|---|---|---|
| 1 | LLM provider down (OpenRouter / Groq) | Médio | Alto | Multi-provider fallback já implementado. Cap retries=3 ([src/app/api/briefing/route.ts](src/app/api/briefing/route.ts)) |
| 2 | Senha do briefing exposta no link compartilhado | Baixo (UX manda na mesma mensagem) | Médio | Documentar pra agência. Não tem fix técnico — é fluxo de UX |
| 3 | Cliente abandona mid-session por demora da IA | Médio | Alto | Streaming não existe; UX mostra "Pensando…" + cap de 30s. Loading splash mostra branding |
| 4 | Custo LLM cresce sem cap | Médio | Alto | `briefing_quotas.max_briefings` por usuário. `api_usage` tracking. Alert manual via admin dash |
| 5 | RLS misconfigurada vaza dados entre agências | Baixo | Crítico | Todas tabelas RLS ON + defense-in-depth com `eq('user_id', user.id)` em todas as queries. Audit periódico |

## 11. Milestone plan

### M0 — Hotfix wave (Onda 1, 2026-05-28) ✅ COMPLETA

- ✅ Bug #7: senha não exigida (`edit_passphrase` agora libera o gate)
- ✅ Bug #8: briefing repete perguntas após 15 turnos
- ✅ Bug #9: tradução pós-briefing falhava silenciosamente
- ✅ Bug #10: mobile "site não é seguro" (HSTS + iOS audio webm)

### M1 — Polish + PRD (Onda 2-4) 🔄 EM ANDAMENTO

- ✅ Onda 2: PROJECT.md (este arquivo) + ROADMAP.md + `.planning/`
- ⏳ Onda 3: polish landing page (ícones transparentes, paleta, anti-IA-vibe)
- ⏳ Onda 4: polish briefing UX (ENTER pra adicionar, sem bandeiras, skills mais fáceis, calibrar prompt)

### M2 — Admin tooling (Onda 5)

- Melhorar dashboard admin (descoberta pendente — exige conversa com o usuário sobre o que está doendo)

### M3 — IA de texto livre (Onda 6) ✅ v1 ENTREGUE (2026-05-28)

Implementado autonomamente com decisões conservadoras documentadas (ver [.planning/M3/AI-SPEC.md](.planning/M3/AI-SPEC.md)):

- **Escopo (decisão #1)**: chat puro, sem tools nativas. Sem acesso a briefings/templates/DB. Atualização pra assistant-with-tools fica pra v2.
- **Modelo & custo (decisão #2)**: usa `getLLMConfig()` (mesmo que briefing — OpenRouter primary). 2000 max_tokens/turno, 10 msgs/hora + 50 msgs/mês por usuário, max 20 turnos por conversa.
- **Persistência (decisão #3)**: tabelas `assistant_conversations` e `assistant_messages` (RLS por `user_id`, verificada empíricamente — user B vê 0 quando A insere). Retenção indefinida, user pode deletar.
- **Contexto (decisão #4)**: assistente NÃO tem acesso aos dados do usuário. System prompt explicitamente refusa essa integração e direciona ao fluxo de briefing.
- **UI (decisão #5)**: página dedicada em `/dashboard/assistant` com sidebar de conversas + main chat. Entrada no sidebar (desktop + mobile).
- **Guardrails (decisão #6)**: system prompt com refusal de jailbreak / credenciais / vazamento de modelo, e aviso explícito sobre dados sensíveis (LGPD posture).
- **Eval (decisão #7)**: deferido — instrumentação via `api_usage` (`endpoint='assistant'`) já está logando custo. Eval formal vira ação se métricas mostrarem problema.

Rotas implementadas: [POST /api/assistant/chat](src/app/api/assistant/chat/route.ts), [GET /api/assistant/conversations](src/app/api/assistant/conversations/route.ts), [GET+DELETE /api/assistant/conversations/[id]](src/app/api/assistant/conversations/[id]/route.ts).

Migration: [supabase/migrations/20260528_assistant_chat_tables.sql](supabase/migrations/20260528_assistant_chat_tables.sql).

UI: [/dashboard/assistant](src/app/dashboard/assistant/page.tsx) + [AssistantChat.tsx](src/components/dashboard/AssistantChat.tsx).

**Próximas decisões** (quando virem dados de uso): ativar tools nativas? Subir limites? Permitir contexto de briefings? — voltar ao AI-SPEC stub.

### M4 — Perfil de equipes (Onda 7)

- Multi-tenant pra agências com vários funcionários. Mexe em: schema (org/team/membership), RLS (todas tabelas), auth (convites, roles), billing (assento), UI (switcher). Fase pesada — exige PRD próprio + threat model

## 12. Open questions

- **Hosting**: O CLAUDE.md global diz VPS+Docker default — mas o projeto vive sem Dockerfile e foi nascido com Vercel/PaaS. Decidir: migrar pra VPS ou aceitar Vercel como exceção neste repo?
- **Métricas instrumentadas**: hoje não temos PostHog/Mixpanel. Como vamos medir taxa de abandono mid-session? Adicionar em M1 ou deferred?
- **Plano free vs pago**: `briefing_quotas.max_briefings` existe mas não há Stripe wireado. Quando ativar billing?
- **Onboarding flow**: `briefing_profiles.is_onboarded` existe mas o fluxo de onboarding pós-registro precisa revisão (está dropping users)
- **Templates compartilháveis entre agências**: vale a pena? Marketplace de templates?

---

> **Nota de processo**: este PRD foi escrito como v0 a partir de evidência (código + spec original + landing) sem o debate sectional de §7 do CLAUDE.md global, porque o usuário pediu execução autônoma da Onda 1 até a Onda 7. Próxima revisão deve passar pelo debate completo antes de iniciar Onda 6 (IA texto livre) ou Onda 7 (equipes).
