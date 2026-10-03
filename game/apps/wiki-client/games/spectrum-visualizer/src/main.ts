import '@suite/ui/tokens.css';
import '@suite/ui/shell.css';
import '@suite/ui/components.css';
import './visualizer.css';
import { mountShell, shellMain } from '../../../src/shell/mount';
import { paintVisualizer } from './visualizer';

if (!import.meta.env.DEV) {
  document.title = 'Not available';
  const app = document.querySelector('#app');
  if (app) {
    app.innerHTML =
      '<main style="padding:2rem;font-family:system-ui"><p>Scent Spectrum visualizer is dev-only.</p><p><a href="../../index.html">Back to hub</a></p></main>';
  }
} else {
  const appNode = document.querySelector('#app');
  if (!(appNode instanceof HTMLElement)) throw new Error('#app missing');
  const appRoot: HTMLElement = appNode;

  const shell = mountShell(appRoot, {
    homeHref: '../../index.html',
    onLocaleChange: () => paint(),
  });

  function paint(): void {
    paintVisualizer(shellMain(appRoot), shell.getLocale());
  }

  paint();
}
