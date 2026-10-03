import { describe, expect, it } from 'vitest';
import { CHANNEL_COUNT, CHART_PAD, channelBarRect, channelCenterX } from './chart';

describe('spectrum chart channel geometry', () => {
  it('places line dots on bar centers so question, options, and result can share an x-axis', () => {
    const plotW = 480;
    for (let j = 0; j < CHANNEL_COUNT; j += 1) {
      const bar = channelBarRect(j, plotW, 120, 0.5);
      expect(bar.x + bar.w / 2).toBeCloseTo(channelCenterX(j, plotW), 8);
    }
    expect(channelCenterX(0, plotW)).toBeGreaterThan(CHART_PAD.l);
    expect(channelCenterX(11, plotW)).toBeLessThan(CHART_PAD.l + plotW);
  });
});
