import { readFile, access } from 'node:fs/promises'

const requiredFiles = [
  'package.json',
  'pnpm-workspace.yaml',
  '.github/workflows/ci.yml',
  '.env.example',
  'packages/agent-spec/src/index.ts',
  'packages/auth/src/index.ts',
  'supabase/migrations/202607170001_agentforge_foundation.sql',
]

const failures = []
for (const path of requiredFiles) {
  try {
    await access(path)
  } catch {
    failures.push(`Missing required foundation file: ${path}`)
  }
}

const root = JSON.parse(await readFile('package.json', 'utf8'))
if (root.private !== true) failures.push('Root package must remain private')
if (root.packageManager !== 'pnpm@9.15.4') failures.push('packageManager must be pinned to pnpm@9.15.4')
if (!String(root.engines?.node ?? '').includes('20')) failures.push('Node 20 must be declared in engines')

const env = await readFile('.env.example', 'utf8')
const forbiddenBrowserSecrets = [
  'VITE_SUPABASE_SERVICE_KEY',
  'VITE_OPENAI_API_KEY',
  'VITE_STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_OPENAI_API_KEY',
  'NEXT_PUBLIC_STRIPE_SECRET_KEY',
]
for (const name of forbiddenBrowserSecrets) {
  if (env.includes(name)) failures.push(`Server secret is browser exposed in .env.example: ${name}`)
}

const workspace = await readFile('pnpm-workspace.yaml', 'utf8')
for (const pattern of ["'apps/*'", "'packages/*'", "'services/*'"]) {
  if (!workspace.includes(pattern)) failures.push(`Workspace pattern missing: ${pattern}`)
}

if (failures.length > 0) {
  console.error('Foundation audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Foundation audit passed (${requiredFiles.length} files, package manager, Node, workspace, and secret checks).`)
