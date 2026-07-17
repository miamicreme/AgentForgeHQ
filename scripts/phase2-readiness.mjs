import { existsSync, readFileSync } from 'node:fs'

const required = [
  'tsconfig.json',
  'eslint.config.js',
  '.github/workflows/phase2-validation.yml',
  'packages/execution-api/src/index.ts',
  'packages/execution-api/test/execution-api.test.ts',
  'packages/production-runtime/src/index.ts',
  'packages/production-runtime/test/production-runtime.test.ts',
  'packages/playground-client/src/index.ts',
  'packages/playground-client/test/playground-client.test.ts',
  'supabase/migrations/202607170008_production_validation_foundation.sql',
  'docs/PHASE_2_FIRST_HALF_THIRTY_PASS_AUDIT.md',
  'docs/PHASE_2_ENVIRONMENT_VALIDATION.md',
]

const failures = []
for (const path of required) if (!existsSync(path)) failures.push(`Missing Phase 2 artifact: ${path}`)

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (packageJson.packageManager !== 'pnpm@9.15.4') failures.push('pnpm must remain pinned to 9.15.4')
if (packageJson.engines?.node !== '>=20.11.0') failures.push('Node engine must remain >=20.11.0')
if (!packageJson.scripts?.verify?.includes('audit:phase2')) failures.push('Root verification must include audit:phase2')

const tsconfig = JSON.parse(readFileSync('tsconfig.json', 'utf8'))
if (tsconfig.compilerOptions?.strict !== true) failures.push('Root TypeScript strict mode is required')
if (tsconfig.compilerOptions?.moduleResolution !== 'NodeNext') failures.push('Root TypeScript module resolution must be NodeNext')

const executionApi = readFileSync('packages/execution-api/src/index.ts', 'utf8')
for (const token of ['idempotencyKey', 'assertRunnable', 'enqueue', 'findByIdempotency']) {
  if (!executionApi.includes(token)) failures.push(`Execution API missing ${token}`)
}

const runtime = readFileSync('packages/production-runtime/src/index.ts', 'utf8')
for (const token of ['dead_letter', 'validateToolPayload', 'requestHash', 'OpenAIResponsesAdapter', 'GitHubReadConnector', 'leaseExpiresAt']) {
  if (!runtime.includes(token)) failures.push(`Production runtime missing ${token}`)
}

const playground = readFileSync('packages/playground-client/src/index.ts', 'utf8')
for (const token of ['/api/executions', '/cancel', '/events', 'Cross-execution event']) {
  if (!playground.includes(token)) failures.push(`Playground client missing ${token}`)
}

const migration = readFileSync('supabase/migrations/202607170008_production_validation_foundation.sql', 'utf8')
for (const token of ['execution_jobs', 'execution_correlations', 'enable row level security', 'revoke insert', 'workspace mismatch']) {
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
