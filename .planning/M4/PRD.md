# M4 — Perfil de equipes (multi-tenant)

> **Status:** PRD STUB. Não codar. Fase pesada — mexe em RLS de todas as tabelas, billing, auth, UI. Precisa de PRD próprio sectional (CLAUDE.md global §7) + threat model antes de qualquer migration.

## Intenção

Backlog item #4 do usuário: "Estudar possibilidade de implementar perfil de equipes, isso comportaria grandes agências por exemplo que tem uma quantidade alta de funcionários."

Tradução: hoje cada usuário é um silo (`briefing_profiles.id = auth.users.id`). Pra agência com 10+ funcionários, todos compartilham um login ou criam contas separadas que não veem briefings uns dos outros. Equipes resolve.

## Decisões pendentes (bloqueiam plan-phase)

### 1. Modelo de tenancy

- **Org-level**: nova tabela `organizations`. Cada `briefing_profile` pertence a 1 org (`org_id`). Todos os recursos (templates, sessions, branding) ficam no escopo da org.
- **Workspace-style** (Slack/Notion): user pode estar em N orgs, troca via switcher.
- **Team-within-user**: dono permanece `briefing_profiles.id`, adiciona tabela `team_members` com convites. Recursos continuam por dono mas com permissão delegada.

→ **Qual modelo?** (recomendado: Org-level — limpa e bem entendida pra agências)

### 2. Roles & permissões

Roles mínimos a definir:
- **Owner**: tudo, incluindo billing, deletar org, convidar/expulsar members.
- **Admin**: tudo exceto billing + delete org.
- **Member**: CRUD em templates/sessions, mas não convida ninguém.
- **Viewer (read-only)**: vê briefings finalizados, não cria. Útil pra cliente externo? Stakeholder?

Decisões adicionais:
- Pode ter múltiplos owners por org? (recomendado: sim, ≥1)
- Member pode ver briefings de outros members ou só os próprios?
- Quem pode editar branding da org?

→ **Quais roles e o que cada um vê/faz?**

### 3. Migração de dados existentes

Hoje tem 50+ usuários e 35+ briefings. Estratégia:
- **Auto-create org pra cada user existente**: nome = `company_name` do profile, owner = o próprio user. Briefings ficam dentro da org.
- **Migration script**: ALTER TABLE adicionando `org_id`, popular com org auto-criada, depois NOT NULL.

→ **Tudo bem auto-criar org por usuário, ou prefere fluxo opt-in?**

### 4. Billing

Hoje `briefing_quotas` é por user (`max_briefings`). Com equipes:
- Quota vai pra org? (assento, briefings/mês)
- Quem paga? Owner? Cobrança per-seat?
- Como funciona conversão de single-user (free) → team (paid)?

→ **Modelo de billing? Existe agora ou fica deferred?**

### 5. RLS rework

Toda tabela hoje filtra por `user_id`. Vira algo como:
```sql
USING (
  user_id = auth.uid()
  OR (org_id IS NOT NULL AND org_id IN (SELECT org_id FROM team_members WHERE user_id = auth.uid()))
)
```

- Performance: precisa de índice em `team_members(user_id)` e `briefing_sessions(org_id)`.
- Defense-in-depth: queries no service layer também precisam acrescentar filtros explícitos.

→ Não é decisão, é trabalho. Mas dimensiona: **8-15 tabelas pra modificar**, cada uma com migration + rewrite de policy.

### 6. UI changes (não-trivial)

- Switcher de org no header do dashboard
- `/dashboard/settings/team` — lista members, convites pendentes, role assignment
- Modal "convidar member" (email + role)
- Onboarding pra invite → criação de conta → join org
- Indicação visual de "qual org está ativo" em cada briefing

→ Não é decisão, é trabalho. Mas dimensiona: **5-8 telas novas + sidebar refactor**.

### 7. Threat model (CLAUDE.md global §3.5)

- IDOR cross-org: member da org A não pode ler nem ver IDs de briefings da org B.
- Privilege escalation: member não pode se promover a owner.
- Invite token leak: link de convite expira (24h?) e é one-shot.
- Removed member: revoke imediato — todas as queries dele falham, sessões web invalidadas.
- Audit log: cada ação org-level (invite, remove, role change, delete) é loggada em tabela `org_audit_log`.

→ **Vamos cravar esse threat model no PRD próprio antes do plan-phase.**

### 8. Roadmap incremental possível

Fase A: schema + RLS rework + migration retroativa (sem UI).
Fase B: UI básica (switcher + member list + invite).
Fase C: roles avançados + audit log + billing.

A entrega Fase A já bloqueia uso (UI não existe), então pode ser feito em uma única milestone fechada.

→ **Acha um milestone aceitável ou prefere dividir em ondas menores?**

## Setup técnico requerido antes de implementar

- `/gsd-plan-phase` completo com sectional debate (CLAUDE.md global §7) — sem pular nada
- LLM Council (§5) sugerido aqui (é arquitetura grande, multi-table migration, RLS) — você decide se quer rodar
- Threat model formal antes de migration (§3.5)
- Backup completo do DB antes da migration retroativa (single shot, sem reversão fácil)

## Anti-padrões a evitar

- "Adicionar coluna `org_id` em tudo e ver no que dá" — RLS quebra silenciosamente, dados vazam. Sem migration test, sem deploy.
- Reusar `briefing_profiles` como org (id de user = id de org). Vai cascatar bug em todo authz futuro.
- Convite por email plaintext sem rate limit — abuse vector óbvio.
- Deletar member = hard delete de dados criados por ele. Member sai, dados ficam na org (soft-link em `created_by`).
