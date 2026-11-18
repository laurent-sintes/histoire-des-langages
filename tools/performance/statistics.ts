export type Sample = {
  version: 1;
  commit: string;
  task: string;
  dirty: boolean;
  measuredAt: string;
  exitCode: number;
  profile: string;
  wallMs: number;
  cpuMs: number;
  peakRssKiB: number;
};

const metrics = {
  wallMs: { label: 'temps total', ratio: 0.20, delta: 100 },
  cpuMs: { label: 'temps CPU', ratio: 0.20, delta: 100 },
  peakRssKiB: { label: 'mémoire RSS', ratio: 0.15, delta: 24 * 1024 },
} as const;
type Metric = keyof typeof metrics;
const metricKeys = Object.keys(metrics) as Metric[];

function median(values: number[]) {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const unit = (key: Metric, value: number) => key === 'peakRssKiB' ? `${(value / 1024).toFixed(1)} Mio` : `${Math.round(value)} ms`;
export function reportPerformance(samples: Sample[], currentCommit: string, currentRun: Sample[]) {
  const good = (sample: Sample) => sample.version === 1 && !sample.dirty && sample.exitCode === 0;
  const groups = Map.groupBy(currentRun.filter(item => good(item) && item.commit === currentCommit), item => `${item.task}:${item.profile}`);
  const lines = ['## Performance', '', `Commit mesuré \`${currentCommit}\`.`, ''];
  const warnings: string[] = [];
  for (const current of groups.values()) {
    const { task, profile } = current[0];
    const previous = samples.filter(item => good(item) && item.commit !== currentCommit
      && /^[a-f0-9]{40}$/.test(item.commit) && item.task === task && item.profile === profile)
      .toSorted((a, b) => b.measuredAt.localeCompare(a.measuredAt));
    const commits = [...Map.groupBy(previous, item => item.commit).values()].slice(0, 10);
    const values = metricKeys.map(key => unit(key, median(current.map(item => item[key]))));
    lines.push(`- **${task}** · ${values[0]} total · ${values[1]} CPU · ${values[2]} au pic. ${commits.length} commit(s) comparable(s).`);
    if (commits.length < 5) continue;
    for (const key of metricKeys) {
      const rule = metrics[key];
      const reference = median(commits.map(entries => median(entries.map(item => item[key]))));
      const observed = median(current.map(item => item[key]));
      if (observed - reference < rule.delta || observed < reference * (1 + rule.ratio)) continue;
      warnings.push(`${task} · ${rule.label} : ${unit(key, observed)} contre ${unit(key, reference)} (médiane de ${commits.length} commits).`);
    }
  }
  if (!groups.size) lines.push('Aucune mesure réussie issue de ce commit dans cette session.');
  if (warnings.length) {
    lines.push('', '### Dérive à confirmer', '', ...warnings.map(warning => `- ${warning}`), '',
      '**Test complet proposé.** Rejouer le commit mesuré et un commit de référence sur le même runner et le même corpus, en alternant les deux versions.',
      'Pour chaque version, mesurer 10 exécutions à froid et 30 à chaud. Comparer médiane, p95, pic RSS et temps CPU.',
      'Si la dérive se confirme, profiler CPU et mémoire, isoler la phase dominante, proposer une correction chiffrée puis rejouer la même série.');
  }
  return { markdown: lines.join('\n') + '\n', warnings };
}
