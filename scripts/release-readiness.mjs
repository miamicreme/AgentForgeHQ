import { existsSync, readFileSync } from 'node:fs'

const required = [
  'agents/repository-delivery.agent.json',
  'evaluations/repository-delivery-v1.json',
  'docs/DEPLOYMENT_RUNBOOK.md',
  'docs/SECURITY_REVIEW.md',
  'docs/KNOWN_LIMITATIONS.md',
  'supabase/migrations/202607170006_release_observability.sql',
]

const failures = []
for (const path of required) if (!existsSync(path)) failures.push(`Missing required release artifact: ${path}`)

if (existsSync('agents/repository-delivery.agent.json')) {
  const spec = JSON.parse(readFileSync('agents/repository-delivery.agent.json','utf8'))
  if (spec.tools?.allowed?.includes('merge-pull-request')) failures.push('Repository Delivery Agent may not merge pull requests')
  if (!spec.tools?.forbidden?.includes('production-deploy')) failures.push('Production deploy must be forbidden')
  if (!spec.approvalPolicy?.requiredFor?.includes('pull_request_creation')) failures.push('Pull request creation requires approval')
}

if (existsSync('evaluations/repository-delivery-v1.json')) {
  const suite = JSON.parse(readFileSync('evaluations/repository-delivery-v1.json','utf8'))
  if (!Array.isArray(suite.cases) || suite.cases.length < 6) failures.push('Repository Delivery suite requires six representative cases')
  if (suite.minimumScore < 0.85) failures.push('Minimum score must be at least 0.85')
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('Release-readiness static checks passed')
