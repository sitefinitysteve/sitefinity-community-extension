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
        devtools: resolve(__dirname, 'devtools.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          // Don't hash image files - keep original names
          if (assetInfo.name && /\.(png|jpe?g|gif|svg|ico)$/.test(assetInfo.name)) {
            return '[name].[ext]'
          }
          // Hash other assets like CSS
          return '[name].[hash].[ext]'
        }
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