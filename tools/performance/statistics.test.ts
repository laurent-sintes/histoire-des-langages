import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reportPerformance } from './statistics.ts';
import type { Sample } from './statistics.ts';

const commit = 'a'.repeat(40);
const baseline: Sample[] = Array.from({ length: 6 }, (_, index) => ({
  version: 1, commit: String(index + 1).repeat(40), task: 'tests', profile: 'ci/linux/x64/v24',
  measuredAt: `2026-11-0${index + 1}T00:00:00.000Z`, dirty: false, exitCode: 0,
  wallMs: 500, cpuMs: 400, peakRssKiB: 80 * 1024,
}));
const current = { ...baseline[0], commit, wallMs: 740, cpuMs: 440 };

test('une dérive durable par rapport aux commits comparables propose un audit', () => {
  const report = reportPerformance(baseline, commit, [current]);
  assert.equal(report.warnings.length, 1);
  assert.match(report.warnings[0], /740 ms contre 500 ms/);
  assert.match(report.markdown, /30 à chaud/);
});

test('les exécutions échouées, modifiées et d’un autre profil ne constituent pas une référence', () => {
  const history = [
    ...baseline.slice(0, 4),
    { ...baseline[4], exitCode: 1 },
    { ...baseline[5], profile: 'local/win32/x64/v24' },
    { ...baseline[5], dirty: true },
  ];
  const report = reportPerformance(history, commit, [current]);
  assert.deepEqual(report.warnings, []);
  assert.match(report.markdown, /4 commit\(s\) comparable\(s\)/);
  assert.deepEqual(reportPerformance(baseline, commit, [{ ...current, exitCode: 1 }]).warnings, []);
});
