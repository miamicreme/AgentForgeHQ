const fs = require('fs/promises');
const path = require('path');

async function main() {
  const root = path.join(__dirname, '..');
  const agentsDir = path.join(root, 'apps', 'backend', 'src', 'agents');
  const exportDir = path.join(root, 'export');
  const exportAgentsDir = path.join(exportDir, 'agents');

  await fs.rm(exportAgentsDir, { recursive: true, force: true });
  await fs.mkdir(exportAgentsDir, { recursive: true });

  const entries = await fs.readdir(agentsDir, { withFileTypes: true });
  const agentNames = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const srcPath = path.join(agentsDir, entry.name);
    const destPath = path.join(exportAgentsDir, entry.name);
    await fs.cp(srcPath, destPath, { recursive: true });
    agentNames.push(entry.name);
  }

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
  await fs.writeFile(path.join(exportDir, 'docker-compose.yml'), lines.join('\n'));

  console.log(`Exported ${agentNames.length} agent(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
