import type { Corpus, KnowledgeNode, PUBLIC_MATURITY } from '../metamodel/model.ts';

type PublishedFields = { maturity: typeof PUBLIC_MATURITY; citations: number[] };
export type Published<T> = T extends unknown ? Omit<T, 'evidence' | 'maturity'> & PublishedFields : never;
export type GraphNode = Published<KnowledgeNode>;
export type GraphRelation = Published<Omit<Corpus['relations'][number], 'from' | 'to'>> & { from: number; to: number };
export type GraphEvent = Published<Omit<Corpus['events'][number], 'subject'>> & { subject: number };
export type GraphAssertion = Published<Omit<Corpus['assertions'][number], 'subject'>> & { subject: number };
export type GraphSource = Pick<Corpus['sources'][number], 'id' | 'revision' | 'title' | 'kind' | 'url'>;
export type CitationRow = [source: number, locator: string, scope: string];

export type KnowledgeData = {
  format: 2;
  metamodel: Corpus['version'];
  nodes: GraphNode[];
  relations: GraphRelation[];
  events: GraphEvent[];
  assertions: GraphAssertion[];
  sources: GraphSource[];
  citations: CitationRow[];
};

const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** API utilisable en navigateur. Les index sont calculés une fois. */
export function createKnowledgeModel(data: KnowledgeData) {
  const positions = new Map(data.nodes.map((node, index) => [node.id, index]));
  const labels = data.nodes.map(node => [node.label, ...node.aliases].map(normalize));
  const outgoing = data.nodes.map(() => [] as GraphRelation[]);
  const incoming = data.nodes.map(() => [] as GraphRelation[]);
  const events = data.nodes.map(() => [] as GraphEvent[]);
  const assertions = data.nodes.map(() => [] as GraphAssertion[]);
  for (const relation of data.relations) {
    outgoing[relation.from].push(relation);
    incoming[relation.to].push(relation);
  }
  for (const event of data.events) events[event.subject].push(event);
  for (const assertion of data.assertions) assertions[assertion.subject].push(assertion);

  return {
    node: (id: string): GraphNode | undefined => data.nodes[positions.get(id) ?? -1],
    nodeAt: (position: number): GraphNode | undefined => data.nodes[position],
    search(query: string) {
      const needle = normalize(query.trim());
      return data.nodes.filter((_, i) => labels[i].some(label => label.includes(needle)));
    },
    outgoing: (id: string): readonly GraphRelation[] => outgoing[positions.get(id) ?? -1] ?? [],
    incoming: (id: string): readonly GraphRelation[] => incoming[positions.get(id) ?? -1] ?? [],
    timeline: (id?: string): readonly GraphEvent[] => id === undefined ? data.events : events[positions.get(id) ?? -1] ?? [],
    assertions: (id: string): readonly GraphAssertion[] => assertions[positions.get(id) ?? -1] ?? [],
    evidence(record: Pick<PublishedFields, 'citations'>) {
      return record.citations.map(index => {
        const [source, locator, scope] = data.citations[index];
        return { source: data.sources[source], locator, scope };
      });
    },
  };
}
