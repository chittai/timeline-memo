import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright設定ファイル
 * E2Eテストとブラウザ間互換性テストの設定
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './e2e',
  
  // 並列実行の設定
  fullyParallel: true,
  
  // CI環境での設定
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // レポート設定
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  // 共通設定
  use: {
    // ベースURL
    baseURL: 'http://localhost:4173',
    
    // トレース設定
    trace: 'on-first-retry',
    
    // スクリーンショット設定
    screenshot: 'only-on-failure',
    
    // ビデオ設定
    video: 'retain-on-failure',
  },

  // プロジェクト設定（ブラウザ間互換性テスト）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // モバイルデバイステスト
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // タブレットテスト
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // 開発サーバー設定
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});