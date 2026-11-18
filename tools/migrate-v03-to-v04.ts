import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { METAMODEL_VERSION } from '../packages/metamodel/model.ts';
import { validateCorpus } from '../packages/compiler/validate.ts';
import { writeIfChanged } from '../packages/compiler/build.ts';

const [input, output] = process.argv.slice(2);
if (!input || !output || resolve(input) === resolve(output)) {
  throw new Error('Usage : node tools/migrate-v03-to-v04.ts ancien.json nouveau.json');
}
const corpus = JSON.parse(await readFile(input, 'utf8'));
if (corpus.version !== '0.3.0') throw new Error('Version d’entrée attendue : 0.3.0');

const vocabulary = {
  maturity: { 'a-verifier': 'unverified', etaye: 'substantiated', conteste: 'disputed', hypothese: 'hypothesis' },
  party: { personne: 'person', organisation: 'organization' },
  source: { 'preetude-ia': 'ai-prestudy', primaire: 'primary', academique: 'academic', secondaire: 'secondary' },
  assertion: { catalogage: 'cataloging', technique: 'technical', histoire: 'history', vitalite: 'vitality', causalite: 'causality' },
  relation: {
    'a-cree': 'created', 'a-influence': 'influenced', porte: 'supports', 'contribue-a': 'contributes-to',
    'derive-de': 'derived-from', 's-inspire-de': 'inspired-by', 'herite-de': 'inherits-from',
    'ressemble-a': 'resembles', implemente: 'implements', applique: 'applies', 'succede-a': 'succeeds',
    'sert-a': 'used-for', 'repond-a': 'addresses',
  },
  event: {
    conception: 'design', publication: 'publication', standardisation: 'standardization', version: 'release',
    'arret-produit': 'discontinuation', attestation: 'attestation', presentation: 'presentation',
  },
  precision: { annee: 'year', approximative: 'approximate', intervalle: 'range' },
  role: { probleme: 'problem' },
};
function translate(field: keyof typeof vocabulary, value: string) {
  const names: Record<string, string> = vocabulary[field];
  if (!Object.hasOwn(names, value)) throw new Error(`Valeur v0.3 inconnue (${field}) : ${value}`);
  return names[value];
}

for (const item of [...corpus.parties, ...corpus.technologies, ...corpus.assertions, ...corpus.relations, ...corpus.events]) {
  item.maturity = translate('maturity', item.maturity);
}
for (const source of corpus.sources) source.kind = translate('source', source.kind);
for (const party of corpus.parties) party.kind = translate('party', party.kind);
for (const technology of corpus.technologies) {
  if (technology.role !== undefined) technology.role = translate('role', technology.role);
}
for (const assertion of corpus.assertions) assertion.category = translate('assertion', assertion.category);
for (const relation of corpus.relations) {
  relation.kind = translate('relation', relation.kind);
  if (relation.period) relation.period.precision = translate('precision', relation.period.precision);
}
for (const event of corpus.events) {
  event.kind = translate('event', event.kind);
  event.date.precision = translate('precision', event.date.precision);
}
corpus.version = METAMODEL_VERSION;
validateCorpus(corpus);
await writeIfChanged(resolve(output), JSON.stringify(corpus, null, 2) + '\n');
