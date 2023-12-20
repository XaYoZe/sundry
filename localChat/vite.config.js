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
      '~bootstrap': '/node_modules/bootstrap',
      '~bootstrapIcons': '/node_modules/bootstrap-icons',
      '@icon': '/node_modules/bootstrap-icons/icons',
      '@common': '/common/',
      '@cpt': '/src/components',
      '@js': '/src/js',
    }
  },
  server: {
    watch: {
      clearScreen: true,
      exclude: ['public/*']
    }
  },
  build: {
    sourcemap: "inline",
    watch: {
      clearScreen: true,
      exclude: ['public/*']
    }
  },
  plugins: [vue({
    
  })],
})
