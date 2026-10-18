import { spawnSync } from 'node:child_process';

// Advisories with no patched release that cannot reach site visitors or the Worker,
// as [id, reason] pairs. Each needs a reason. Remove an entry as soon as a fix ships.
const accepted = new Map([]);
const blocking = new Set(['high', 'critical']);

// A fixed command string: Windows needs a shell to find npm.cmd.
const result = spawnSync('npm audit --json', { encoding: 'utf8', shell: true });
let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error(result.stderr || 'npm audit returned no readable report.');
  process.exit(1);
}
if (report.error) {
  console.error(`npm audit failed: ${report.error.summary || report.error.code}`);
  process.exit(1);
}

const advisories = new Map();
for (const vulnerability of Object.values(report.vulnerabilities || {})) {
  for (const via of vulnerability.via) {
    if (typeof via === 'object') advisories.set(via.url.split('/').pop(), via);
  }
}

const failures = [];
for (const [id, advisory] of advisories) {
  if (!blocking.has(advisory.severity)) continue;
  if (accepted.has(id)) {
    console.warn(`Accepted ${advisory.severity} ${id} (${advisory.name}): ${accepted.get(id)}`);
  } else {
    failures.push(`${advisory.severity} ${id} in ${advisory.name}: ${advisory.title}`);
  }
}
for (const id of accepted.keys()) {
  if (!advisories.has(id)) console.warn(`${id} is no longer reported; remove it from scripts/audit-deps.mjs.`);
}

if (failures.length > 0) {
  console.error(`Dependency audit failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Dependency audit passed: no unaccepted high or critical advisories (${advisories.size} total reported).`);
