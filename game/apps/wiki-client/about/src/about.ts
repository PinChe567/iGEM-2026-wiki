import '@suite/ui/tokens.css';
import '@suite/ui/shell.css';
import '@suite/ui/components.css';
import { mountShell, shellMain } from '../../src/shell/mount';
import { legalDialogMarkup, wireLegalDialog } from '../../src/legal/content';
import {
  loadSuiteExplorer,
  markScienceCard,
  saveSuiteExplorer,
} from '../../src/progress/explorer';

const appNode = document.querySelector<HTMLElement>('#app');
if (!appNode) throw new Error('#app missing');
const app = appNode;

const shell = mountShell(app, {
  homeHref: '../index.html',
  onLocaleChange: () => paint(),
});

function paint(): void {
  const copy = shell.getCopy();
  document.title = copy.legal.title;
  const main = shellMain(app);
  main.innerHTML = `
    <section class="hub-intro">
      <div class="eyebrow"><span></span> SUITE</div>
      <h1>${copy.legal.title}</h1>
    </section>
    <div class="legal-page" id="legalRoot" style="max-width:40rem;margin-bottom:3rem">
      ${legalDialogMarkup(copy, shell.getLocale())}
    </div>
  `;
  const root = main.querySelector('#legalRoot');
  if (root) {
    wireLegalDialog(root as unknown as HTMLDialogElement);
  }
  saveSuiteExplorer(markScienceCard(loadSuiteExplorer(), 'suite'));
}

paint();
