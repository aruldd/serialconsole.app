import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'solo-dev-7c',
      project: 'javascript-react',
      // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
      // and needs the `project:releases` and `org:read` scopes.
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true, // Source map generation must be turned on
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mantine-vendor': ['@mantine/core', '@mantine/hooks', '@mantine/notifications'],
          'intl-vendor': ['react-intl'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})

