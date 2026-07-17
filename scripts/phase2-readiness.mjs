import { existsSync, readFileSync } from 'node:fs'

const required = [
  'eslint.config.js',
  'packages/execution-api/src/index.ts',
  'packages/execution-api/test/execution-api.test.ts',
  'packages/production-runtime/src/index.ts',
  'packages/production-runtime/test/production-runtime.test.ts',
  'supabase/migrations/202607170008_production_validation_foundation.sql',
  'docs/PHASE_2_FIRST_HALF_THIRTY_PASS_AUDIT.md',
]

const failures = []
for (const path of required) if (!existsSync(path)) failures.push(`Missing Phase 2 artifact: ${path}`)

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (packageJson.packageManager !== 'pnpm@9.15.4') failures.push('pnpm must remain pinned to 9.15.4')
if (packageJson.engines?.node !== '>=20.11.0') failures.push('Node engine must remain >=20.11.0')

const executionApi = readFileSync('packages/execution-api/src/index.ts', 'utf8')
for (const token of ['idempotencyKey', 'assertRunnable', 'enqueue']) {
  if (!executionApi.includes(token)) failures.push(`Execution API missing ${token}`)
}

const runtime = readFileSync('packages/production-runtime/src/index.ts', 'utf8')
for (const token of ['dead_letter', 'validateToolPayload', 'requestHash', 'OpenAIResponsesAdapter', 'GitHubReadConnector']) {
  if (!runtime.includes(token)) failures.push(`Production runtime missing ${token}`)
}

const migration = readFileSync('supabase/migrations/202607170008_production_validation_foundation.sql', 'utf8')
for (const token of ['execution_jobs', 'execution_correlations', 'enable row level security', 'revoke insert']) {
  if (!migration.toLowerCase().includes(token.toLowerCase())) failures.push(`Production migration missing ${token}`)
}

const lockfilePresent = existsSync('pnpm-lock.yaml')
if (process.env.REQUIRE_LOCKFILE === '1' && !lockfilePresent) failures.push('pnpm-lock.yaml is required in strict validation mode')
if (!lockfilePresent) console.warn('Phase 2 warning: pnpm-lock.yaml still requires environment-backed generation')

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('Phase 2 first-half static readiness checks passed')
