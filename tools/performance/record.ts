import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { availableParallelism } from 'node:os';

const path = process.env.KNOWLEDGE_PERF_SAMPLE;
if (path) {
  const start = performance.now();
  const ci = process.env.GITHUB_ACTIONS === 'true';
  process.once('exit', exitCode => {
    const wallMs = Math.round(performance.now() - start);
    const usage = process.resourceUsage();
    const cpuMs = Math.round((usage.userCPUTime + usage.systemCPUTime) / 1000);
    const sample = {
      version: 1,
      commit: process.env.KNOWLEDGE_PERF_COMMIT,
      task: process.env.KNOWLEDGE_PERF_TASK,
      dirty: process.env.KNOWLEDGE_PERF_DIRTY === 'true',
      measuredAt: new Date().toISOString(), exitCode,
      profile: [ci ? 'github-actions' : 'local', process.platform, process.arch,
        process.version, ci ? process.env.ImageOS ?? 'unknown-image' : 'desktop', availableParallelism()].join('/'),
      run: ci ? `${process.env.GITHUB_RUN_ID}/${process.env.GITHUB_RUN_ATTEMPT}` : undefined,
      wallMs, cpuMs, peakRssKiB: usage.maxRSS,
    };
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(sample, null, 2) + '\n', { flag: 'wx' });
    console.log(`[performance] ${sample.task} · ${wallMs} ms · CPU ${cpuMs} ms · RSS pic ${(usage.maxRSS / 1024).toFixed(1)} Mio · ${sample.commit?.slice(0, 12)}`);
  });
}
