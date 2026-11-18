import assert from 'node:assert/strict';
import { test } from 'node:test';
import appConfig, { releasedVersionsAsset } from '../../app/vite.config.ts';
import { expectedContracts } from './contract.ts';

const expected = expectedContracts('application');
test('contrat du site : chemins relatifs et manifeste des versions', () => {
  const versions = { metamodel: '1.3.4', model: '2.5.8', application: '3.6.7' };
  const asset = releasedVersionsAsset(versions);
  assert.deepEqual({ base: appConfig.base, versionsPath: asset.fileName }, expected('static-deployment'));
  assert.deepEqual(JSON.parse(asset.source), versions);
});
