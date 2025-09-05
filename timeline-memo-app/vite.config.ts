import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  
  // GitHub Pages用のベースパス設定
  // ユーザーサイト（username.github.io）の場合はルートパス
  base: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES 
    ? '/' 
    : '/',
  
  // バンドル最適化設定
  build: {
    // GitHub Pages用：ルートレベルに出力
    outDir: '../dist',
    emptyOutDir: true,
    
    // チャンクサイズの警告しきい値を調整
    chunkSizeWarningLimit: 1000,
    
    // ソースマップの生成（本番環境では無効化）
    sourcemap: mode === 'development',
    
    // 最小化設定
    minify: mode === 'production' ? 'terser' : false,
    
    // ロールアップ設定でコード分割を最適化
    rollupOptions: {
      output: {
        // チャンク分割戦略
        manualChunks: {
          // React関連を別チャンクに分離
          'react-vendor': ['react', 'react-dom'],
          // Markdown関連を別チャンクに分離
          'markdown-vendor': ['react-markdown'],
          // ユーティリティライブラリを別チャンクに分離
          'utils-vendor': ['uuid'],
        },
        
        // チャンクファイル名の設定
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^/.]+$/, '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        
        // アセットファイル名の設定
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `img/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext || '')) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
  
  // 開発サーバー設定
  server: {
    // HMRの最適化
    hmr: {
      overlay: true,
    },
    
    // セキュリティヘッダーの設定
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  
  // 依存関係の事前バンドル最適化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-markdown',
      'uuid'
    ],
    // 大きなライブラリを事前バンドルから除外
    exclude: [],
  },
  
  // バンドル分析モード
  ...(mode === 'analyze' && {
    build: {
      rollupOptions: {
        plugins: [
          // バンドル分析用のプラグインを追加する場合はここに
        ],
      },
    },
  }),
}))
