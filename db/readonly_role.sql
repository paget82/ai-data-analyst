-- ============================================================================
-- OPTIONAL but recommended: a restricted, read-only Postgres role for the
-- n8n "Execute SQL query" node.
--
-- The sub-flow lets an LLM write and run arbitrary SQL against your database.
-- The prompt instructs it to only ever write SELECT statements, but an LLM
-- is not a security boundary — a role that physically cannot
-- INSERT/UPDATE/DELETE/DROP is. Create this role, then in n8n use it (instead
-- of the default admin user from .env) for the Postgres credential attached
-- to the "Execute SQL query" node in the sub-flow.
--
-- This file is NOT auto-run (it lives outside db/init/, which only fires on
-- first container start). Run it manually once the stack is up:
--
--   docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -f /dev/stdin < db/readonly_role.sql
--
-- or paste it into pgAdmin's Query Tool (http://localhost:5050).
-- ============================================================================

create role ai_data_analyst_reader with login password 'CHANGE-ME-STRONG-PASSWORD';

grant usage on schema public to ai_data_analyst_reader;
grant select on all tables in schema public to ai_data_analyst_reader;

-- Make sure the read-only grant also applies to any tables created later.
alter default privileges in schema public
  grant select on tables to ai_data_analyst_reader;

-- In n8n, create a second Postgres credential using:
--   Host:     postgres          (the Docker Compose service name)
--   Port:     5432
--   Database: <your POSTGRES_DB from .env>
--   User:     ai_data_analyst_reader
--   Password: <the password you set above>
--   SSL:      disable (local network only)
-- and attach it to the "Execute SQL query" node in the sub-flow workflow.
--
-- Keep the default admin credential for the "Supabase Chat Memory" node in
-- the main flow — it needs to create and write to a `chat_histories` table
-- the first time it runs.
