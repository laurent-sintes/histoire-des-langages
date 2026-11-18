import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import { promisify } from 'node:util';
import { finishMeasurement, finishRun, rotateRuns, startMeasurement, startRun } from './runs.ts';

const day = 86_400_000;
const now = Date.now();

function fixture(context: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'language-run-rotation-'));
  context.after(() => rmSync(root, { recursive: true }));
  return root;
}

test('la rotation respecte les durées et ignore les traitements actifs, anciens ou liés', context => {
  const root = fixture(context);
  assert.deepEqual(rotateRuns(root), []);
  const active = startRun(root);
  const success = startRun(root);
  const failure = startRun(root);
  const expiredFailure = startRun(root);
  const linked = startRun(root);
  const legacy = resolve(root, 'tmp', 'unclassified.txt');
  writeFileSync(legacy, 'ancienne preuve');
  finishRun(success, 'success', now - 14 * day);
  finishRun(failure, 'failure', now - 29 * day);
  finishRun(expiredFailure, 'failure', now - 30 * day);
  finishRun(linked, 'success', now - 30 * day);
  const target = join(root, 'audit');
  mkdirSync(target);
  symlinkSync(target, join(linked, 'evidence'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.deepEqual(rotateRuns(root, { now }).map(entry => entry.path), [expiredFailure, success]);
  assert.ok(existsSync(success) && existsSync(expiredFailure));
  assert.equal(rotateRuns(root, { now, apply: true }).length, 2);
  for (const path of [active, failure, linked, legacy, target]) assert.ok(existsSync(path), path);
  for (const path of [expiredFailure, success]) assert.ok(!existsSync(path), path);
});

test('le plafond s’applique après expiration et sélectionne les traitements clos les plus anciens', context => {
  const root = fixture(context);
  const oldest = startRun(root);
  const expired = startRun(root);
  const recent = startRun(root);
  for (const path of [oldest, expired, recent]) writeFileSync(join(path, 'sample.txt'), 'x'.repeat(100));
  finishRun(oldest, 'failure', now - 20 * day);
  finishRun(expired, 'success', now - 19 * day);
  finishRun(recent, 'success', now - day);
  const entries = rotateRuns(root, { now, limit: 160 });
  assert.deepEqual(entries.map(({ path, reason }) => [path, reason]), [[expired, 'age'], [oldest, 'size']]);
  assert.equal(rotateRuns(root, { now, limit: 400 }).length, 1);
});

test('une mesure terminée compte ses octets réels et une mesure active reste protégée', context => {
  const root = fixture(context);
  const active = startMeasurement(root);
  const success = startMeasurement(root);
  const failure = startMeasurement(root);
  for (const sample of [active, success, failure]) writeFileSync(sample, 'x'.repeat(40));
  const expired = finishMeasurement(success, 'success', now - 14 * day)!;
  const retained = finishMeasurement(failure, 'failure', now - 29 * day)!;
  const evidence = join(root, 'audit-evidence.json');
  writeFileSync(evidence, '{}');
  assert.deepEqual(rotateRuns(root, { now, limit: 50 }).map(entry => entry.path), [expired]);
  writeFileSync(retained, 'x'.repeat(60));
  assert.deepEqual(rotateRuns(root, { now, limit: 50, apply: true }).map(entry => entry.path), [expired, retained]);
  for (const path of [active, evidence]) assert.ok(existsSync(path));
  for (const path of [expired, retained]) assert.ok(!existsSync(path));
});

test('deux finalisations simultanées conservent le plafond total', async context => {
  const root = fixture(context);
  const active = startMeasurement(root);
  writeFileSync(active, 'pendant le traitement');
  const module = new URL('./runs.ts', import.meta.url).href;
  const complete = `
    import { writeFileSync } from 'node:fs';
    import { finishMeasurement, rotateRuns, startMeasurement } from ${JSON.stringify(module)};
    const root = process.argv[1];
    const sample = startMeasurement(root);
    writeFileSync(sample, 'x'.repeat(40));
    finishMeasurement(sample, 'success');
    rotateRuns(root, { apply: true, limit: 50 });
  `;
  await Promise.all(Array.from({ length: 2 }, () => promisify(execFile)(
    process.execPath, ['--input-type=module', '-e', complete, root],
  )));
  assert.ok(existsSync(active));
  assert.equal(readdirSync(join(root, 'tmp', 'runs')).filter(name => name.endsWith('.json')).length, 1);
  assert.deepEqual(rotateRuns(root, { limit: 50 }), []);
});
