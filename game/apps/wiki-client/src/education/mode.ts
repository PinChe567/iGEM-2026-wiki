import { isStudyQueryEnabled } from '@suite/core/education';

export function isStudyMode(): boolean {
  if (typeof window === 'undefined') return false;
  return isStudyQueryEnabled(window.location.search);
}
