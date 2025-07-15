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
│   ├── mobile/
│   │   ├── Dockerfile            # React Native app
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
├── .env.example                  # var template
├── .prettierrc                   # code‑style config
└── README.md                     # this blueprint + badges
```

## Badges

![CI](https://img.shields.io/github/actions/workflow/status/yourorg/yourrepo/ci.yml?branch=main)

This file is a starting point and will expand as the project grows.

## Configuration

Copy `.env.example` to `.env` and provide your keys:

```bash
cp .env.example .env
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`OPENAI_API_KEY`, and `STRIPE_SECRET_KEY` with your project credentials.
The backend loads these variables via `dotenv` at startup.
