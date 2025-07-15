const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const agentsDir = path.join(root, 'apps', 'backend', 'src', 'agents');
const exportAgentsDir = path.join(root, 'export', 'agents');
const composeFile = path.join(root, 'export', 'docker-compose.yml');

function getAgentNames() {
  if (!fs.existsSync(agentsDir)) return [];
  return fs.readdirSync(agentsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

function copyAgents(names) {
  if (!fs.existsSync(exportAgentsDir)) {
    fs.mkdirSync(exportAgentsDir, { recursive: true });
  }
  names.forEach(name => {
    const src = path.join(agentsDir, name);
    const dest = path.join(exportAgentsDir, name);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(src, dest, { recursive: true });
  });
}

function createCompose(names) {
  const lines = [];
  lines.push("version: '3.8'");
  lines.push('services:');
  lines.push('  gateway:');
  lines.push('    build: ../apps/backend');
  lines.push("    ports:");
  lines.push("      - '4000:4000'");
  names.forEach(name => {
    lines.push(`  ${name}:`);
    lines.push(`    build: ./agents/${name}`);
  });
  if (!fs.existsSync(path.dirname(composeFile))) {
    fs.mkdirSync(path.dirname(composeFile), { recursive: true });
  }
  fs.writeFileSync(composeFile, lines.join('\n'));
}

const agentNames = getAgentNames();
copyAgents(agentNames);
createCompose(agentNames);
console.log(`Exported ${agentNames.length} agent${agentNames.length === 1 ? '' : 's'}`);

