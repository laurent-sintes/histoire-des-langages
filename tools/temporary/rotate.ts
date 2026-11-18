import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { rotateRuns } from './runs.ts';

const args = process.argv.slice(2);
const apply = args.length === 1 && args[0] === '--apply';
if (args.length && !apply) throw new Error('Usage : pnpm tmp:rotate [--apply]');
const root = fileURLToPath(new URL('../../', import.meta.url));
const entries = rotateRuns(root, { apply });
console.log(`${apply ? 'Rotation appliquée' : 'Simulation de rotation'} · ${entries.length} traitement(s) admissible(s).`);
for (const entry of entries) console.log(`${relative(root, entry.path)} · ${entry.size} octets · ${entry.reason}`);
