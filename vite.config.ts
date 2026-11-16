import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

// 版本标记：只写进网页源码的 <meta name="app-build">，页面上不显示；用于核对线上是哪一次提交。
// 优先用部署时传入的 APP_COMMIT，其次本机 Git；都没有就只写构建日期。
const buildCommit = (() => {
  if (process.env.APP_COMMIT) return process.env.APP_COMMIT.slice(0, 7);
  try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
})();
const buildLabel = [buildCommit, new Date().toLocaleDateString('sv-SE')].filter(Boolean).join(' · ');

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  root: process.cwd(),
  resolve: { tsconfigPaths: true },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: env.API_PROXY_TARGET || `http://127.0.0.1:${env.PORT || 8788}`,
        changeOrigin: false,
      },
    },
  },
  build: {
    sourcemap: false,
  },
  plugins: [
    react({
      babel: mode === 'development' ? {
        plugins: [
          'react-dev-locator',
        ],
      } : undefined,
    }),
    { name: 'app-build-meta', transformIndexHtml: (html: string) => html.replace('</head>', `    <meta name="app-build" content="${buildLabel}" />\n  </head>`) },
  ],
  };
})
