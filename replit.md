# Cloud SRE Agent Config UI

A web UI to create, manage, and export configurations for the [Cloud SRE Agent](https://github.com/cloud-sre-agent) — a Go daemon that ingests logs, detects incidents via a sliding-window detector, and runs an LLM-powered triage → analysis → remediation pipeline.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/sre-agent-ui run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS, react-hook-form, TanStack Query, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (`lib/db/src/schema/configs.ts`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/db/src/schema/configs.ts` — configs table (id, name, description, data JSONB, timestamps)
- `artifacts/api-server/src/routes/configs.ts` — CRUD + YAML generation routes
- `artifacts/sre-agent-ui/src/pages/dashboard.tsx` — configs list page
- `artifacts/sre-agent-ui/src/pages/config-builder.tsx` — 5-tab wizard (create/edit)
- `artifacts/sre-agent-ui/src/pages/tabs/` — tab components (Sources, LLM, Delivery, Validator & Logging, Review)
- `artifacts/sre-agent-ui/src/lib/schemas.ts` — Zod form validation schemas

## Product

- **Dashboard** — lists all saved configurations with target, LLM provider/model, edit/delete/download actions
- **Config wizard** — 5-tab guided form:
  1. Sources — file tail or GCP Pub/Sub
  2. LLM — provider chain (Gemini/OpenAI/Anthropic/Ollama/Stub) + fallbacks + HIPAA warnings
  3. Delivery — local patch / GitHub PR / GitLab MR
  4. Validator & Logging — code validator, log level/format, OTel tracing
  5. Review & Export — live YAML preview, download `config.yaml`, save
- **YAML generation** — server-side, escapes special characters, produces valid Go agent config

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Generated API client types must be imported from `@workspace/api-client-react` (barrel), never from deep paths like `@workspace/api-client-react/src/generated/api.schemas`
- After any change to `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before touching frontend code
- The `configs.data` column is JSONB — the full `AgentConfig` shape is stored as JSON and cast on read

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `docs/CONFIGURATION.md` in the uploaded zip for the full Go config reference
