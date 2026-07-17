begin;

create or replace function public.enforce_execution_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.agent_versions v
    where v.id = new.agent_version_id
      and v.workspace_id = new.workspace_id
  ) then
    raise exception 'Execution agent version must belong to the execution workspace';
  end if;
  return new;
end;
$$;

create trigger executions_scope_guard
before insert or update of workspace_id, agent_version_id on public.executions
for each row execute function public.enforce_execution_scope();

create or replace function public.enforce_approval_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.executions e
    where e.id = new.execution_id
      and e.workspace_id = new.workspace_id
  ) then
    raise exception 'Approval request must belong to the execution workspace';
  end if;
  return new;
end;
$$;

create trigger approval_scope_guard
before insert or update of workspace_id, execution_id on public.approval_requests
for each row execute function public.enforce_approval_scope();

create or replace function public.enforce_evaluation_case_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.agents a
    where a.id = new.agent_id
      and a.workspace_id = new.workspace_id
  ) then
    raise exception 'Evaluation case agent must belong to the case workspace';
  end if;
  return new;
end;
$$;

create trigger evaluation_case_scope_guard
before insert or update of workspace_id, agent_id on public.evaluation_cases
for each row execute function public.enforce_evaluation_case_scope();

create or replace function public.enforce_evaluation_result_scope()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  case_agent_id uuid;
  case_workspace_id uuid;
  version_agent_id uuid;
  version_workspace_id uuid;
  execution_workspace_id uuid;
  execution_version_id uuid;
begin
  select c.agent_id, c.workspace_id
    into case_agent_id, case_workspace_id
  from public.evaluation_cases c
  where c.id = new.evaluation_case_id;

  select v.agent_id, v.workspace_id
    into version_agent_id, version_workspace_id
  from public.agent_versions v
  where v.id = new.agent_version_id;

  select e.workspace_id, e.agent_version_id
    into execution_workspace_id, execution_version_id
  from public.executions e
  where e.id = new.execution_id;

  if case_agent_id is null or version_agent_id is null or execution_workspace_id is null then
    raise exception 'Evaluation result references missing records';
  end if;

  if case_workspace_id <> version_workspace_id
     or case_workspace_id <> execution_workspace_id
     or case_agent_id <> version_agent_id
     or execution_version_id <> new.agent_version_id then
    raise exception 'Evaluation result references inconsistent agent, version, execution, or workspace';
  end if;

  return new;
end;
$$;

create trigger evaluation_result_scope_guard
before insert or update of evaluation_case_id, agent_version_id, execution_id on public.evaluation_results
for each row execute function public.enforce_evaluation_result_scope();

alter table public.approval_requests
  add constraint approval_decision_consistency check (
    (status = 'pending' and decided_at is null and decided_by is null and decision_reason is null)
    or
    (status in ('approved','denied') and decided_at is not null and decided_by is not null and char_length(decision_reason) between 3 and 1000)
    or
    (status = 'expired' and decided_at is not null)
  );

create or replace function public.prevent_execution_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Execution events are append-only';
end;
$$;

create trigger execution_events_append_only
before update or delete on public.execution_events
for each row execute function public.prevent_execution_event_mutation();

revoke all on function public.enforce_execution_scope() from public;
revoke all on function public.enforce_approval_scope() from public;
revoke all on function public.enforce_evaluation_case_scope() from public;
revoke all on function public.enforce_evaluation_result_scope() from public;
revoke all on function public.prevent_execution_event_mutation() from public;

commit;
