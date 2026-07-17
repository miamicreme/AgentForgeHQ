begin;

create or replace function public.validate_release_workspace()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.agent_versions v
    where v.id = new.agent_version_id and v.workspace_id = new.workspace_id
  ) then
    raise exception 'Release workspace must match agent version workspace';
  end if;
  if new.status in ('approved','published') and (new.approved_by is null or new.approved_at is null) then
    raise exception 'Approved or published releases require approver identity and timestamp';
  end if;
  return new;
end;
$$;

create trigger validate_release_workspace_before_write
before insert or update on public.agent_releases
for each row execute function public.validate_release_workspace();

create or replace function public.validate_deployment_integrity()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.agent_releases r
    where r.id = new.release_id and r.workspace_id = new.workspace_id
  ) then
    raise exception 'Deployment workspace must match release workspace';
  end if;
  if new.rollback_release_id is not null and not exists (
    select 1 from public.agent_releases r
    where r.id = new.rollback_release_id and r.workspace_id = new.workspace_id
  ) then
    raise exception 'Rollback release must belong to the deployment workspace';
  end if;
  if new.status = 'healthy' and new.rollout_percent = 0 then
    raise exception 'Healthy deployments require a non-zero rollout';
  end if;
  if new.status in ('failed','rolled_back') and new.completed_at is null then
    raise exception 'Terminal deployments require completion time';
  end if;
  if new.status = 'rolled_back' and new.rollback_release_id is null then
    raise exception 'Rolled-back deployments require a rollback release';
  end if;
  return new;
end;
$$;

create trigger validate_deployment_integrity_before_write
before insert or update on public.deployments
for each row execute function public.validate_deployment_integrity();

create or replace function public.validate_execution_metric_integrity()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.executions e
    where e.id = new.execution_id
      and e.workspace_id = new.workspace_id
      and e.agent_version_id = new.agent_version_id
  ) then
    raise exception 'Execution metric must match execution workspace and agent version';
  end if;
  return new;
end;
$$;

create trigger validate_execution_metric_before_write
before insert or update on public.execution_metrics
for each row execute function public.validate_execution_metric_integrity();

create or replace function public.validate_incident_integrity()
returns trigger
language plpgsql
as $$
begin
  if new.execution_id is not null and not exists (
    select 1 from public.executions e
    where e.id = new.execution_id and e.workspace_id = new.workspace_id
  ) then
    raise exception 'Incident execution must belong to incident workspace';
  end if;
  if new.status = 'resolved' and new.resolved_at is null then
    raise exception 'Resolved incidents require resolved_at';
  end if;
  if new.status <> 'resolved' and new.resolved_at is not null then
    raise exception 'Only resolved incidents may have resolved_at';
  end if;
  return new;
end;
$$;

create trigger validate_incident_integrity_before_write
before insert or update on public.incidents
for each row execute function public.validate_incident_integrity();

commit;
