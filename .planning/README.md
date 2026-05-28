# `.planning/` — GSD working artifacts

Esta pasta hospeda os artefatos do workflow [GSD](https://github.com/) (discuss → plan → execute → verify) descrito em `~/.claude/CLAUDE.md` §6.

Estrutura esperada quando uma onda for executada via GSD:

```
.planning/
├── M{milestone}/
│   ├── P{phase}/
│   │   ├── DISCUSS.md      # output do gsd-discuss-phase
│   │   ├── PLAN.md         # output do gsd-plan-phase
│   │   ├── RESEARCH.md     # opcional, do gsd-phase-researcher
│   │   ├── PATTERNS.md     # opcional, do gsd-pattern-mapper
│   │   ├── EXECUTION.md    # log do gsd-executor
│   │   └── VERIFICATION.md # output do gsd-verifier
│   └── ROADMAP.md          # backlog do milestone
└── intel/                  # outputs do gsd-intel-updater, codebase mapping
```

A pasta começa vazia. Ondas 1.A-1.D foram hotfixes diretos em `main` sem GSD (justificável pela natureza pontual de bug fixes — `/gsd-fast` ou direto). Ondas 3-7 devem usar GSD conforme natureza:

- **Onda 3 (polish landing)**: `gsd-quick` ou direto (UX visual, sem mudança de contrato).
- **Onda 4 (polish briefing)**: `gsd-quick` ou direto.
- **Onda 5 (admin dash)**: `gsd-discuss-phase` primeiro (escopo vago — precisa discovery).
- **Onda 6 (IA texto livre)**: `gsd-ai-integration-phase` obrigatório (AI-SPEC.md antes de código).
- **Onda 7 (perfil equipes)**: `gsd-plan-phase` completo após PRD próprio (multi-tenant é cara).

Veja [PROJECT.md](../PROJECT.md) e [ROADMAP.md](../ROADMAP.md) para detalhes.
