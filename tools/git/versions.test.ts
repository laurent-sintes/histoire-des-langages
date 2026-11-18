import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, test } from 'node:test';
import { affectedComponents, components, increment, parseBumps, parseComponentVersion, planVersions, testFiles } from './versions.ts';
import type { Component, Versions } from './versions.ts';
import { parseTestSuite, testImpact } from './test-impact.ts';
import type { TestSuites } from './test-impact.ts';
import { relationRules } from '../../packages/metamodel/model.ts';
import { compileKnowledge } from '../../packages/compiler/compile.ts';
import { readCorpus } from '../../packages/compiler/build.ts';
import appConfig, { releasedVersionsAsset } from '../../app/vite.config.ts';

const current: Versions = { metamodel: '1.3.4', model: '2.5.8', application: '3.6.7' };

test('les compteurs de version repartent à 1 et refusent zéro', () => {
  assert.equal(increment('1.3.4', 'major'), '2.1.1');
  assert.equal(increment('1.3.4', 'minor'), '1.4.1');
  assert.equal(increment('1.3.4', 'patch'), '1.3.5');
  assert.throws(() => parseComponentVersion('{"version":"1.0.1"}'), /entiers positifs/);
});

const suites = Object.fromEntries(components.map(module => [
  module, parseTestSuite(readFileSync(new URL(`../../${testFiles[module]}`, import.meta.url), 'utf8')),
])) as TestSuites;
const executed = new Set<string>();
function expected(module: Component, id: string) {
  const descriptor = suites[module][id];
  assert.ok(descriptor, `Test absent du catalogue : ${module}/${id}`);
  executed.add(`${module}/${id}`);
  return descriptor.expected;
}
after(() => {
  const declared = components.flatMap(module => Object.keys(suites[module]).map(id => `${module}/${id}`));
  assert.deepEqual([...executed].sort(), declared.sort(), 'Chaque attente déclarée doit être exécutée.');
});

test('contrat du métamodèle : une réponse relie une technologie à un problème', () => {
  assert.deepEqual(relationRules.addresses, expected('metamodel', 'problem-response'));
});

test('contrat du modèle : format et structure des citations publiées', async () => {
  const { corpus } = await readCorpus();
  const data = compileKnowledge(corpus);
  assert.deepEqual({ format: data.format, citationColumns: data.citations[0].length },
    expected('model', 'public-graph-format'));
});

test('contrat du site : chemins relatifs et manifeste des versions', () => {
  const asset = releasedVersionsAsset(current);
  assert.deepEqual({ base: appConfig.base, versionsPath: asset.fileName }, expected('application', 'static-deployment'));
  assert.deepEqual(JSON.parse(asset.source), current);
});

test('les garanties modifiées, extensions compatibles et régressions déterminent le rang', () => {
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
