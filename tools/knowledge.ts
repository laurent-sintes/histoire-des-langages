import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { buildKnowledge, readCorpus, schemaPath, schemaText, verifySourceFiles, writeIfChanged } from '../packages/compiler/build.ts';
import { validateCorpus } from '../packages/compiler/validate.ts';
import { checkRevisions } from '../packages/compiler/revisions.ts';

const [command, option, argument, ...extra] = process.argv.slice(2);
async function readRevisionBaseline(option: string, value: string) {
  if (option === '--against') return validateCorpus(JSON.parse(await readFile(value, 'utf8')));
  if (!/^[a-f0-9]{40}$/.test(value)) throw new Error('Indiquer le SHA complet de la référence de révisions.');
  const content = execFileSync('git', ['show', `${value}:source/connaissances.json`], {
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  try {
    return validateCorpus(JSON.parse(content));
  } catch (error) {
    throw new Error(`Corpus de référence ${value} incompatible. Vérifier la migration de schéma.\n${error instanceof Error ? error.message : error}`);
  }
}

try {
  if (command === 'schema' && !option) {
    await writeIfChanged(schemaPath, schemaText());
    console.log('Schéma JSON synchronisé.');
  } else if (command === 'check' && (!option || (['--against', '--against-ref'].includes(option) && argument && !extra.length))) {
    const checkedSchema = (await readFile(schemaPath, 'utf8')).replaceAll('\r\n', '\n');
    if (checkedSchema !== schemaText()) throw new Error('Schéma périmé. Exécuter pnpm schema.');
    const { corpus } = await readCorpus();
    if (argument) checkRevisions(await readRevisionBaseline(option, argument), corpus);
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
    throw new Error('Usage : node tools/knowledge.ts schema | check [--against fichier.json | --against-ref SHA] | check-sources | build');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
import { execFileSync } from 'node:child_process';
