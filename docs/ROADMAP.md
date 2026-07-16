# AgentForgeHQ Roadmap

## Delivery rule

Every phase must produce one demonstrable vertical slice. Documentation, contracts, tests, implementation, observability, and operating instructions move together.

## Phase 0 — Product foundation

### Objective

Agree on what AgentForgeHQ is before restructuring or adding runtime code.

### Deliverables

- Product vision
- v1 PRD
- Product architecture
- Naming conventions
- Implementation blueprint
- Repository consolidation plan
- Initial architecture decision record list
- Canonical documentation index

### Exit criteria

- One master brand and product vocabulary
- One MVP workflow
- One canonical repository structure
- Clear in-scope and out-of-scope boundaries

## Phase 1 — Specification foundation

### Objective

Represent an agent as a validated, versioned contract.

### Deliverables

- `packages/agent-spec`
- Agent Specification JSON Schema
- TypeScript types and validators
- Example Repository Delivery specification
- Semantic specification diff
- Validation CLI
- Unit and contract tests

### Exit criteria

- Invalid specifications fail predictably
- Permissions and required evaluations are explicit
- A candidate specification can be compiled from a template

## Phase 2 — Studio and Playground

### Objective

Create and test an agent without deploying it.

### Deliverables

- AgentForge Studio agent editor
- Template selection
- AgentForge Playground
- Text and voice interaction
- Dry-run mode
- Execution status and cancellation
- Initial execution timeline

### Exit criteria

- User can create and test the Repository Delivery Agent
- No model or provider secrets are exposed to the browser
- Failures are visible and actionable

## Phase 3 — Skills and tools

### Objective

Attach reusable capabilities through governed contracts.

### Deliverables

- Skill Registry
- Tool Registry
- Tool Gateway
- GitHub read-only connector
- AgentForge Skills packaging format
- Provenance and license fields
- Permission evaluation

### Exit criteria

- Skills declare dependencies and required permissions
- All tool calls are logged and traceable
- Unauthorized calls are blocked before execution

## Phase 4 — Durable execution

### Objective

Run multi-step work reliably.

### Deliverables

- Execution API
- Queue and workers
- Execution state machine
- Retry and dead-letter handling
- Cost accounting
- Structured logging and traces
- Artifact storage

### Exit criteria

- Executions survive worker restarts
- Steps are correlated end to end
- Duplicate requests do not create duplicate irreversible actions

## Phase 5 — Evaluations and review gates

### Objective

Require proof before release.

### Deliverables

- Evaluation Suite model
- Deterministic tests
- Policy and security checks
- Regression suite
- Human approval inbox
- Override reasons and audit events
- Release gate engine

### Exit criteria

- Required failures prevent publishing
- Overrides require authorization and explanation
- Results are attached to a specific candidate release

## Phase 6 — Repository Delivery Agent

### Objective

Complete the flagship GitHub workflow.

### Deliverables

- Repository discovery
- Install/build/lint/test execution
- Failure classification
- Bounded repair plan
- Approval gate
- GitHub branch and draft PR creation
- Production-readiness report
- Complete execution timeline

### Exit criteria

- Works end to end on at least three representative repositories
- Never pushes directly to protected branches
- Produces a reviewable draft PR with evidence

## Phase 7 — Releases and deployment

### Objective

Publish immutable, governed agent releases.

### Deliverables

- Candidate and published releases
- Development, staging, production environments
- Deployment controller
- Canary rollout
- Rollback
- Signed Agent Packages
- Release notes

### Exit criteria

- Published releases are immutable
- Rollback is tested
- Deployment status is visible

## Phase 8 — Observe and optimize

### Objective

Measure real outcomes and improve safely.

### Deliverables

- AgentForge Observe dashboards
- Cost, latency, and success trends
- Feedback capture
- Incident workflow
- Controlled optimization proposals
- A/B release comparison

### Exit criteria

- Every production execution has cost and outcome attribution
- Optimization proposals require evaluation and review
- No autonomous production self-modification

## Post-v1 opportunities

- Business Operations Pack
- Real Estate Pack
- Customer Support Pack
- Data Engineering Pack
- Career Pack
- Public skill marketplace
- Enterprise SSO and SCIM
- Bring-your-own-cloud deployment
- Native mobile operator experience

## Immediate next milestone

Implement Phase 1 only after the documentation pull request is reviewed. The first code change should create the Agent Specification package and its tests, not reorganize the entire monorepo at once.