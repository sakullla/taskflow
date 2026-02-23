import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const todoPath = resolve(root, "TODO.md");
const outputPath = resolve(root, "docs", "AGENT_TASK_BOARD.md");

const raw = readFileSync(todoPath, "utf8");
const lines = raw.split(/\r?\n/);

const sectionDefaults = {
  "Product and UX": "frontend-builder",
  "Frontend (`apps/web`)": "frontend-builder",
  "Backend (`apps/api`)": "backend-builder",
  "Cross-cutting": "release-devops",
  Release: "release-devops"
};

const sectionOrder = [
  "Product and UX",
  "Frontend (`apps/web`)",
  "Backend (`apps/api`)",
  "Cross-cutting",
  "Release"
];

function normalizeSection(line) {
  return line.replace(/^##\s+\d+\)\s*/, "").trim();
}

function scoreAgent(task, section) {
  const text = task.toLowerCase();
  const scores = {
    "frontend-builder": 0,
    "backend-builder": 0,
    "qa-reviewer": 0,
    "release-devops": 0
  };

  const fallback = sectionDefaults[section] ?? "frontend-builder";
  scores[fallback] += 2;

  if (/(drawer|sidebar|ux|my day|filter|search|frontend|web|cache|optimistic)/.test(text)) {
    scores["frontend-builder"] += 3;
  }

  if (/(api|rest|endpoint|storage|database|auth|validation|service|backend|sqlite|postgres)/.test(text)) {
    scores["backend-builder"] += 3;
  }

  if (/(test|qa|smoke|bug bash|e2e|verify)/.test(text)) {
    scores["qa-reviewer"] += 4;
  }

  if (/(ci|deploy|release|pipeline|telemetry|logging|secrets|env template)/.test(text)) {
    scores["release-devops"] += 4;
  }

  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

const tasks = [];
let currentSection = "Unknown";

for (const line of lines) {
  if (line.startsWith("## ")) {
    currentSection = normalizeSection(line);
    continue;
  }

  const match = line.match(/^- \[( |x)\] (.+)$/);
  if (!match) {
    continue;
  }

  const done = match[1] === "x";
  const title = match[2].trim();

  tasks.push({
    section: currentSection,
    title,
    done,
    agent: scoreAgent(title, currentSection)
  });
}

const pending = tasks.filter((task) => !task.done);

const grouped = {
  "frontend-builder": [],
  "backend-builder": [],
  "qa-reviewer": [],
  "release-devops": []
};

for (const task of pending) {
  grouped[task.agent].push(task);
}

const now = new Date().toISOString();
const linesOut = [
  "# Agent Task Board",
  "",
  `Generated: ${now}`,
  "",
  "## Dispatch Rules",
  "- Source of truth: `TODO.md` unchecked tasks",
  "- Assignment logic: section default + keyword scoring",
  "- Re-generate with: `npm run agent:dispatch`",
  "",
  "## Queue by Agent"
];

for (const agentName of Object.keys(grouped)) {
  linesOut.push("", `### ${agentName}`);
  if (grouped[agentName].length === 0) {
    linesOut.push("- No pending tasks.");
    continue;
  }

  const ordered = grouped[agentName].sort((a, b) => {
    const aIdx = sectionOrder.indexOf(a.section);
    const bIdx = sectionOrder.indexOf(b.section);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  for (const task of ordered) {
    linesOut.push(`- [ ] (${task.section}) ${task.title}`);
  }
}

linesOut.push("", "## Snapshot", `- Total tasks: ${tasks.length}`, `- Pending tasks: ${pending.length}`);

writeFileSync(outputPath, `${linesOut.join("\n")}\n`, "utf8");

console.log(`Generated ${outputPath}`);
console.log(`Pending tasks: ${pending.length}`);
for (const [agentName, agentTasks] of Object.entries(grouped)) {
  console.log(`${agentName}: ${agentTasks.length}`);
}
