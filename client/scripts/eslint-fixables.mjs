import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(readFileSync(join(root, "eslint-report.json"), "utf8"));
let fixable = 0;
let total = 0;
for (const f of report) {
  for (const m of f.messages || []) {
    total++;
    if (m.fix) fixable++;
  }
}
console.log({ totalMessages: total, withFix: fixable });
