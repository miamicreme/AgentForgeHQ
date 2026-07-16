# AgentForgeHQ v1 Product Requirements Document

## 1. Objective

Deliver a production-minded MVP that lets a user create, test, evaluate, and publish a governed AI agent from one platform.

The MVP must prove one complete lifecycle rather than expose a large collection of disconnected screens.

## 2. MVP success criteria

A user can:

1. Create a workspace.
2. Create an agent from a template or plain-language description.
3. Review and edit the generated Agent Specification.
4. Attach approved skills and tools.
5. Test the agent in AgentForge Playground.
6. Inspect an execution timeline with model and tool steps.
7. Run a required evaluation suite.
8. Resolve failures or request a review override.
9. Publish an immutable release.
10. View deployment status, cost, latency, and outcome metrics.

## 3. Flagship template

### Repository Delivery Agent

The first fully supported template will:

- Connect to a GitHub repository
- Read repository metadata and files
- Detect project structure and run instructions
- Attempt installation, build, lint, and tests
- Localize failures
- Produce a bounded repair plan
- Make approved changes on a branch
- Re-run verification
- Perform security and production-readiness checks
- Open a draft pull request
- Generate an auditable execution timeline

## 4. Core personas

### Builder
Creates and configures agents, skills, tools, evaluations, and releases.

### Reviewer
Approves specifications, permissions, evaluation exceptions, and deployments.

### Operator
Monitors executions, incidents, costs, deployment health, and rollbacks.

### Administrator
Manages organizations, access, secrets, policy, billing, and platform settings.

## 5. Functional requirements

### 5.1 AgentForge Studio

- Create agent from template
- Create agent from plain-language request
- Edit structured Agent Specification
- Configure model and runtime settings
- Attach skills, tools, memory, and policies
- Show unresolved validation issues
- Save drafts automatically
- Create a versioned candidate release

### 5.2 Agent Specification

Required fields:

- identity
- purpose
- responsibilities
- forbidden actions
- input schema
- output schema
- instruction set
- capability set
- tool permissions
- memory profile
- escalation policy
- budget policy
- evaluation requirements
- observability requirements
- version metadata

The specification must validate against a versioned schema.

### 5.3 AgentForge Registry

- Browse agents, skills, tools, templates, and releases
- Display provenance and ownership
- Show dependency graph
- Show permission requirements
- Show compatibility status
- Support immutable published versions
- Support deprecation without silent deletion

### 5.4 AgentForge Playground

- Text chat
- Voice input where supported
- Streaming output
- Tool-call visualization
- Dry-run mode
- Test input library
- Side-by-side release comparison
- Stop execution control
- User feedback capture

### 5.5 AgentForge Evaluations

- Static specification validation
- Deterministic contract tests
- Tool permission tests
- Safety and policy tests
- Quality rubric scoring
- Regression test suites
- Red-team prompts
- Release pass/fail decision
- Human override with reason and audit entry

### 5.6 AgentForge Control

- Organization and workspace roles
- Tool-level permissions
- Secret references, never exposed raw in prompts
- Budget limits by organization, workspace, agent, and execution
- Approval policies
- High-impact action review gates
- Emergency disable switch
- Full audit history

### 5.7 AgentForge Deployments

- Publish immutable release
- Environment promotion: development, staging, production
- Canary rollout
- Rollback
- Deployment status
- Health checks
- Release notes
- Approval record

### 5.8 AgentForge Observe

- Execution count
- Success and failure rate
- p50/p95 latency
- Token and model cost
- Tool-call count and failures
- Evaluation score trends
- User feedback
- Business outcome metrics
- Execution timeline
- Incident records

### 5.9 AgentForge CLI

Initial commands:

```text
forge auth login
forge agent create
forge agent validate
forge agent run
forge agent release
forge agent deploy
forge agent logs
forge agent disable
forge spec diff
forge eval run
forge cost report
```

Mutating commands must support `--dry-run` where practical.

## 6. Non-functional requirements

### Security

- Least privilege
- Tenant isolation
- Encrypted secrets
- Signed release artifacts
- Audit log integrity
- Input and output validation
- Rate limits
- Dependency and image scanning

### Reliability

- Idempotent execution steps where possible
- Retry policy with bounded attempts
- Dead-letter handling for failed asynchronous work
- Deployment rollback
- Health checks and readiness checks

### Observability

- Structured logs
- Correlation IDs
- Distributed traces
- RED metrics for services
- Cost attribution by execution

### Accessibility

- WCAG 2.1 AA target
- Keyboard operability
- Screen-reader labels
- Sufficient contrast
- Reduced-motion support

### Performance targets

- Studio page interactive in under 3 seconds on a typical broadband connection
- Non-model API p95 under 500 ms
- Execution status updates visible within 2 seconds
- Agent specification validation under 1 second for typical documents

## 7. Out of scope for v1

- Fully autonomous self-modification
- Public marketplace payments
- Native mobile applications
- General-purpose visual workflow canvas
- Arbitrary code execution without sandboxing
- Unlimited multi-agent recursion
- Automatic production deployment without a policy decision

## 8. Release gates

The MVP is releasable only when:

- The flagship workflow succeeds end to end
- Tenant isolation tests pass
- Required evaluation gates work
- Execution timelines are complete
- Budget enforcement works
- A failed deployment can be rolled back
- No secret values appear in application logs or model prompts
- Setup and operator documentation are complete

## 9. Product metrics

- Time from agent creation to first successful test
- Percentage of agents passing evaluations on first attempt
- Execution success rate
- Average cost per successful execution
- Time to diagnose a failed run
- Release rollback frequency
- User satisfaction per agent execution
- Number of reusable skills adopted across multiple agents