import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Only apply electron plugins in non-test mode
    ...(mode !== 'test' ? [
      electron([
        {
          // Main process entry file
          entry: 'electron/main.ts',
          onstart(args) {
            // Start Electron after build
            args.startup()
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              lib: {
                entry: 'electron/main.ts',
                formats: ['cjs'],
                fileName: () => 'main.js',
              },
              rollupOptions: {
                external: [
                  'electron',
                  'path',
                  'fs',
                  'fs/promises',
                  /^node:.*/
                ]
              }
            },
          },
        },
        {
          // Preload script
          entry: 'electron/preload.ts',
          onstart(args) {
            // Reload when preload changes
            args.reload()
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              lib: {
                entry: 'electron/preload.ts',
                formats: ['cjs'],
                fileName: () => 'preload.js',
              },
              rollupOptions: {
                external: ['electron']
              }
            },
          },
        },
      ]),
      renderer(),
    ] : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: {
      junit: './test-results/junit.xml'
    }
  },
}))
