import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readCorpus } from '../../packages/compiler/build.ts';
import { compileKnowledge } from '../../packages/compiler/compile.ts';
import { expectedContracts } from './contract.ts';

const expected = expectedContracts('model');
test('contrat du modèle : format et structure des citations publiées', async () => {
  const { corpus } = await readCorpus();
  const data = compileKnowledge(corpus);
  assert.deepEqual({ format: data.format, citationColumns: data.citations[0].length },
    expected('public-graph-format'));
});
