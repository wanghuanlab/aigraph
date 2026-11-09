import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

function examAssets(): Plugin {
  const root = path.resolve(__dirname, '../exam-assets');
  return {
    name: 'exam-assets',
    configureServer(server) {
      server.middlewares.use('/exam-assets', (req, res, next) => {
        const raw = decodeURIComponent((req.url || '/').split('?')[0]);
        const file = path.resolve(root, `.${raw}`);
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'application/octet-stream');
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), examAssets()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
});
