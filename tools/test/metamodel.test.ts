import assert from 'node:assert/strict';
import { test } from 'node:test';
import { relationRules } from '../../packages/metamodel/model.ts';
import { readCorpus } from '../../packages/compiler/build.ts';
import { validateCorpus } from '../../packages/compiler/validate.ts';
import { expectedContracts } from './contract.ts';

const expected = expectedContracts('metamodel');
test('contrat du métamodèle : une réponse relie une technologie à un problème', () => {
  assert.deepEqual(relationRules.addresses, expected('problem-response'));
});

test('contrat du métamodèle : la descendance est acyclique', async () => {
  const { corpus } = await readCorpus();
  const origin = corpus.relations.find(edge => edge.kind === 'derived-from' && edge.from === 'typescript')!;
  const returned = { ...origin, id: 'test-retour', from: origin.to, to: origin.from, kind: 'inherits-from' as const };
  assert.throws(() => validateCorpus({ ...corpus, relations: [...corpus.relations, returned] }), /Cycle de descendance/);
  corpus.relations = corpus.relations.filter(edge => edge.id !== origin.id);
  assert.doesNotThrow(() => validateCorpus({ ...corpus, relations: [
    ...corpus.relations, { ...origin, kind: 'inspired-by' }, { ...returned, kind: 'inspired-by' },
  ] }));
  assert.deepEqual({ descentCycleAccepted: false, reciprocalInfluenceAccepted: true }, expected('acyclic-descent'));
});
