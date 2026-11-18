import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { root, writeIfChanged } from '../packages/compiler/build.ts';

const base = resolve(root, 'sources/preetude/histoire-et-filiations-des-langages');
const destination = process.argv[2] ? resolve(process.argv[2]) : `${base}.txt`;
try {
  const data = new Uint8Array(await readFile(`${base}.pdf`));
  const pdfModule = import.meta.resolve('pdfjs-dist/legacy/build/pdf.mjs');
  const standardFontDataUrl = fileURLToPath(new URL('../../standard_fonts/', pdfModule)).replaceAll('\\', '/');
  const load = getDocument({ data, standardFontDataUrl, stopAtErrors: true });
  const pages: string[] = [];
  try {
    const document = await load.promise;
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index);
      const { items } = await page.getTextContent();
      const text = items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : '') : '').join('');
      pages.push(`--- PAGE ${index} ---\n${text.trim()}`);
      page.cleanup();
    }
  } finally {
    await load.destroy();
  }
  await writeIfChanged(destination, pages.join('\n\n') + '\n');
  console.log(`${pages.length} pages extraites.`);
} catch (error) {
  console.error(`Extraction impossible : ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
