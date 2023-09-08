import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~bootstrap': '/node_modules/bootstrap',
      '~bootstrapIcons': '/node_modules/bootstrap-icons',
      '@icon': '/node_modules/bootstrap-icons/icons',
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
    watch: {
      clearScreen: true,
      exclude: ['public/*']
    }
  },
  plugins: [vue()],
})
