import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import { finishRun, rotateRuns, startRun } from './runs.ts';

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
