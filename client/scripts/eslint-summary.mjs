import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(readFileSync(join(root, "eslint-report.json"), "utf8"));

const byRule = {};
const byFile = {};
for (const f of report) {
  for (const m of f.messages || []) {
    const id = m.ruleId || "(none)";
    byRule[id] = (byRule[id] || 0) + 1;
    const rel = f.filePath.replace(/\\/g, "/").split("/client/").pop() || f.filePath;
    if (!byFile[rel]) byFile[rel] = {};
    byFile[rel][id] = (byFile[rel][id] || 0) + 1;
  }
}

console.log("BY RULE\n", Object.entries(byRule).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}\t${k}`).join("\n"));
const topFiles = Object.entries(byFile)
  .map(([file, rules]) => [file, Object.values(rules).reduce((a, b) => a + b, 0)] )
  .sort((a, b) => b[1] - a[1])
  .slice(0, 40);
console.log("\nTOP FILES\n", topFiles.map(([f, n]) => `${n}\t${f}`).join("\n"));
