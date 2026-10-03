import { defineConfig, type Plugin } from 'vite';
import { createReadStream, existsSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wikiRoot = path.dirname(fileURLToPath(import.meta.url));
const educationDocs = path.resolve(wikiRoot, '../../docs/education-games');
const studyProtocol = path.resolve(wikiRoot, '../../docs/education-study-protocol.md');

function isInside(parent: string, file: string): boolean {
  const rel = path.relative(parent, file);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function educationDocsPlugin(): Plugin {
  return {
    name: 'education-docs',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const raw = req.url?.split('?')[0] ?? '';
        if (!raw.startsWith('/education-games')) {
          next();
          return;
        }
        const rel = decodeURIComponent(raw.replace(/^\/education-games\/?/, '')) || 'README.md';
        if (rel === 'education-study-protocol.md' && existsSync(studyProtocol)) {
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
          createReadStream(studyProtocol).pipe(res);
          return;
        }
        const file = path.resolve(educationDocs, rel);
        if (!isInside(educationDocs, file) && file !== educationDocs) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        if (!existsSync(file) || !statSync(file).isFile()) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: 'public',
  plugins: [educationDocsPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        hub: 'index.html',
        about: 'about/index.html',
        education: 'education/index.html',
        pixel: 'games/pixel/index.html',
        labyrinth: 'games/labyrinth/index.html',
        labyrinthValidator: 'games/labyrinth-validator/index.html',
        spectrum: 'games/spectrum/index.html',
        spectrumVisualizer: 'games/spectrum-visualizer/index.html',
      },
    },
  },
  server: {
    port: 5173,
  },
});
