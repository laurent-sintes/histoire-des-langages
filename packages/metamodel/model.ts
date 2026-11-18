import { z } from 'zod';

export const METAMODEL_VERSION = '0.4.0';
export const PUBLIC_MATURITY = 'substantiated';
export const PUBLIC_EVIDENCE_KINDS: ReadonlySet<string> = new Set(['primary', 'academic']);
type Endpoint = 'party' | 'technology' | 'concept' | 'problem';
type RelationRule = Readonly<{ from: Endpoint; to: Endpoint }>;

/** Directions are semantic. A lineage view can display their inverse. */
export const relationRules = {
  created: { from: 'party', to: 'technology' },
  influenced: { from: 'party', to: 'technology' },
  supports: { from: 'party', to: 'technology' },
  'contributes-to': { from: 'party', to: 'technology' },
  'derived-from': { from: 'technology', to: 'technology' },
  'inspired-by': { from: 'technology', to: 'technology' },
  'inherits-from': { from: 'technology', to: 'technology' },
  resembles: { from: 'technology', to: 'technology' },
  implements: { from: 'technology', to: 'technology' },
  applies: { from: 'technology', to: 'technology' },
  succeeds: { from: 'technology', to: 'technology' },
  'used-for': { from: 'technology', to: 'concept' },
  addresses: { from: 'technology', to: 'problem' },
} as const satisfies Record<string, RelationRule>;

export const DESCENT_RELATIONS: ReadonlySet<keyof typeof relationRules> = new Set(['derived-from', 'inherits-from']);

const relationKinds = Object.keys(relationRules) as (keyof typeof relationRules)[];
const id = z.string().regex(/^[a-z][a-z0-9-]*$/);
const text = z.string().min(1);
const identity = { id, revision: z.int().positive() };
const maturity = z.enum(['unverified', PUBLIC_MATURITY, 'disputed', 'hypothesis']);
const citation = z.strictObject({
  source: id, sourceRevision: identity.revision, locator: text, scope: text,
});
const qualified = { ...identity, maturity, evidence: z.array(citation) };
const statement = { ...qualified, text, evidence: qualified.evidence.min(1) };
const node = { ...qualified, label: text, aliases: z.array(text) };
const period = z.strictObject({
  start: z.int(), end: z.int(), precision: z.enum(['year', 'approximate', 'range']),
});
const source = z.strictObject({
  ...identity, title: text, kind: z.enum(['ai-prestudy', 'primary', 'academic', 'secondary']),
  consulted: z.iso.date(), note: text, path: text.optional(), url: z.string().regex(/^https?:\/\//).optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});
const assertion = z.strictObject({
  ...statement, subject: id, category: z.enum(['cataloging', 'technical', 'history', 'vitality', 'causality']),
  observedAt: z.iso.date().optional(), scope: text.optional(),
});
const event = z.strictObject({
  ...statement, subject: id, date: period, versionLabel: text.optional(),
  kind: z.enum(['design', 'publication', 'standardization', 'release', 'discontinuation', 'attestation', 'presentation']),
});
const relation = z.strictObject({
  ...statement, from: id, to: id, kind: z.enum(relationKinds), period: period.optional(),
});

/** Editorial metamodel and single source for the JSON Schema and types. */
export const corpusSchema = z.strictObject({
  version: z.literal(METAMODEL_VERSION),
  parties: z.array(z.strictObject({ ...node, kind: z.enum(['person', 'organization']) })),
  technologies: z.array(z.discriminatedUnion('kind', [
    z.strictObject({ ...node, kind: z.literal('product') }),
    z.strictObject({ ...node, kind: z.literal('concept'), role: z.literal('problem').optional() }),
  ])),
  sources: z.array(source), assertions: z.array(assertion), relations: z.array(relation), events: z.array(event),
});

export type Corpus = z.infer<typeof corpusSchema>;
export type Period = z.infer<typeof period>;
export type KnowledgeNode = Corpus['parties'][number] | Corpus['technologies'][number];

export function matchesEndpoint(node: KnowledgeNode, endpoint: Endpoint): boolean {
  switch (endpoint) {
    case 'party': return node.kind === 'person' || node.kind === 'organization';
    case 'technology': return node.kind === 'concept' || node.kind === 'product';
    case 'concept': return node.kind === 'concept';
    case 'problem': return node.kind === 'concept' && node.role === 'problem';
  }
}
