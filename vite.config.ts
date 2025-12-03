import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
    },
    build: {
      // Increases the warning limit to 1000kb (default is 500kb)
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Manually separate large libraries into their own chunks
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['@supabase/supabase-js', '@google/genai', 'lucide-react', 'recharts']
          }
        }
      }
    }
  };
});