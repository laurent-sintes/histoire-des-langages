import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { readCorpus } from '../packages/compiler/build.ts';
import { compileKnowledge } from '../packages/compiler/compile.ts';
import { validateCorpus } from '../packages/compiler/validate.ts';
import type { Corpus } from '../packages/metamodel/model.ts';
import { createKnowledgeModel } from '../packages/contracts/runtime.ts';

let corpus: Corpus;
before(async () => { ({ corpus } = await readCorpus()); });

test('la publication donne accès aux usages et à leurs sources depuis le graphe', () => {
  const data = compileKnowledge(corpus);
  const model = createKnowledgeModel(data);
  assert.equal(model.node('python'), undefined);
  assert.equal(model.search('echange')[0].id, 'echange-donnees');
  const usages = model.outgoing('json').filter(edge => edge.kind === 'used-for');
  assert.deepEqual(usages.map(edge => model.nodeAt(edge.to)?.id), ['echange-donnees', 'stockage-donnees']);
  assert.deepEqual(usages.map(edge => model.evidence(edge)[0].source.id), ['src-rfc4627', 'src-pg92']);
  assert.deepEqual(model.timeline('entite-association').map(event => event.date.start), [1975, 1976]);
  assert.ok(data.citations.length < [...data.nodes, ...data.relations, ...data.events].flatMap(item => item.citations).length);
  assert.ok(data.sources.every(source => source.id !== 'src-preetude'));
});

test('une nouvelle révision de source préserve les citations existantes', () => {
  const edited = structuredClone(corpus);
  const original = edited.sources.find(source => source.id === 'src-rfc4627')!;
  edited.sources.push({ ...original, revision: 2, title: 'Autre révision' });
  const graph = createKnowledgeModel(compileKnowledge(validateCorpus(edited)));
  const edge = graph.outgoing('json').find(relation => relation.id === 'r-json-echange')!;
  assert.equal(graph.evidence(edge)[0].source.revision, 1);
  edited.sources = edited.sources.filter(source => source !== original);
  assert.throws(() => validateCorpus(edited), /Source ou révision inconnue/);
});

test('une source IA seule ne peut pas étayer un nœud', () => {
  const edited = structuredClone(corpus);
  const node = edited.technologies.find(item => item.id === 'python')!;
  node.maturity = 'substantiated';
  node.evidence = [{ source: 'src-preetude', sourceRevision: 1, locator: 'p. 5', scope: 'Catalogage' }];
  assert.throws(() => validateCorpus(edited), /Preuve insuffisante/);
});

test('un lien ne peut pas publier implicitement un nœud à vérifier', () => {
  const edited = structuredClone(corpus);
  edited.technologies.find(node => node.id === 'json')!.maturity = 'unverified';
  assert.throws(() => validateCorpus(edited), /Nœud à qualifier/);
});

test('le sens et le type d’un lien « a créé » sont contrôlés', () => {
  const edited = structuredClone(corpus);
  const relation = edited.relations.find(item => item.kind === 'created')!;
  [relation.from, relation.to] = [relation.to, relation.from];
  assert.throws(() => validateCorpus(edited), /Sens ou types/);
});

test('les liens pendants, identifiants dupliqués et dates inversées sont rejetés', () => {
  const dangling = structuredClone(corpus);
  dangling.relations[0].to = 'inconnu';
  assert.throws(() => validateCorpus(dangling), /Nœud inconnu/);
  const duplicate = structuredClone(corpus);
  duplicate.technologies.push(duplicate.technologies[0]);
  assert.throws(() => validateCorpus(duplicate), /Identifiant dupliqué/);
  const reversed = structuredClone(corpus);
  reversed.events[0].date.end = reversed.events[0].date.start - 1;
  assert.throws(() => validateCorpus(reversed), /Date incohérente/);
});

test('l’ordre d’entrée des collections ne change pas le résultat compilé', () => {
  const edited = structuredClone(corpus);
  for (const records of [edited.parties, edited.technologies, edited.sources, edited.assertions, edited.relations, edited.events]) {
    records.reverse();
  }
  assert.deepEqual(compileKnowledge(edited), compileKnowledge(corpus));
});

test('un problème publié donne accès aux solutions et à leurs preuves', () => {
  const model = createKnowledgeModel(compileKnowledge(corpus));
  const problem = model.node('probleme-integration-composants');
  assert.ok(problem?.kind === 'concept' && problem.role === 'problem');
  const answers = model.incoming(problem.id).filter(edge => edge.kind === 'addresses');
  assert.deepEqual(answers.map(edge => model.nodeAt(edge.from)?.id).sort(), ['csharp', 'delphi']);
  assert.ok(answers.every(edge => model.evidence(edge).some(evidence => evidence.source.revision === 1)));
});

test('une réponse à un problème ne peut pas cibler une technologie ou un concept sans ce rôle', () => {
  for (const target of ['javascript', 'typage-structurel']) {
    const edited = structuredClone(corpus);
    edited.relations.find(edge => edge.id === 'r-ts-outillage')!.to = target;
    assert.throws(() => validateCorpus(edited), /technology → problem/);
  }
});

test('le parcours distingue l’inspiration de C# et la dérivation de TypeScript', () => {
  const model = createKnowledgeModel(compileKnowledge(corpus));
  const influences = model.outgoing('csharp').filter(edge => edge.kind === 'inspired-by');
  assert.ok(influences.some(edge => model.nodeAt(edge.to)?.id === 'delphi'));
  const derivations = model.outgoing('typescript').filter(edge => edge.kind === 'derived-from');
  assert.deepEqual(derivations.map(edge => model.nodeAt(edge.to)?.id), ['javascript']);
});
