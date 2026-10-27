import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const devServiceWorkerPlugin = () => ({
  name: 'dev-sw-kill',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/sw.js') {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-store');
        res.end(`
          self.addEventListener('install', () => self.skipWaiting());
          self.addEventListener('activate', (event) => {
            event.waitUntil(
              self.registration.unregister().then(() => self.clients.matchAll()).then(clients => {
                clients.forEach(c => c.navigate(c.url));
              })
            );
          });
        `);
        return;
      }
      next();
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), devServiceWorkerPlugin()],
  build: {
    chunkSizeWarningLimit: 1200
  }
})