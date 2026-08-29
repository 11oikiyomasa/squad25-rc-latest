import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'AGENTS.md',
  '.github/copilot-instructions.md',
  '.github/agents/squad-lead.agent.md',
  '.github/agents/squad-ux-reviewer.agent.md',
  '.github/agents/squad-security-reviewer.agent.md',
  '.github/agents/squad-performance-reviewer.agent.md',
  '.github/agents/squad-qa-reviewer.agent.md',
  '.github/agents/squad-release-reviewer.agent.md',
];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required agent contract file: ${relativePath}`);
  }
}

const agentDir = path.join(root, '.github', 'agents');
const agentFiles = fs.readdirSync(agentDir).filter((name) => name.endsWith('.agent.md'));

if (agentFiles.length < 6) {
  throw new Error(`Expected at least 6 SQUAD.25 custom agents, found ${agentFiles.length}`);
}

for (const fileName of agentFiles) {
  const content = fs.readFileSync(path.join(agentDir, fileName), 'utf8');
  if (!content.startsWith('---\n')) {
    throw new Error(`${fileName}: missing YAML frontmatter`);
  }
  if (!/^description:\s*.+$/m.test(content)) {
    throw new Error(`${fileName}: missing required description`);
  }
  if (!/^tools:\s*\[.+\]$/m.test(content)) {
    throw new Error(`${fileName}: missing explicit tools list`);
  }
  if (!/PASS|FAIL|BLOCK|READY/.test(content)) {
    throw new Error(`${fileName}: missing an explicit review/release verdict`);
  }
}

console.log(`Agent contract verified: ${agentFiles.length} custom agents.`);
