<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:supabase-project-rules -->
# ⚠️ SUPABASE PROJECT CONTEXT — READ BEFORE ANY DB OPERATION

This workspace is the **BRIEFFY** project.

- **Project Name**: Brieffy
- **Supabase Project Ref**: `vnjbtflgemwvjrcrvuse`
- **Supabase Project URL**: `https://vnjbtflgemwvjrcrvuse.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/vnjbtflgemwvjrcrvuse

## MANDATORY RULES for the AI agent:

1. **BEFORE** executing ANY Supabase MCP operation (migrations, SQL, edge functions), you MUST confirm the currently active MCP project matches `vnjbtflgemwvjrcrvuse`.
2. Use `mcp_supabase-mcp-server_get_project_url` to verify the active project URL. If it does NOT match `https://vnjbtflgemwvjrcrvuse.supabase.co`, **STOP** and warn the user that the wrong Supabase project is active.
3. Never assume the MCP is pointing to this project — always verify first.
4. If the MCP points to a different project, instruct the user to update the Supabase MCP access token and reload before proceeding.
<!-- END:supabase-project-rules -->
