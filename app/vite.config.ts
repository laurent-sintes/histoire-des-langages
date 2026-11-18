import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import { buildKnowledge } from '../packages/compiler/build.ts';
import { components, parseComponentVersion, versionFiles } from '../tools/git/versions.ts';
import type { Versions } from '../tools/git/versions.ts';

export function releasedVersionsAsset(versions: Versions) {
  return { type: 'asset' as const, fileName: 'versions.json', source: JSON.stringify(versions, null, 2) + '\n' };
}

const knowledgePlugin: Plugin = {
  name: 'histoire-modele-connaissance',
  async config() {
    await buildKnowledge();
  },
  async generateBundle() {
    const entries = await Promise.all(components.map(async key => {
      const raw = await readFile(new URL(`../${versionFiles[key]}`, import.meta.url), 'utf8');
      return [key, parseComponentVersion(raw)] as const;
    }));
    this.emitFile(releasedVersionsAsset(Object.fromEntries(entries) as Versions));
  },
};

export default {
  base: './',
  plugins: [knowledgePlugin],
};
