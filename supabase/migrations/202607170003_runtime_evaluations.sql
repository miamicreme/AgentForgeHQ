begin;

create type execution_state as enum (
  'queued','validating','compiling','running','waiting_for_approval','evaluating','completed',
  'validation_failed','execution_failed','approval_denied','limit_exceeded','timed_out','evaluation_failed','cancelled'
);

create table executions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_version_id uuid not null references agent_versions(id) on delete restrict,
  created_by uuid not null references auth.users(id),
  state execution_state not null default 'queued',
  input jsonb not null,
  output jsonb,
  prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  completion_tokens integer not null default 0 check (completion_tokens >= 0),
  estimated_cost_usd numeric(12,6) not null default 0 check (estimated_cost_usd >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

create table execution_events (
  id bigint generated always as identity primary key,
  execution_id uuid not null references executions(id) on delete cascade,
  sequence integer not null check (sequence > 0),
  event_type text not null,
  data jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  unique (execution_id, sequence)
);

create table approval_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  execution_id uuid not null references executions(id) on delete cascade,
  tool_call_id text not null,
  tool_id text not null,
  risk_level risk_level not null,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'pending' check (status in ('pending','approved','denied','expired')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id),
  decision_reason text,
  unique (execution_id, tool_call_id)
);

create table evaluation_cases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  name text not null,
  definition jsonb not null,
  required boolean not null default true,
  created_at timestamptz not null default now()
);

create table evaluation_results (
  id uuid primary key default gen_random_uuid(),
  evaluation_case_id uuid not null references evaluation_cases(id) on delete cascade,
  agent_version_id uuid not null references agent_versions(id) on delete cascade,
  execution_id uuid not null references executions(id) on delete cascade,
  score numeric(6,4) not null check (score between 0 and 1),
  passed boolean not null,
  evidence jsonb not null,
  created_at timestamptz not null default now(),
  unique (evaluation_case_id, agent_version_id, execution_id)
);

create index executions_workspace_created_idx on executions(workspace_id, created_at desc);
create index execution_events_execution_sequence_idx on execution_events(execution_id, sequence);
create index approvals_workspace_status_idx on approval_requests(workspace_id, status, requested_at);
create index evaluation_results_version_idx on evaluation_results(agent_version_id, created_at desc);

alter table executions enable row level security;
alter table execution_events enable row level security;
alter table approval_requests enable row level security;
alter table evaluation_cases enable row level security;
alter table evaluation_results enable row level security;

create policy executions_workspace_read on executions for select using (is_workspace_member(workspace_id));
create policy executions_workspace_create on executions for insert with check (is_workspace_member(workspace_id) and created_by = auth.uid());
create policy events_workspace_read on execution_events for select using (
  exists (select 1 from executions e where e.id = execution_id and is_workspace_member(e.workspace_id))
);
create policy approvals_workspace_read on approval_requests for select using (is_workspace_member(workspace_id));
create policy approvals_reviewer_update on approval_requests for update using (
  has_workspace_role(workspace_id, array['owner','reviewer']::workspace_role[])
) with check (
  has_workspace_role(workspace_id, array['owner','reviewer']::workspace_role[])
);
create policy evaluation_cases_workspace_all on evaluation_cases for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy evaluation_results_workspace_read on evaluation_results for select using (
  exists (select 1 from evaluation_cases c where c.id = evaluation_case_id and is_workspace_member(c.workspace_id))
);

commit;
