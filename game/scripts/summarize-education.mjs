#!/usr/bin/env node
/**
 * Descriptive summary of exported education-study JSON.
 * Does not invent missing fields and does not run significance tests.
 *
 * Usage:
 *   node scripts/summarize-education.mjs export.json [more.json ...] [--out dir]
 */
import fs from 'node:fs';
import path from 'node:path';

const PAIRED_ITEMS = {
  pixel: ['G1-COMB-01', 'G1-NOISE-01'],
  'qc-shift': ['G2-SCREEN-01', 'G2-QC-01'],
  spectrum: ['G3-MIX-01', 'G3-DECODE-01'],
};

function parseArgs(argv) {
  const files = [];
  let outDir = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') {
      outDir = argv[i + 1] ?? null;
      i += 1;
      continue;
    }
    if (arg.startsWith('--out=')) {
      outDir = arg.slice('--out='.length);
      continue;
    }
    files.push(arg);
  }
  return { files, outDir };
}

function asSessions(parsed) {
  if (Array.isArray(parsed)) return parsed.filter((row) => row && typeof row === 'object');
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sessions)) {
    return parsed.sessions.filter((row) => row && typeof row === 'object');
  }
  if (parsed && typeof parsed === 'object' && parsed.anonymousSessionId && parsed.gameId) {
    return [parsed];
  }
  return [];
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function pairForItem(sessions, itemId) {
  let pairedN = 0;
  let preCorrect = 0;
  let postCorrect = 0;
  let improved = 0;
  let noChange = 0;
  let declined = 0;
  for (const session of sessions) {
    const answers = Array.isArray(session.answers) ? session.answers : [];
    const pre = answers.find((row) => row && row.studyItemId === itemId && row.phase === 'pre');
    const post = answers.find((row) => row && row.studyItemId === itemId && row.phase === 'post');
    if (!pre || !post || typeof pre.correct !== 'boolean' || typeof post.correct !== 'boolean') continue;
    pairedN += 1;
    if (pre.correct) preCorrect += 1;
    if (post.correct) postCorrect += 1;
    if (!pre.correct && post.correct) improved += 1;
    else if (pre.correct && !post.correct) declined += 1;
    else noChange += 1;
  }
  return { studyItemId: itemId, pairedN, preCorrect, postCorrect, improved, noChange, declined };
}

function meanQc(sessions) {
  const rows = sessions
    .map((session) => session.outcome?.qcShift)
    .filter((row) => row && typeof row === 'object');
  if (rows.length === 0) return null;
  const keys = [
    'monitorCount',
    'retestCount',
    'holdConfirmCount',
    'missedSimulatedRisks',
    'unnecessaryHolds',
  ];
  const out = {};
  for (const key of keys) {
    const nums = rows.map((row) => row[key]).filter((n) => typeof n === 'number' && Number.isFinite(n));
    out[key] = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  }
  return out;
}

function summarize(sessions) {
  const games = ['pixel', 'qc-shift', 'spectrum'];
  return games.map((gameId) => {
    const group = sessions.filter((session) => session.gameId === gameId);
    const durations = group
      .map((session) => session.durationMs)
      .filter((n) => typeof n === 'number' && Number.isFinite(n));
    const hints = group
      .map((session) => session.hintsUsed)
      .filter((n) => typeof n === 'number' && Number.isFinite(n));
    const spectrumOutcomes = group.filter((session) => session.outcome?.spectrum);
    return {
      gameId,
      sessionCount: group.length,
      completedPlay: group.filter((session) => session.completedPlay === true).length,
      pairedItems: (PAIRED_ITEMS[gameId] ?? []).map((id) => pairForItem(group, id)),
      medianDurationMs: median(durations),
      medianHintsUsed: median(hints),
      qcMeans: gameId === 'qc-shift' ? meanQc(group) : null,
      spectrumSolved:
        gameId === 'spectrum'
          ? spectrumOutcomes.filter((session) => session.outcome.spectrum.solved === true).length
          : null,
      spectrumAttempted: gameId === 'spectrum' ? spectrumOutcomes.length : null,
    };
  });
}

function toMarkdown(summaries) {
  const lines = [
    '# Education study descriptive summary',
    '',
    'Descriptive counts only. Missing fields are omitted, not invented.',
    '',
  ];
  for (const block of summaries) {
    if (block.sessionCount === 0) continue;
    lines.push(`## ${block.gameId}`);
    lines.push(`- sessions: ${block.sessionCount}`);
    lines.push(`- completed play: ${block.completedPlay}`);
    if (block.medianDurationMs != null) lines.push(`- median durationMs: ${block.medianDurationMs}`);
    if (block.medianHintsUsed != null) lines.push(`- median hintsUsed: ${block.medianHintsUsed}`);
    for (const item of block.pairedItems) {
      lines.push(
        `- ${item.studyItemId}: paired n=${item.pairedN}; pre correct=${item.preCorrect}; post correct=${item.postCorrect}; improved=${item.improved}; no-change=${item.noChange}; declined=${item.declined}`,
      );
    }
    if (block.qcMeans) {
      const q = block.qcMeans;
      const part = (label, value) => (value == null ? null : `${label}=${value.toFixed(2)}`);
      const bits = [
        part('monitor', q.monitorCount),
        part('retest', q.retestCount),
        part('holdConfirm', q.holdConfirmCount),
        part('missed simulated risks', q.missedSimulatedRisks),
        part('unnecessary holds', q.unnecessaryHolds),
      ].filter(Boolean);
      if (bits.length) lines.push(`- QC mean decisions: ${bits.join(', ')}`);
    }
    if (block.spectrumAttempted != null) {
      lines.push(`- spectrum solved/attempted: ${block.spectrumSolved ?? 0}/${block.spectrumAttempted}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function toCsv(summaries) {
  const rows = ['gameId,studyItemId,pairedN,preCorrect,postCorrect,improved,noChange,declined'];
  for (const block of summaries) {
    for (const item of block.pairedItems) {
      rows.push(
        [
          block.gameId,
          item.studyItemId,
          item.pairedN,
          item.preCorrect,
          item.postCorrect,
          item.improved,
          item.noChange,
          item.declined,
        ].join(','),
      );
    }
  }
  return `${rows.join('\n')}\n`;
}

function main() {
  const { files, outDir } = parseArgs(process.argv.slice(2));
  if (files.length === 0) {
    console.error('Usage: node scripts/summarize-education.mjs <export.json> [more.json ...] [--out dir]');
    process.exitCode = 1;
    return;
  }

  const all = [];
  for (const file of files) {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      console.warn(`skip ${file}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    const sessions = asSessions(parsed);
    console.warn(`read ${file}: ${sessions.length} session(s)`);
    all.push(...sessions);
  }

  const summaries = summarize(all);
  const markdown =
    all.length === 0
      ? '# Education study descriptive summary\n\nNo sessions found.\n'
      : toMarkdown(summaries);
  process.stdout.write(markdown);

  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'summary.md'), markdown);
    fs.writeFileSync(path.join(outDir, 'paired-summary.csv'), toCsv(summaries));
    console.warn(`wrote ${path.join(outDir, 'summary.md')} and paired-summary.csv`);
  }
}

main();
