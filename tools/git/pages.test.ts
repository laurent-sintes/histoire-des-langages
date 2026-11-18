import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pagesHead, publishedPages, verifyReleaseBase } from './pages.ts';
import { affectedComponents, planVersions } from './versions.ts';

const published = 'a'.repeat(40);
const rejected = 'b'.repeat(40);
const candidate = 'c'.repeat(40);
const publication = { state: 'success', environment_url: 'https://example.test/project/' };

function github<T>(path: string, latest = { state: 'failure' }): T {
  if (path.startsWith('deployments?')) return [
    { id: 3, sha: candidate }, { id: 2, sha: rejected }, { id: 1, sha: published },
  ] as T;
  if (path.startsWith('deployments/3/')) return [latest] as T;
  if (path.startsWith('deployments/2/')) return [{ state: 'success' }] as T;
  return [{ state: 'inactive' }, publication] as T;
}

test('une livraison refusée suivie de documentation garde la référence effectivement publiée', () => {
  assert.equal(pagesHead(() => publishedPages(github)), published);
  const current = { metamodel: '1.1.1', model: '1.1.1', application: '1.1.1' };
  for (const paths of [['app/main.tsx'], ['app/main.tsx', 'README.md']]) {
    const affected = affectedComponents(paths);
    assert.throws(() => planVersions(current, current, affected, {}), /Choisir --application/);
    const versioned = { ...current, application: '1.1.2' };
    assert.deepEqual(planVersions(current, versioned, affected, {}), versioned);
  }
});

test('une publication en attente bloque la préparation locale et un succès change la référence', () => {
  assert.throws(() => pagesHead(() => publishedPages(path => github(path, { state: 'in_progress' }))), /en cours/);
  assert.equal(publishedPages(path => github(path, publication)).sha, candidate);
  assert.throws(() => publishedPages(() => [] as never), /Aucun déploiement/);
  assert.throws(() => verifyReleaseBase(published, candidate, () => rejected), /ancêtre/);
  assert.doesNotThrow(() => verifyReleaseBase(published, candidate, () => published));
});
