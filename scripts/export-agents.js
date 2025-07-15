const fs = require('fs');
const path = require('path');

const agentsSrc = path.resolve(__dirname, '../apps/backend/src/agents');
const exportRoot = path.resolve(__dirname, '../export');
const agentsDest = path.join(exportRoot, 'agents');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

fs.mkdirSync(agentsDest, { recursive: true });

let agentDirs = [];
if (fs.existsSync(agentsSrc)) {
  agentDirs = fs
    .readdirSync(agentsSrc, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of agentDirs) {
    copyDir(path.join(agentsSrc, dir), path.join(agentsDest, dir));
  }
}

let compose = "version: '3'\nservices:\n  gateway:\n    build: ../apps/backend\n    ports:\n      - '4000:4000'\n";

for (const dir of agentDirs) {
  compose += `  ${dir}:\n    build: ./agents/${dir}\n`;
}

fs.writeFileSync(path.join(exportRoot, 'docker-compose.yml'), compose);
console.log(`Exported ${agentDirs.length} agent(s) to ${agentsDest}`);


