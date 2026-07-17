begin;

create type public.execution_job_status as enum ('queued','leased','completed','failed','dead_letter');

alter table public.executions
  add column if not exists idempotency_key text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

create unique index if not exists executions_workspace_idempotency_idx
  on public.executions(workspace_id,idempotency_key)
  where idempotency_key is not null;

create table public.execution_jobs (
  execution_id uuid primary key references public.executions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  status public.execution_job_status not null default 'queued',
  attempt integer not null default 0 check (attempt >= 0 and attempt <= 20),
  lease_owner text,
  lease_expires_at timestamptz,
  available_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'leased') = (lease_owner is not null and lease_expires_at is not null))
);

create index execution_jobs_claim_idx on public.execution_jobs(status,available_at,lease_expires_at);
create index execution_jobs_workspace_idx on public.execution_jobs(workspace_id,status,updated_at desc);

alter table public.approval_requests
  add column if not exists request_hash text,
  add column if not exists expires_at timestamptz,
  add column if not exists decided_request_hash text;

create unique index if not exists approval_requests_pending_hash_idx
  on public.approval_requests(execution_id,tool_call_id,request_hash)
  where status = 'pending';

create table public.execution_correlations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  execution_id uuid not null references public.executions(id) on delete cascade,
  step_id uuid,
  tool_call_id uuid,
  approval_id uuid references public.approval_requests(id) on delete set null,
  evaluation_result_id uuid references public.evaluation_results(id) on delete set null,
  release_id uuid references public.agent_releases(id) on delete set null,
  deployment_id uuid references public.deployments(id) on delete set null,
  created_at timestamptz not null default now(),
  check (num_nonnulls(step_id,tool_call_id,approval_id,evaluation_result_id,release_id,deployment_id) >= 1)
);

create index execution_correlations_execution_idx on public.execution_correlations(execution_id,created_at,id);

create or replace function public.validate_execution_job_workspace()
returns trigger language plpgsql security definer set search_path = public as $$
declare expected_workspace uuid;
begin
  select workspace_id into expected_workspace from public.executions where id = new.execution_id;
  if expected_workspace is null or expected_workspace <> new.workspace_id then
    raise exception 'Execution job workspace mismatch';
  end if;
  return new;
end;
$$;

create trigger execution_jobs_workspace_guard
before insert or update on public.execution_jobs
for each row execute function public.validate_execution_job_workspace();

create or replace function public.validate_execution_correlation()
returns trigger language plpgsql security definer set search_path = public as $$
declare expected_workspace uuid;
begin
  select workspace_id into expected_workspace from public.executions where id = new.execution_id;
  if expected_workspace is null or expected_workspace <> new.workspace_id then
    raise exception 'Execution correlation workspace mismatch';
  end if;
  if new.approval_id is not null and not exists (
    select 1 from public.approval_requests a where a.id = new.approval_id and a.execution_id = new.execution_id
  ) then raise exception 'Approval correlation mismatch'; end if;
  if new.evaluation_result_id is not null and not exists (
    select 1 from public.evaluation_results r where r.id = new.evaluation_result_id and r.execution_id = new.execution_id
  ) then raise exception 'Evaluation correlation mismatch'; end if;
  return new;
end;
$$;

create trigger execution_correlations_guard
before insert or update on public.execution_correlations
for each row execute function public.validate_execution_correlation();

alter table public.execution_jobs enable row level security;
alter table public.execution_correlations enable row level security;

create policy execution_jobs_read on public.execution_jobs for select
  using (public.is_workspace_member(workspace_id));
create policy execution_correlations_read on public.execution_correlations for select
  using (public.is_workspace_member(workspace_id));

revoke insert, update, delete on public.execution_jobs from authenticated;
revoke insert, update, delete on public.execution_correlations from authenticated;

grant select on public.execution_jobs to authenticated;
grant select on public.execution_correlations to authenticated;

commit;
