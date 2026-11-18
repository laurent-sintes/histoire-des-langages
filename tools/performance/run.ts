import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { finishRun, rotateRuns, startRun } from '../temporary/runs.ts';

const [task, ...args] = process.argv.slice(2);
if (!task || !/^[a-z][a-z-]*$/.test(task) || !args.length) {
  throw new Error('Usage : node tools/performance/run.ts tâche arguments-node…');
}

function git(...args: string[]) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return undefined;
  }
}

const ci = process.env.GITHUB_ACTIONS === 'true';
const commit = ci ? process.env.GITHUB_SHA : git('rev-parse', 'HEAD');
const dirty = !ci && git('status', '--porcelain') !== '';
const sha = commit && /^[a-f0-9]{40}$/.test(commit) ? commit : 'uncommitted';
const project = resolve('.');
const run = ci ? undefined : startRun(project);
const destination = run ? resolve(run, sha, task, 'sample.json') : resolve('tmp/performance', sha, task, `${randomUUID()}.json`);
const outcome = spawnSync(process.execPath, ['--import', './tools/performance/record.ts', ...args], {
  stdio: 'inherit',
  env: { ...process.env, KNOWLEDGE_PERF_SAMPLE: destination, KNOWLEDGE_PERF_TASK: task, KNOWLEDGE_PERF_COMMIT: sha, KNOWLEDGE_PERF_DIRTY: String(dirty) },
});
if (run) {
  finishRun(run, outcome.status === 0 ? 'success' : 'failure');
  try {
    const entries = rotateRuns(project, { apply: process.env.KNOWLEDGE_ROTATION_SIMULATE !== 'true' });
    if (entries.length) console.log(`[tmp] ${entries.length} dossier(s) de traitement admissible(s) à la rotation.`);
  } catch (error) {
    console.warn(`[tmp] Rotation interrompue : ${error instanceof Error ? error.message : error}`);
  }
}
if (outcome.error) throw outcome.error;
process.exitCode = outcome.status ?? 1;
