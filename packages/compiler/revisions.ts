import { isDeepStrictEqual } from 'node:util';
import type { Corpus } from '../metamodel/model.ts';

const collections = ['parties', 'technologies', 'relations', 'assertions', 'events'] as const;

export function checkRevisions(previous: Corpus, current: Corpus) {
  for (const collection of collections) {
    const baseline = new Map(previous[collection].map(item => [item.id, item]));
    for (const item of current[collection]) {
      const before = baseline.get(item.id);
      if (!before) continue;
      const { revision, ...fields } = item;
      const { revision: oldRevision, ...oldFields } = before;
      if (revision < oldRevision || (revision === oldRevision && !isDeepStrictEqual(fields, oldFields))) {
        throw new Error(`Révision à augmenter : ${item.id} (référence r${oldRevision})`);
      }
    }
  }
  const sources = new Map(current.sources.map(source => [`${source.id}@${source.revision}`, source]));
  for (const source of previous.sources) {
    const key = `${source.id}@${source.revision}`;
    if (!isDeepStrictEqual(sources.get(key), source)) {
      throw new Error(`Révision de source modifiée ou supprimée : ${key}. Ajouter une nouvelle révision.`);
    }
  }
}
