# AgentForgeHQ MVP Known Limitations

- `/api/executions` orchestration is not yet fully environment-validated.
- A production model-provider adapter is not yet confirmed in CI.
- Tool Gateway JSON Schema validation still requires end-to-end malformed-payload testing.
- Queue restart recovery and dead-letter processing require deployment-backed verification.
- Voice interaction remains outside the validated MVP path.
- Repository Delivery has a specification and evaluation suite, but has not yet passed against three real representative repositories.
- Database migrations and rollback have not yet been executed against a disposable Supabase project through this connector.
- The repository lockfile and frozen-install policy require confirmation.
- Production canary and rollback procedures are documented but not yet rehearsed against live infrastructure.
- No autonomous merge, production deployment, or self-modification is permitted.
