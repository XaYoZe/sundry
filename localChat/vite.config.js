import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "SERVER_ORIGIN": JSON.stringify('http://127.0.0.1:8080/api/proxy')
  },
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js',
      '@pinia': '/views/pinia',
      '@common': '/common/',
      '@cpt': '/views/components',
      '@js': '/views/js',
      '@style': '/views/assets/style',
      '@image': '/views/assets/image',
    }
  },
  publicDir: '/views/public',
  server: {
    watch: {
      clearScreen: true,
      exclude: ['/views/public/*']
    }
  },
  build: {
    sourcemap: "inline",
    watch: {
      clearScreen: true,
      exclude: ['/views/public/*']
    }
  },
  plugins: [vue()],
})
