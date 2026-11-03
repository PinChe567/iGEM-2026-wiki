import '@suite/ui/tokens.css';
import '@suite/ui/shell.css';
import '@suite/ui/components.css';
import './visualizer.css';
import { mountShell, shellMain } from '../../../src/shell/mount';
import { paintVisualizer } from './visualizer';

if (!import.meta.env.DEV) {
  const appRoot = document.querySelector('#app');
  if (appRoot instanceof HTMLElement) {
    const shell = mountShell(appRoot, { homeHref: '../../index.html', showSuiteControls: false, onLocaleChange: () => paintNotice() });
    function paintNotice(): void {
      const zh = shell.getLocale() === 'zh-Hant';
      document.title = zh ? '暫不提供' : 'Not available';
      shellMain(appRoot as HTMLElement).innerHTML = `<p>${zh ? '氣味頻譜視覺化工具僅供開發模式使用。' : 'Scent Spectrum visualizer is dev-only.'}</p><p><a href="../../index.html">${zh ? '返回遊戲首頁' : 'Back to hub'}</a></p>`;
    }
    paintNotice();
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
