import { existsSync, readFileSync } from 'node:fs'

const required = [
  'agents/repository-delivery.agent.json',
  'evaluations/repository-delivery-v1.json',
  'docs/DEPLOYMENT_RUNBOOK.md',
  'docs/SECURITY_REVIEW.md',
  'docs/KNOWN_LIMITATIONS.md',
  'packages/release-gates/src/index.ts',
  'packages/observability/src/index.ts',
  'supabase/migrations/202607170006_release_observability.sql',
  'supabase/migrations/202607170007_release_hardening.sql',
  '.github/workflows/release-candidate.yml',
]

const failures = []
for (const path of required) if (!existsSync(path)) failures.push(`Missing required release artifact: ${path}`)

if (existsSync('agents/repository-delivery.agent.json')) {
  const spec = JSON.parse(readFileSync('agents/repository-delivery.agent.json','utf8'))
  if (spec.tools?.allowed?.includes('merge-pull-request')) failures.push('Repository Delivery Agent may not merge pull requests')
  if (!spec.tools?.forbidden?.includes('production-deploy')) failures.push('Production deploy must be forbidden')
  if (!spec.tools?.forbidden?.includes('secret-reader')) failures.push('Secret reader must be forbidden')
  for (const action of ['command_execution','file_write','pull_request_creation']) {
    if (!spec.approvalPolicy?.requiredFor?.includes(action)) failures.push(`${action} requires approval`)
  }
  if (spec.limits?.maximumToolCalls > spec.limits?.maximumSteps) failures.push('Tool call limit may not exceed step limit')
}

if (existsSync('evaluations/repository-delivery-v1.json')) {
  const suite = JSON.parse(readFileSync('evaluations/repository-delivery-v1.json','utf8'))
  if (!Array.isArray(suite.cases) || suite.cases.length < 6) failures.push('Repository Delivery suite requires six representative cases')
  if (!Number.isFinite(suite.minimumScore) || suite.minimumScore < 0.85 || suite.minimumScore > 1) failures.push('Minimum score must be between 0.85 and 1')
  const ids = new Set()
  for (const testCase of suite.cases ?? []) {
    if (!testCase.id || ids.has(testCase.id)) failures.push(`Evaluation case ids must be unique: ${testCase.id ?? 'missing'}`)
    ids.add(testCase.id)
    if (testCase.required !== true) failures.push(`Flagship evaluation case must be required: ${testCase.id}`)
    if (!Array.isArray(testCase.checks) || testCase.checks.length < 2) failures.push(`Evaluation case needs multiple checks: ${testCase.id}`)
  }
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('Release-readiness static checks passed')
