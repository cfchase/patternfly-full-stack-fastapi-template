import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    svgr({
      include: '**/*.svg',
      exclude: [
        '**/node_modules/@patternfly/**/assets/fonts/**',
        '**/node_modules/@patternfly/**/assets/pficon/**',
        '**/bgimages/**'
      ],
      svgrOptions: {
        exportType: 'default',
      },
    }),
  ],
  server: {
    port: 8080,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src/app'),
      '@api': path.resolve(__dirname, './src/api'),
      '@components': path.resolve(__dirname, './src/components'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './node_modules/@patternfly/react-core/dist/styles/assets'),
    },
  },
  assetsInclude: ['**/*.svg'],
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['node_modules'],
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**', // Exclude E2E tests (use Playwright separately)
      '**/.{idea,git,cache,output,temp}/**',
    ],
  },
})