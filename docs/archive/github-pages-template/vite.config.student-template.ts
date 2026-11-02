// vite.config.ts — à inclure dans le template étudiant
// Gère le base URL dynamique pour GitHub Pages

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
    ],

    // Base URL : '/' en dev, '/<repo-name>/' en production (GitHub Pages)
    // La GitHub Action injecte VITE_BASE_URL automatiquement
    base: env.VITE_BASE_URL ?? '/',

    resolve: {
      alias: {
        '@': '/src',
      },
    },
  }
})
