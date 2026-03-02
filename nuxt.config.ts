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
    // 不打包含原生二进制的包，让 Node.js 在运行时从 node_modules 直接解析
    externals: {
      external: ['@libsql/client', 'libsql'],
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
