#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');

async function main() {
  const repoRoot = path.join(__dirname, '..');
  const agentsDir = path.join(repoRoot, 'apps', 'backend', 'src', 'agents');
  const exportDir = path.join(repoRoot, 'export');
  const exportAgentsDir = path.join(exportDir, 'agents');

  try {
    await fs.access(agentsDir);
  } catch {
    console.error(`Agents directory not found: ${agentsDir}`);
    process.exit(1);
  }

  await fs.rm(exportAgentsDir, { recursive: true, force: true });
  await fs.mkdir(exportAgentsDir, { recursive: true });

  const entries = await fs.readdir(agentsDir, { withFileTypes: true });
  const agentNames = [];

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory() || entry.name.startsWith('.')) return;
      const srcPath = path.join(agentsDir, entry.name);
      const destPath = path.join(exportAgentsDir, entry.name);
      await fs.cp(srcPath, destPath, { recursive: true });
      agentNames.push(entry.name);
    }),
  );

  const lines = [];
  lines.push('version: "3"');
  lines.push('services:');
  lines.push('  gateway:');
  lines.push('    build: ./apps/backend');
  lines.push('    ports:');
  lines.push('      - "4000:4000"');

  for (const name of agentNames) {
    lines.push(`  ${name}:`);
    lines.push(`    build: ./export/agents/${name}`);
  }

  await fs.mkdir(exportDir, { recursive: true });
  await fs.writeFile(
    path.join(exportDir, 'docker-compose.yml'),
    lines.join('\n') + '\n',
  );

  console.log(`Exported ${agentNames.length} agent${agentNames.length === 1 ? '' : 's'}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
