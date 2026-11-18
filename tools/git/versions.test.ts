import assert from 'node:assert/strict';
import { test } from 'node:test';
import { affectedComponents, increment, parseBumps, parseComponentVersion, planVersions } from './versions.ts';
import type { Versions } from './versions.ts';
import { testImpact } from './test-impact.ts';
import type { TestSuites } from './test-impact.ts';

const current: Versions = { metamodel: '1.3.4', model: '2.5.8', application: '3.6.7' };

test('les compteurs de version repartent à 1 et refusent zéro', () => {
  assert.equal(increment('1.3.4', 'major'), '2.1.1');
  assert.equal(increment('1.3.4', 'minor'), '1.4.1');
  assert.equal(increment('1.3.4', 'patch'), '1.3.5');
  assert.throws(() => parseComponentVersion('{"version":"1.0.1"}'), /entiers positifs/);
});

test('les garanties modifiées, extensions compatibles et régressions déterminent le rang', () => {
  const suites: TestSuites = {
    metamodel: { 'problem-response': { kind: 'contract', introduction: 'coverage', expected: { from: 'technology', to: 'problem' } } },
    model: { 'public-graph-format': { kind: 'contract', introduction: 'coverage', expected: 1 } },
    application: {},
  };
  const edited = structuredClone(suites);
  edited.metamodel['problem-response'].expected = { from: 'party', to: 'problem' };
  edited.model['compatible-extension'] = { kind: 'contract', introduction: 'extension', expected: true };
  edited.application['fixed-behaviour'] = { kind: 'regression', expected: true };
  edited.application['extra-coverage'] = { kind: 'contract', introduction: 'coverage', expected: true };
  const minimums = testImpact(suites, edited);
  assert.deepEqual(minimums, { metamodel: 'major', model: 'minor', application: 'patch' });
  assert.deepEqual(planVersions(current, current, new Set(), {}, minimums),
    { metamodel: '2.1.1', model: '2.6.1', application: '3.6.8' });
  assert.throws(() => planVersions(current, current, new Set(), { metamodel: 'patch' }, minimums), /au moins le niveau major/);
  delete edited.model['public-graph-format'];
  assert.equal(testImpact(suites, edited).model, 'major');
});

test('deux composants évoluent indépendamment et une reprise ne double pas les versions', () => {
  const affected = affectedComponents(['packages/metamodel/model.ts', 'source/connaissances.json', 'app/README.md']);
  const levels = parseBumps(['--metamodel', 'major', '--model', 'minor']);
  const released = { metamodel: '2.1.1', model: '2.6.1', application: '3.6.7' };
  assert.deepEqual(planVersions(current, current, affected, levels), released);
  assert.deepEqual(planVersions(current, released, affected, levels), released);
  assert.deepEqual(planVersions(current, released, affected, {}), released);
});

test('la CI rejette une version oubliée ou une transition qui saute un niveau', () => {
  const affected = affectedComponents(['app/main.tsx']);
  assert.throws(() => planVersions(current, current, affected, {}), /Choisir --application/);
  assert.throws(() => planVersions(current, { ...current, application: '3.6.9' }, affected, {}), /Transition invalide/);
  assert.deepEqual(planVersions(current, current, affectedComponents(['docs/livraison.md']), {}), current);
  assert.throws(() => planVersions(undefined, current, affected, {}), /1\.1\.1/);
});
