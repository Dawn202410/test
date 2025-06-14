import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'classic',
    jsxImportSource: 'react',
    babel: {
      plugins: ['@babel/plugin-transform-react-jsx']
    }
  }), tsconfigPaths()],
  server: {
    proxy: {
      '/process/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/process\/api/, '/api')
      }
    }
  }
});