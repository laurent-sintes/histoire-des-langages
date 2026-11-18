import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { corpusSchema } from '../metamodel/model.ts';
import type { Corpus } from '../metamodel/model.ts';
import { compileKnowledge } from './compile.ts';
import { validateCorpus } from './validate.ts';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const schemaPath = resolve(root, 'source/schema-connaissances.json');
export const inputPath = resolve(root, 'source/connaissances.json');
export const outputPath = resolve(root, 'app/generated/knowledge.ts');

export function schemaText() {
  return JSON.stringify(z.toJSONSchema(corpusSchema, { reused: 'ref' }), null, 2) + '\n';
}

export async function readCorpus(): Promise<{ corpus: Corpus; sourceBytes: number }> {
  const bytes = await readFile(inputPath);
  const corpus = validateCorpus(JSON.parse(bytes.toString('utf8')));
  return { corpus, sourceBytes: bytes.length };
}

export async function verifySourceFiles(corpus: Corpus) {
  const localSources = corpus.sources.filter(source => source.path !== undefined);
  if (!localSources.length) return 0;
  const prefix = await realpath(resolve(root, 'sources')) + sep;
  for (const source of localSources) {
    const path = await realpath(resolve(root, source.path!));
    if (!path.startsWith(prefix)) {
      throw new Error(`Pièce locale introuvable dans sources/ : ${source.path}`);
    }
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(path)) hash.update(chunk);
    if (hash.digest('hex') !== source.sha256) throw new Error(`Empreinte différente : ${source.id}@${source.revision}`);
  }
  return localSources.length;
}

export async function writeIfChanged(path: string, content: string) {
  const prior = await readFile(path, 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
    return undefined;
  });
  if (prior === content) return;
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temp, content, 'utf8');
    await rename(temp, path);
  } finally {
    await rm(temp, { force: true });
  }
}

export async function buildKnowledge() {
  const { corpus, sourceBytes } = await readCorpus();
  const data = compileKnowledge(corpus);
  const module = `// Généré par pnpm build:model.\nimport { createKnowledgeModel } from '../../packages/contracts/runtime.ts';\nimport type { KnowledgeData } from '../../packages/contracts/runtime.ts';\nconst data: KnowledgeData = ${JSON.stringify(data)};\nexport const knowledge = createKnowledgeModel(data);\n`;
  await writeIfChanged(outputPath, module);
  return { data, sourceBytes, outputBytes: Buffer.byteLength(module) };
}
