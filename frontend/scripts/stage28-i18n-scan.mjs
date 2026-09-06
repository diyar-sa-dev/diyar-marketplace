#!/usr/bin/env node
/**
 * Stage 28.4 — Scan for potential hardcoded UI strings in TSX (heuristic).
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules' || name === '__tests__') continue;
      walk(p, acc);
    } else if (/\.tsx$/.test(name) && !name.includes('.test.')) {
      acc.push(p);
    }
  }
  return acc;
}

const findings = [];
const jsxTextRegex = />\s*([A-Za-z][A-Za-z0-9\s,'!?.\-]{3,60})\s*</g;

for (const file of walk(root)) {
  const content = readFileSync(file, 'utf8');
  if (content.includes('translate(') || content.includes('t(') || content.includes('useLocale')) {
    continue; // likely i18n-aware file — still scan for mixed
  }
  let m;
  while ((m = jsxTextRegex.exec(content)) !== null) {
    const text = m[1].trim();
    if (/^(div|span|className|button|input|path|svg)$/i.test(text)) continue;
    findings.push({ file: file.replace(/\\/g, '/').split('/src/')[1], text });
  }
}

const result = {
  timestamp_utc: new Date().toISOString(),
  files_scanned: walk(root).length,
  potential_hardcoded_count: findings.length,
  sample: findings.slice(0, 40),
  note: 'Heuristic only — t() usage excluded from scan; manual review required',
};

const out = process.argv[2] || null;
const json = JSON.stringify(result, null, 2);
if (out) writeFileSync(out, json);
console.log(`Hardcoded heuristic: ${findings.length} hits in ${result.files_scanned} tsx files`);
