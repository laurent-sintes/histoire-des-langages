import { appendFile, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { reportPerformance } from './statistics.ts';
import type { Sample } from './statistics.ts';

const [history, current, commit] = process.argv.slice(2);
if (!history || !current || !commit || !/^[a-f0-9]{40}$/.test(commit)) {
  throw new Error('Usage : node tools/performance/report.ts historique mesures commit');
}
async function readSamples(root: string) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const files = entries.filter(entry => entry.isFile() && entry.name.endsWith('.json'));
  const samples: Sample[] = [];
  for (const file of files) samples.push(JSON.parse(await readFile(resolve(file.parentPath, file.name), 'utf8')));
  return samples;
}
const report = reportPerformance(await readSamples(history), commit, await readSamples(current));
console.log(report.markdown);
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, report.markdown);
  for (const warning of report.warnings) console.log(`::warning::Dérive de performance à confirmer. ${warning.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')}`);
}
