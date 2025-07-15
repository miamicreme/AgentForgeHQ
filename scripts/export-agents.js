const fs = require('fs/promises');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', 'apps', 'backend', 'src', 'agents');
const EXPORT_DIR = path.join(__dirname, '..', 'export', 'agents');
const COMPOSE_PATH = path.join(__dirname, '..', 'export', 'docker-compose.yml');

async function copyAgents() {
  await fs.mkdir(EXPORT_DIR, { recursive: true });
  const entries = await fs.readdir(AGENTS_DIR, { withFileTypes: true });
  const agentNames = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // skip .gitkeep and hidden files
    const srcPath = path.join(AGENTS_DIR, entry.name);
    const destPath = path.join(EXPORT_DIR, entry.name);
    await fs.cp(srcPath, destPath, { recursive: true });
    agentNames.push(entry.name);
  }
  return agentNames;
}

function generateCompose(agentNames) {
  const lines = ["version: '3.8'", 'services:', `  gateway:`, `    build: ../apps/backend`, `    ports:`, `      - '4000:4000'`, `    env_file:`, `      - ../.env.example`];
  for (const name of agentNames) {
    lines.push(`  ${name}:`, `    build: ./agents/${name}`);
  }
  return lines.join('\n') + '\n';
}

async function main() {
  const names = await copyAgents();
  const compose = generateCompose(names);
  await fs.writeFile(COMPOSE_PATH, compose);
  console.log(`Exported ${names.length} agents`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
