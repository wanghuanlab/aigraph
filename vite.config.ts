import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function examAssetsDevPlugin(): Plugin {
  const root = path.resolve(__dirname, 'exam-assets');
  return {
    name: 'exam-assets-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith('/exam-assets/')) return next();
        let relative = '';
        try { relative = decodeURIComponent(url.slice('/exam-assets/'.length)); } catch { res.statusCode = 400; res.end(); return; }
        if (!relative || relative.includes('\0') || relative.split('/').includes('..')) {
          res.statusCode = 400;
          res.end();
          return;
        }
        const file = path.resolve(root, relative);
        if (file !== root && !file.startsWith(root + path.sep)) {
          res.statusCode = 400;
          res.end();
          return;
        }
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
          res.statusCode = 404;
          res.end();
          return;
        }
        const type = file.endsWith('.zip') ? 'application/zip'
          : file.endsWith('.json') ? 'application/json'
          : file.endsWith('.csv') ? 'text/csv; charset=utf-8'
          : file.endsWith('.txt') ? 'text/plain; charset=utf-8'
          : 'application/octet-stream';
        res.setHeader('Content-Type', type);
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), examAssetsDevPlugin()],
  server: {
    port: 3000,
    open: false,
  },
});
