import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('..', import.meta.url)), '');
  const target = `http://127.0.0.1:${env.PORT || 3001}`;
  return {
    plugins: [react()],
    server: {
      host: env.WEB_HOST || '127.0.0.1',
      port: Number(env.WEB_PORT || 5173),
      strictPort: true,
      proxy: {
        '/api': { target },
        '/socket.io': { target, ws: true },
      },
    },
  };
});
