// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
  ],

  // Nuxt UI / Tailwind
  ui: {
    global: true,
  },

  // Supabase config (valeurs via .env)
  supabase: {
    redirect: false, // pas d'auth redirect automatique
  },

  // Variables d'environnement côté client
  runtimeConfig: {
    // Clés privées (serveur uniquement)
    githubToken: process.env.GITHUB_TOKEN,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    // Clés publiques (exposées au client)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      githubOrg: process.env.GITHUB_ORG ?? '', // ex: "divtec-cejef"
    }
  },

  // Typescript strict
  typescript: {
    strict: true,
  },

  // App metadata
  app: {
    head: {
      title: 'VuGrade — M294',
      meta: [
        { name: 'description', content: 'Outil de suivi et notation des projets Vue.js — Module 294' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap'
        }
      ]
    }
  },

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  }
})
