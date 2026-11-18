import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const ci = process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true';
const args = ['node_modules/typescript/bin/tsc', '--noEmit'];
if (!ci) {
  mkdirSync('.cache', { recursive: true });
  args.push('--incremental', '--tsBuildInfoFile', '.cache/typecheck.tsbuildinfo');
}

const check = spawnSync(process.execPath, [
  'tools/performance/run.ts', ci ? 'check-types' : 'check-types-incremental', ...args,
], { stdio: 'inherit' });
if (check.error) throw check.error;
process.exitCode = check.status ?? 1;
