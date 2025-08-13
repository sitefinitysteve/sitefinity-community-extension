import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      input: {
        panel: resolve(__dirname, 'src/main.js'),
        background: resolve(__dirname, 'background.js'),
        content: resolve(__dirname, 'content.js'),
        devtools: resolve(__dirname, 'devtools.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[hash].[ext]'
      },
      external: []
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
    minify: false
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
})