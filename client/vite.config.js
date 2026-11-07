import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Lets the client import the same service list the server validates against.
    alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) },
  },
  server: {
    port: 5173,
    // In development, send /api calls to the Express server.
    proxy: { '/api': 'http://localhost:5000' },
    fs: { allow: ['..'] },
  },
});
