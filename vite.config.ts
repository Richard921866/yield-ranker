import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import compression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:4000';

  return {
    server: {
      host: true,
      port: 8081,
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
        },
      },
      // Warmup frequently accessed files for faster dev server
      warmup: {
        clientFiles: [
          './src/pages/Index.tsx',
          './src/components/Header.tsx',
          './src/components/ETFTable.tsx',
          './src/components/CEFTable.tsx',
        ],
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      // Gzip compression for production builds
      mode === "production" && compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024, // Only compress files > 1kb
      }),
      // Brotli compression (better compression ratio)
      mode === "production" && compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      // Target modern browsers for smaller bundles
      target: 'esnext',
      // Disable sourcemaps in production for smaller builds
      sourcemap: false,
      // Increase chunk size warning limit (recharts is large)
      chunkSizeWarningLimit: 600,
      // CSS code splitting
      cssCodeSplit: true,
      // Minify with esbuild (faster than terser)
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-select',
              '@radix-ui/react-slot',
            ],
            // Additional chunks for better code splitting
            'vendor-query': ['@tanstack/react-query'],
            'vendor-forms': ['react-hook-form', 'zod', '@hookform/resolvers'],
            'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
    // Optimize deps for faster cold starts
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'recharts',
      ],
    },
    // Both production and development use relative /api paths
    // In development, Vite proxy handles it
    // In production, Vercel rewrites (vercel.json) proxy to Railway backend
    // This prevents privacy browsers (like DuckDuckGo) from blocking cross-origin requests
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(''),
    },
  };
});
