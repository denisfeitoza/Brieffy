# Brieffy — Roadmap

Backlog vivo. Fonte da verdade pra ondas/fases. Atualizado a cada commit que feche uma onda.

> Detalhe de cada item está em [PROJECT.md](PROJECT.md). Decisões de produto e trade-offs ficam lá; aqui é só o que/quando.

## Status por onda

| Onda | Escopo | Status | Commit/PR |
|---|---|---|---|
| **1.A** | Bug #7 — senha não exigida | ✅ Done | `89a75d9` |
| **1.B** | Bug #8 — briefing repete perguntas | ✅ Done | `41f8711` |
| **1.C** | Bug #9 — tradução pós-briefing falhava | ✅ Done | `e911fc8` |
| **1.D** | Bug #10 — "site não é seguro" mobile + iOS audio | ✅ Done | `ab4b1ad` |
| **2** | PROJECT.md + ROADMAP.md + `.planning/` | 🔄 In progress | — |
| **3** | Polish landing (ícones, paleta, anti-IA-vibe) | ⏳ Backlog | — |
| **4** | Polish briefing UX (ENTER, sem bandeiras, skills, calibragem prompt) | ⏳ Backlog | — |
| **5** | Melhorar dash do admin (#12 do backlog do usuário) | ⏳ Backlog — discovery pendente | — |
| **6** | IA de texto livre (#5 do backlog) | ✅ v1 entregue (chat puro, sem tools) | `69180ea` + `a8e7edf` + `ae43485` |
| **7** | Perfil de equipes (#4 do backlog) | ⏳ Backlog — PRD detalhado + threat model **(intencionalmente não implementada)** | — |

## Itens não priorizados (parking lot)

Coisas que foram **propostas e adiadas** com gatilho de re-avaliação:

- **White-label premium customizável (#6 do backlog original)** — Adiado por decisão do usuário (2026-05-28). Re-avaliar se ≥3 agências pagantes pedirem.
- **Assistente com tools nativas (M3 v2)** — v1 entregue como chat puro. Tools ficam pra próxima rodada após observar uso real.
- **Onda 7 — perfil de equipes** — **intencionalmente NÃO implementada autonomamente**. Multi-tenant mexe em RLS de TODAS as tabelas; sem PRD fechado + threat model formal, risco de vazamento entre orgs é alto demais pra cravar sozinho. As 8 perguntas que destravam essa onda estão em [.planning/M4/PRD.md](.planning/M4/PRD.md).
- **Métricas de produto via PostHog** — pendente, não bloqueia onda atual.
- **Migração de hosting Vercel → VPS+Docker** (alinhar com CLAUDE.md global §9) — pendente decisão.
- **Onboarding flow review** (`is_onboarded` está dropping users) — pendente discovery.
- **Stripe / billing real** — pendente. Quotas existem mas não há cobrança.

## Convenção de ondas

- Uma onda = um bloco coerente de mudança que cabe em 1-3 commits atômicos em `main`.
- Bug fixes pequenos vão em `main` direto sem ceremony.
- Features novas (Ondas 5/6/7) **devem** passar por discuss-phase + plan-phase via GSD ([CLAUDE.md global §6](CLAUDE.md)).
- IA de texto livre (Onda 6) **deve** passar por `/gsd-ai-integration-phase` para gerar AI-SPEC.md antes de código.
- Perfil de equipes (Onda 7) **deve** ter PRD próprio + threat model porque mexe em RLS de todas as tabelas.
