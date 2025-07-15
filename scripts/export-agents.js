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

  // Build context for the gateway should resolve from the export directory
  // so docker compose can be executed from within `export/`.
  lines.push('    build: ../apps/backend');
  lines.push("    ports:");
  lines.push("      - '4000:4000'");
  names.forEach(name => {
    lines.push(`  ${name}:`);
    // Each agent is copied under export/agents so use a relative build path
    // that works when the compose file is run from export/.
    lines.push(`    build: ./agents/${name}`);
  });
  if (!fs.existsSync(path.dirname(composeFile))) {
    fs.mkdirSync(path.dirname(composeFile), { recursive: true });

  }

  await fs.mkdir(exportDir, { recursive: true });
  await fs.writeFile(path.join(exportDir, 'docker-compose.yml'), lines.join('\n'));

  console.log(`Exported ${agentNames.length} agent(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
