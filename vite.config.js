// Konfiguracja Vite z obsługą Electrona
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Konfiguracja serwera deweloperskiego
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Umożliwia dostęp z sieci lokalnej
  },
  
  // Konfiguracja buildu
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Wyłącz sourcemapy w produkcji dla bezpieczeństwa
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Usuń console.log w produkcji
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          phaser: ['phaser'],
          supabase: ['@supabase/supabase-js'],
          electron: ['electron'],
        },
      },
    },
  },
  
  // Rozwiązanie ścieżek
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@game': resolve(__dirname, 'src/game'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@store': resolve(__dirname, 'src/store'),
      '@assets': resolve(__dirname, 'src/game/config/assets.js'),
    },
  },
  
  // Optymalizacje
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'phaser',
      'zustand',
      '@supabase/supabase-js',
    ],
  },
  
  // Definicje globalne
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  
  // Konfiguracja dla Electrona
  base: './', // Ważne dla Electrona w trybie produkcyjnym
  
  // CSS preprocessing
  css: {
    postcss: './postcss.config.js',
  },
  
  // Environment variables
  envPrefix: 'VITE_',
});
