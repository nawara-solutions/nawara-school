import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri convention: fixed port, no auto-fallback, so `tauri dev` always
// finds the frontend where tauri.conf.json's devUrl expects it.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 1420,
    strictPort: true,
  },
});
