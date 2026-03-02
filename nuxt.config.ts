// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@pinia/nuxt', '@nuxtjs/mdc'],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-07-15',

  runtimeConfig: {
    // Server-only (private)
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
  },

  mdc: {
    headings: {
      anchorLinks: false,
    },
    highlight: {
      shikiEngine: 'javascript',
    },
  },

  ui: {
    fonts: false,
    colorMode: true,
  },

  imports: {
    dirs: ['stores'],
  },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },

  experimental: {
    viewTransition: true,
  },

  eslint: {
    config: {
      // Let Prettier handle all formatting
      stylistic: false,
    },
  },
});
