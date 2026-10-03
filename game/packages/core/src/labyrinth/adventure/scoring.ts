import type { AdventureScore, AdventureSession } from './types';

const TIME_BUDGET_MS = 240_000;

export function computeAdventureScore(session: AdventureSession): AdventureScore {
  const health = session.player.health * 20;
  const modules = session.player.collectedModules.length * 80;
  const odors = session.player.learnedOdorIds.length * 30;
  const secrets = session.player.discoveredSecretIds.length * 50;
  const defeated = session.player.defeatedEnemyIds.length * 15;
  const timeBonus =
    session.phase === 'victory' ? Math.max(0, Math.round((TIME_BUDGET_MS - session.elapsedMs) / 1000)) : 0;
  return {
    health,
    modules,
    odors,
    secrets,
    defeated,
    timeBonus,
    total: health + modules + odors + secrets + defeated + timeBonus,
  };
}
