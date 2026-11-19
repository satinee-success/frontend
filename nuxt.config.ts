// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['jwt-decode', '@vue/devtools-core'] }
  },
  runtimeConfig: {
    public: { apiBase: 'http://localhost:4000' }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})