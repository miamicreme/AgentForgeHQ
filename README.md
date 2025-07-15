# AgentForgeHQ

This monorepo houses the frontend and backend applications for AgentForgeHQ. Below is an overview of the project structure.

```text
AgentForgeHQ/
├── apps/
│   ├── frontend/
│   │   ├── Dockerfile            # multistage; prod ➜ nginx
│   │   ├── next.config.js        # Next.js runtime opts
│   │   ├── src/
│   │   │   ├── app/              # App‑router pages
│   │   │   ├── components/       # Re‑usable UI
│   │   │   ├── lib/              # Supabase client, helpers
│   │   │   └── styles/
│   │   └── tsconfig.json
│   ├── admin-dashboard/
│   │   ├── Dockerfile            # admin Next.js app
│   │   ├── next.config.js
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   └── tsconfig.json
│(   ├── mobile/
$1)│   │   ├── Dockerfile            # React Native app
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── components/
│   │   └── tsconfig.json
│   └── backend/
│       ├── Dockerfile            # node18‑slim ➜ dist
│       ├── src/
│       │   ├── index.ts          # Apollo bootstrap
│       │   ├── resolvers/
│       │   ├── schema/
│       │   └── agents/
│       └── tsconfig.json
├── packages/
│   ├── eslint-config/            # share lint rules
│   │   └── index.js
│   └── tsconfig/                 # base TS settings
│       └── tsconfig.base.json
├── .github/
│   └── workflows/ci.yml          # build + test + coverage
├── docker-compose.yml            # local dev orchestrator
├── pnpm-workspace.yaml           # pnpm monorepo glue
├── client/                      # Vite React client app
├── .env.example                  # var template
├── .prettierrc                   # code‑style config
└── README.md                     # this blueprint + badges
```

## Badges

![CI](https://img.shields.io/github/actions/workflow/status/miamicreme/AgentForgeHQ/ci.yml?branch=main)

This file is a starting point and will expand as the project grows.

## Prerequisites

- **Node.js** 18 or higher
- **PNPM** 8 or higher
- **Docker** and Docker Compose

Install PNPM globally if you don't already have it:

```bash
npm install -g pnpm
```

## Installation

Install all workspace dependencies from the repository root:

```bash
pnpm install
```

Apps outside the workspace (`client` and `backend`) require running `pnpm install` in their respective directories.

## Running Apps Locally

Use PNPM to start any app with its `dev` script:

```bash
pnpm --filter frontend dev          # apps/frontend
pnpm --filter admin-dashboard dev   # apps/admin-dashboard
pnpm --filter mobile dev            # apps/mobile
pnpm --filter backend dev           # apps/backend
pnpm --filter agent-api dev         # services/agent-api
```

For the standalone `client` and `backend` directories:

```bash
cd client && pnpm dev
cd ../backend && pnpm dev
```

## Exporting Agents

Generate agent containers and a Compose file:

```bash
npm run export-agents
```

This copies agents from `apps/backend/src/agents` into `export/agents` and
writes `export/docker-compose.yml` that references these agents along with the
gateway.

## Configuration

Copy `.env.example` to `.env` and provide your keys. The example file lists all required variables:

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`OPENAI_API_KEY`, and `STRIPE_SECRET_KEY` with your project credentials.
The backend loads these variables via `dotenv` at startup.
