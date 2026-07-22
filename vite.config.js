/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
  plugins: [
    react(),
    visualizer({ open: false, gzipSize: true }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Koperasi SenyumMu - Portal Koperasi Sekolah',
        short_name: 'Koperasi SenyumMu',
        description: 'Aplikasi Kepesantrenan Muhammadiyah Boarding School Tanggul.',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024 // 6MB to cache jsPDF, html2canvas, xlsx, jszip
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hooks/students': path.resolve(__dirname, './src/features/students/hooks'),
      '@hooks/enrollment': path.resolve(__dirname, './src/features/enrollment/hooks'),
      '@hooks/dorms': path.resolve(__dirname, './src/features/dorms/hooks'),
      '@hooks': path.resolve(__dirname, './src/shared/hooks'),
      '@utils/dorms': path.resolve(__dirname, './src/features/dorms/utils'),
      '@utils/enrollment': path.resolve(__dirname, './src/features/enrollment/utils'),
      '@utils/students': path.resolve(__dirname, './src/features/students/utils'),
      '@utils': path.resolve(__dirname, './src/shared/utils'),
      '@context': path.resolve(__dirname, './src/core/context'),
      '@lib': path.resolve(__dirname, './src/core/lib'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@features': path.resolve(__dirname, './src/features'),
      '@core': path.resolve(__dirname, './src/core'),
      '@shared': path.resolve(__dirname, './src/shared'),
    }
  },
  server: {
    host: true,       // expose ke jaringan lokal
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  }
})
