import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['jwt-decode', '@vue/devtools-core'] }
  },
  runtimeConfig: {
    // เปลี่ยนตอนรันจริงได้ด้วย env: NUXT_PUBLIC_API_BASE
    public: { apiBase: 'http://localhost:4000/api' }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
