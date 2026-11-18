import { corpusSchema, DESCENT_RELATIONS, matchesEndpoint, PUBLIC_EVIDENCE_KINDS, PUBLIC_MATURITY, relationRules } from '../metamodel/model.ts';
import type { Corpus, Period } from '../metamodel/model.ts';

function validatePeriod(period: Period, id: string) {
  if (period.start > period.end || (period.precision === 'year' && period.start !== period.end)) {
    throw new Error(`Date incohérente : ${id}`);
  }
}

function validateDescent(relations: Corpus['relations']) {
  const parents = new Map<string, string[]>();
  for (const relation of relations) {
    if (!DESCENT_RELATIONS.has(relation.kind)) continue;
    const direct = parents.get(relation.from) ?? [];
    direct.push(relation.to);
    parents.set(relation.from, direct);
  }

  const checked = new Set<string>();
  const inPath = new Set<string>();
  for (const start of parents.keys()) {
    if (checked.has(start)) continue;
    const stack = [{ id: start, rest: parents.get(start)!.values() }];
    inPath.add(start);
    while (stack.length) {
      const frame = stack.at(-1)!;
      const next = frame.rest.next();
      if (next.done) {
        checked.add(frame.id);
        inPath.delete(frame.id);
        stack.pop();
      } else if (inPath.has(next.value)) {
        const cycle = stack.slice(stack.findIndex(item => item.id === next.value)).map(item => item.id);
        throw new Error(`Cycle de descendance : ${[...cycle, next.value].join(' → ')}`);
      } else if (!checked.has(next.value)) {
        inPath.add(next.value);
        stack.push({ id: next.value, rest: (parents.get(next.value) ?? []).values() });
      }
    }
  }
}

export function validateCorpus(input: unknown): Corpus {
  const result = corpusSchema.safeParse(input);
  if (!result.success) {
    throw new Error(result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n'));
  }
  const corpus = result.data;
  const { parties, technologies, sources, assertions, relations, events } = corpus;
  const nodes = new Map([...parties, ...technologies].map(node => [node.id, node]));
  // Les sources peuvent coexister avec plusieurs révisions pour préserver les citations.
  const sourceIndex = new Map(sources.map(source => [`${source.id}@${source.revision}`, source]));
  if (sourceIndex.size !== sources.length) throw new Error('Révision de source dupliquée');
  const ids = new Set(sources.map(source => source.id));
  for (const item of [...parties, ...technologies, ...assertions, ...relations, ...events]) {
    if (ids.has(item.id)) throw new Error(`Identifiant dupliqué : ${item.id}`);
    ids.add(item.id);
    let supported = false;
    for (const proof of item.evidence) {
      const source = sourceIndex.get(`${proof.source}@${proof.sourceRevision}`);
      if (!source) throw new Error(`Source ou révision inconnue : ${item.id} → ${proof.source}@${proof.sourceRevision}`);
      supported ||= PUBLIC_EVIDENCE_KINDS.has(source.kind);
    }
    if (item.maturity === PUBLIC_MATURITY && !supported) throw new Error(`Preuve insuffisante : ${item.id}`);
  }
  for (const source of sources) {
    if (!source.url && !source.path) throw new Error(`Localisation de source requise : ${source.id}`);
    if (source.path && !source.sha256) throw new Error(`Empreinte de pièce locale requise : ${source.id}`);
  }
  function checkNode(id: string, owner: { id: string; maturity: string }) {
    const node = nodes.get(id);
    if (!node) throw new Error(`Nœud inconnu : ${owner.id} → ${id}`);
    if (owner.maturity === PUBLIC_MATURITY && node.maturity !== PUBLIC_MATURITY) {
      throw new Error(`Nœud à qualifier avant publication : ${owner.id} → ${id}`);
    }
    return node;
  }
  for (const item of relations) {
    const from = checkNode(item.from, item);
    const to = checkNode(item.to, item);
    if (from === to) throw new Error(`Auto-relation : ${item.id}`);
    const rule = relationRules[item.kind];
    if (!matchesEndpoint(from, rule.from) || !matchesEndpoint(to, rule.to)) {
      throw new Error(`Sens ou types de nœuds incompatibles : ${item.id} (${rule.from} → ${rule.to})`);
    }
    if (item.period) validatePeriod(item.period, item.id);
  }
  validateDescent(relations);
  for (const item of events) {
    checkNode(item.subject, item);
    validatePeriod(item.date, item.id);
    if ((item.kind === 'release') !== (item.versionLabel !== undefined)) {
      throw new Error(`Libellé de version historique incohérent : ${item.id}`);
    }
  }
  for (const item of assertions) {
    checkNode(item.subject, item);
    if ((item.category === 'vitality' || item.category === 'causality') && (!item.observedAt || !item.scope)) {
      throw new Error(`Date et périmètre requis : ${item.id}`);
    }
  }
  return corpus;
}
