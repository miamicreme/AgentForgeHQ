# AgentForgeHQ Implementation Blueprint

## 1. Delivery strategy

Build one vertical slice first: create a Repository Delivery Agent, test it, evaluate it, publish it, run it against a GitHub repository, and inspect the full execution timeline.

Do not build every product area independently before the first end-to-end workflow works.

## 2. Canonical monorepo structure

```text
agentforgehq/
├── apps/
│   ├── web/                    # AgentForge web application
│   ├── worker/                 # asynchronous execution workers
│   └── docs/                   # public documentation site
├── packages/
│   ├── agent-spec/             # schema, parser, compiler, semantic diff
│   ├── agent-runtime/          # execution contracts and state machine
│   ├── skill-registry/         # skill loading, validation, provenance
│   ├── tool-registry/          # tool contracts, permissions, adapters
│   ├── evaluations/            # test cases, scorers, release gates
│   ├── observability/          # logs, traces, metrics, cost attribution
│   ├── authz/                  # RBAC and policy decisions
│   ├── database/               # schema, migrations, typed data access
│   ├── ui/                     # shared design system
│   └── config/                 # shared lint, TypeScript, test config
├── services/
│   ├── execution-api/          # execution requests and status
│   ├── tool-gateway/           # controlled tool invocation
│   └── deployment-controller/  # releases, canaries, rollback
├── skills/                     # first-party AgentForge Skills
├── templates/                  # agent templates
├── evals/                      # canonical evaluation fixtures
├── infrastructure/             # deployment and environment definitions
└── docs/
```

## 3. Recommended stack

### Web

- Next.js with TypeScript
- React
- Accessible component system
- Server actions or typed API client
- Streaming execution updates

### Data and identity

- PostgreSQL
- Supabase Auth or equivalent OIDC-compatible provider
- Row-level tenant isolation where appropriate
- Object storage for artifacts

### Runtime

- TypeScript services initially
- Queue-backed execution
- Sandboxed tool execution
- OpenTelemetry
- Provider-agnostic model adapter

### Background work

- Durable queue
- Bounded retries
- Dead-letter queue
- Idempotency keys
- Execution state machine

### Deployment

- Containers
- Development, staging, production environments
- Signed release artifacts
- Canary rollout
- Automated rollback hooks

## 4. Core domain model

### Identity and tenancy

- organizations
- workspaces
- users
- memberships
- roles

### Agent design

- agents
- agent_drafts
- agent_specifications
- agent_releases
- templates
- skills
- skill_versions
- agent_skill_versions
- tools
- tool_versions
- agent_tool_versions

### Runtime

- executions
- execution_steps
- model_calls
- tool_calls
- artifacts
- approvals
- incidents

### Quality

- evaluation_suites
- evaluation_cases
- evaluation_runs
- evaluation_results
- release_gates

### Operations

- deployments
- deployment_events
- budgets
- usage_events
- audit_events
- secrets
- policy_decisions

## 5. Execution state machine

```text
queued
  -> validating
  -> awaiting_approval (optional)
  -> running
  -> completed
  -> failed
  -> cancelled
```

Each execution step must include:

- unique ID
- execution ID
- parent step ID
- type
- status
- started and completed timestamps
- input and output references
- model or tool reference
- token and cost data
- retry count
- error classification
- trace and correlation IDs

## 6. Agent Specification compiler

The compiler converts a user request or template into a validated specification.

Pipeline:

1. Normalize user intent.
2. Select template and candidate skills.
3. Generate structured draft.
4. Validate schema.
5. Resolve capability dependencies.
6. Calculate required permissions.
7. Attach required evaluation suites.
8. Surface unresolved questions.
9. Produce immutable candidate specification.

The compiler must never silently grant tools or permissions.

## 7. Tool Gateway

All external actions pass through the Tool Gateway.

Responsibilities:

- validate caller identity
- validate release and execution state
- evaluate permission policy
- resolve secret reference
- validate input schema
- enforce rate and budget limits
- execute tool adapter
- validate output schema
- redact sensitive data
- record trace and audit event

The model never receives raw credentials.

## 8. Evaluation model

Every release declares required gates.

Initial evaluation categories:

- schema validity
- instruction compliance
- tool permission enforcement
- deterministic contract tests
- regression behavior
- prompt injection resistance
- sensitive data handling
- output quality rubric
- cost ceiling
- latency ceiling

A release cannot be published while a required gate is unresolved unless an authorized reviewer records a reasoned override.

## 9. Repository Delivery Agent workflow

```text
Connect repository
  -> discover project
  -> identify run commands
  -> install dependencies
  -> build/lint/test
  -> classify failures
  -> propose bounded plan
  -> approval gate
  -> create branch
  -> implement changes
  -> verify
  -> security/readiness audit
  -> prepare draft PR
  -> publish execution report
```

Required safeguards:

- no direct push to protected branches
- no secret exfiltration
- no unrelated refactoring
- no deletion without explicit scope
- explicit file-change summary before commit
- draft PR by default

## 10. Build phases

### Phase 0 — Foundation

- normalize repository structure
- establish shared configuration
- add database package
- create Agent Specification schema
- create execution contracts
- set up CI gates

### Phase 1 — Design and test

- AgentForge Studio draft editor
- Repository Delivery template
- Skill and Tool Registry basics
- Playground chat and dry-run
- specification validation

### Phase 2 — Execute

- queue and worker
- GitHub read tools
- execution timeline
- cost and latency tracking
- cancellation

### Phase 3 — Govern

- review gates
- policy decisions
- GitHub write tools
- evaluation suites
- immutable releases

### Phase 4 — Deploy and observe

- release environments
- deployment status
- canary and rollback
- dashboards and incidents

## 11. Definition of done for each slice

A slice is complete only when:

- acceptance criteria are documented
- tests pass
- runtime behavior is demonstrated
- permissions are verified
- logs and traces are emitted
- failure handling is tested
- documentation is updated
- no unrelated files are changed

## 12. Architecture decisions to record

Create ADRs before implementation for:

1. Runtime orchestration and queue technology
2. Agent Specification serialization format
3. Tenant isolation model
4. Tool sandbox model
5. Model provider abstraction
6. Evaluation scorer architecture
7. Release artifact signing
8. Secrets management
9. Event and audit retention
10. Deployment target