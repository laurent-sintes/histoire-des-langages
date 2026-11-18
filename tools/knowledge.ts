import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { buildKnowledge, readCorpus, schemaPath, schemaText, verifySourceFiles, writeIfChanged } from '../packages/compiler/build.ts';
import { validateCorpus } from '../packages/compiler/validate.ts';
import type { Corpus } from '../packages/metamodel/model.ts';

const [command, option, argument, ...extra] = process.argv.slice(2);
const collections = ['parties', 'technologies', 'relations', 'assertions', 'events'] as const;

function checkRevisions(previous: Corpus, current: Corpus) {
  for (const collection of collections) {
    const baseline = new Map(previous[collection].map(item => [item.id, item]));
    for (const item of current[collection]) {
      const before = baseline.get(item.id);
      if (!before) continue;
      const { revision, ...fields } = item;
      const { revision: oldRevision, ...oldFields } = before;
      if (revision < oldRevision || (revision === oldRevision && JSON.stringify(fields) !== JSON.stringify(oldFields))) {
        throw new Error(`Révision à augmenter : ${item.id} (référence r${oldRevision})`);
      }
    }
  }
  const sources = new Map(current.sources.map(source => [`${source.id}@${source.revision}`, source]));
  for (const source of previous.sources) {
    const key = `${source.id}@${source.revision}`;
    if (JSON.stringify(sources.get(key)) !== JSON.stringify(source)) {
      throw new Error(`Révision de source modifiée ou supprimée : ${key}. Ajouter une nouvelle révision.`);
    }
  }
}

try {
  if (command === 'schema' && !option) {
    await writeIfChanged(schemaPath, schemaText());
    console.log('Schéma JSON synchronisé.');
  } else if (command === 'check' && (!option || (option === '--against' && argument && !extra.length))) {
    const checkedSchema = (await readFile(schemaPath, 'utf8')).replaceAll('\r\n', '\n');
    if (checkedSchema !== schemaText()) throw new Error('Schéma périmé. Exécuter pnpm schema.');
    const { corpus } = await readCorpus();
    if (argument) checkRevisions(validateCorpus(JSON.parse(await readFile(argument, 'utf8'))), corpus);
    console.log(`Corpus valide : ${corpus.parties.length + corpus.technologies.length} nœuds, ${corpus.relations.length} relations, ${corpus.events.length} événements.`);
  } else if (command === 'check-sources' && !option) {
    const { corpus } = await readCorpus();
    console.log(`Empreintes vérifiées : ${await verifySourceFiles(corpus)} pièce(s) locale(s).`);
  } else if (command === 'build' && !option) {
    const { data, sourceBytes, outputBytes } = await buildKnowledge();
    const compressedDataBytes = gzipSync(JSON.stringify(data)).length;
    console.log(`app/generated/knowledge.ts : ${outputBytes} octets depuis ${sourceBytes} octets éditoriaux.`);
    console.log(`Données publiables : ${data.nodes.length} nœuds, ${data.relations.length} relations, ${data.events.length} événements, ${data.citations.length} citations uniques (${compressedDataBytes} octets gzip estimés pour les données seules).`);
  } else {
    throw new Error('Usage : node tools/knowledge.ts schema | check [--against fichier.json] | check-sources | build');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
