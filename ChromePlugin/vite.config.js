import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vitePluginHotBuild from './config/plugin/vite-plugin-hot-build';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~bootstrap': '/node_modules/bootstrap',
      '@cpt': '/src/components',
      '@js': '/src/js',
    }
  },
  plugins: [vue(), vitePluginHotBuild()],
})
