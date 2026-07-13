# Cloud SRE Agent — Config UI

A web application for creating, managing, and exporting configurations for the
[Cloud SRE Agent](https://github.com/cloud-sre-agent) — a Go daemon that ingests
logs, detects incidents via a sliding-window detector, and runs an LLM-powered
triage → analysis → remediation pipeline.

This repo is the **UI**, not the agent itself: it's a guided wizard that turns
form input into a valid `config.yaml` for the Go agent, so you don't have to
hand-write YAML or memorize the field reference.

## What it does

- **Dashboard** — lists all saved configurations with their delivery target,
  LLM provider/model, and edit / delete / download actions.
- **Config wizard** — a 5-tab guided form:
  1. **Sources** — file tail or GCP Pub/Sub log ingestion
  2. **LLM** — provider chain (Gemini / OpenAI / Anthropic / Ollama / Stub),
     fallback ordering, and HIPAA warnings for non-BAA providers
  3. **Delivery** — local patch output, GitHub PR, or GitLab MR
  4. **Validator & Logging** — code validator choice, log level/format, OTel
     tracing options
  5. **Review & Export** — live YAML preview, download `config.yaml`, save
- **YAML generation** — done server-side; escapes special characters and
  produces a config file valid against the Go agent's schema.

## Stack

- **Monorepo**: pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React + Vite + Tailwind CSS, react-hook-form, TanStack Query,
  Wouter (routing), shadcn/ui components
- **API**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval, generated from `lib/api-spec/openapi.yaml`
- **Build**: esbuild (CJS bundle)

## Project layout

```
lib/api-spec/openapi.yaml                          # OpenAPI spec — source of truth for API contracts
lib/db/src/schema/configs.ts                        # configs table (id, name, description, data JSONB, timestamps)
artifacts/api-server/src/routes/configs.ts          # CRUD + YAML generation routes
artifacts/sre-agent-ui/src/pages/dashboard.tsx      # configs list page
artifacts/sre-agent-ui/src/pages/config-builder.tsx # 5-tab wizard (create/edit)
artifacts/sre-agent-ui/src/pages/tabs/              # tab components (Sources, LLM, Delivery, Validator & Logging, Review)
artifacts/sre-agent-ui/src/lib/schemas.ts           # Zod form validation schemas
```

## Getting started

Requires Node.js 24, pnpm, and a Postgres connection string.

```sh
# install dependencies
pnpm install

# set required env
export DATABASE_URL="postgres://..."

# run the API server (port 8080, proxied at /api)
pnpm --filter @workspace/api-server run dev

# run the frontend (proxied at /)
pnpm --filter @workspace/sre-agent-ui run dev
```

### Other useful commands

```sh
pnpm run typecheck                                   # full typecheck across all packages
pnpm run build                                       # typecheck + build all packages
pnpm --filter @workspace/api-spec run codegen        # regenerate API hooks + Zod schemas from the OpenAPI spec
pnpm --filter @workspace/db run push                 # push DB schema changes (dev only)
```

> **Note:** after any change to `lib/api-spec/openapi.yaml`, run the `codegen`
> command above before touching frontend code — the API client types are
> generated, not hand-written.

## API client imports

Generated API client types must be imported from the `@workspace/api-client-react`
barrel, never from deep paths like `@workspace/api-client-react/src/generated/api.schemas`.

## Related project

The agent this UI configures — the Go daemon that actually ingests logs and
opens PRs — lives in its own repository. See its `docs/CONFIGURATION.md` for
the full field reference this UI's YAML output targets.
