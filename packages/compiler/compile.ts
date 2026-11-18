import { PUBLIC_MATURITY } from '../metamodel/model.ts';
import type { Corpus } from '../metamodel/model.ts';
import type { CitationRow, GraphSource, KnowledgeData, Published } from '../contracts/runtime.ts';

const compareId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

export function compileKnowledge(corpus: Corpus): KnowledgeData {
  const sourceIndex = new Map(corpus.sources.map(source => [`${source.id}@${source.revision}`, source]));
  const sources: GraphSource[] = [];
  const citations: CitationRow[] = [];
  const sourcePositions = new Map<string, number>();
  const citationPositions = new Map<string, number>();

  function internCitation(proof: Corpus['relations'][number]['evidence'][number]) {
    const key = `${proof.source}@${proof.sourceRevision}`;
    let sourcePos = sourcePositions.get(key);
    if (sourcePos === undefined) {
      const { id, revision, title, kind, url } = sourceIndex.get(key)!;
      sourcePos = sources.length;
      sources.push({ id, revision, title, kind, ...(url ? { url } : {}) });
      sourcePositions.set(key, sourcePos);
    }
    const row: CitationRow = [sourcePos, proof.locator, proof.scope];
    const rowKey = JSON.stringify(row);
    const existing = citationPositions.get(rowKey);
    if (existing !== undefined) return existing;
    const position = citations.length;
    citations.push(row);
    citationPositions.set(rowKey, position);
    return position;
  }

  function published<T extends { maturity: string; id: string }>(records: T[]) {
    return records.filter(record => record.maturity === PUBLIC_MATURITY).sort(compareId);
  }
  function pack<T extends { evidence: Corpus['relations'][number]['evidence']; maturity: string }>(record: T): Published<T> {
    const { evidence, maturity: _, ...fields } = record;
    // Packing preserves the record's discriminant and all its other fields.
    return { ...fields, maturity: PUBLIC_MATURITY, citations: [...new Set(evidence.map(internCitation))] } as Published<T>;
  }

  const nodes = published([...corpus.parties, ...corpus.technologies]).map(pack);
  const positions = new Map(nodes.map((node, index) => [node.id, index]));
  return {
    format: 2, metamodel: corpus.version, nodes, sources, citations,
    relations: published(corpus.relations).map(({ from, to, ...relation }) => ({
      ...pack(relation), from: positions.get(from)!, to: positions.get(to)!,
    })),
    events: published(corpus.events)
      .sort((a, b) => a.date.start - b.date.start || a.date.end - b.date.end || compareId(a, b))
      .map(({ subject, ...event }) => ({ ...pack(event), subject: positions.get(subject)! })),
    assertions: published(corpus.assertions).map(({ subject, ...assertion }) => ({
      ...pack(assertion), subject: positions.get(subject)!,
    })),
  };
}
