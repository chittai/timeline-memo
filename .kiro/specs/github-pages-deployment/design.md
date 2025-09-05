# 設計書

## 概要

タイムラインメモアプリをGitHub Pagesのユーザーサイト（`chittai.github.io`）として公開するための技術設計です。現在のサブディレクトリ構造（`timeline-memo-app/`）を維持しながら、GitHub Pagesの要求に合わせてビルドとデプロイメントプロセスを最適化します。

## アーキテクチャ

### 現在の問題点

1. **ファイル配置の不一致**
   - GitHub Pages: ルートディレクトリの `index.html` を期待
   - 現在の構造: `timeline-memo-app/index.html` に配置

2. **デプロイメントパスの問題**
   - GitHub Actions: `timeline-memo-app/dist/` をアップロード
   - GitHub Pages: ルートディレクトリでファイルを探索

3. **ベースパス設定の不整合**
   - ユーザーサイト形式では `/` がベースパス
   - 現在の設定は適切だが、ファイル配置が問題

### 解決アプローチ

#### アプローチ1: ルートレベルデプロイメント（推奨）
```
リポジトリ構造:
├── timeline-memo-app/     # 開発用ディレクトリ
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── index.html            # GitHub Pages用（ビルド時生成）
├── assets/               # GitHub Pages用（ビルド時生成）
└── .github/workflows/
```

#### アプローチ2: サブディレクトリ維持
```
リポジトリ構造:
├── timeline-memo-app/     # 開発・デプロイ両用
└── .github/workflows/     # ルートレベルワークフロー
```

## コンポーネントと設計

### 1. ビルドプロセスの再設計

#### 1.1 出力ディレクトリの変更
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    outDir: '../dist',  // ルートレベルに出力
    emptyOutDir: true,
  }
})
```

#### 1.2 GitHub Actionsワークフローの調整
```yaml
# .github/workflows/deploy.yml
- name: Build application
  run: |
    cd timeline-memo-app
    npm run build:github-pages
    
- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: ./dist  # ルートレベルのdistディレクトリ
```

### 2. ファイル構造管理

#### 2.1 開発時の構造維持
- `timeline-memo-app/` ディレクトリで開発継続
- 既存の開発ワークフローに影響なし
- パッケージ管理とビルド設定はサブディレクトリ内で完結

#### 2.2 デプロイ時の構造変換
- ビルド時にルートレベルに出力
- GitHub Pagesの要求に合わせた配置
- 静的ファイルの正しいパス解決

### 3. パス解決とルーティング

#### 3.1 ベースパス設定
```typescript
// ユーザーサイト用設定
base: '/'  // chittai.github.io のルートパス
```

#### 3.2 アセットパス管理
```typescript
// 相対パス解決の最適化
build: {
  rollupOptions: {
    output: {
      assetFileNames: 'assets/[name]-[hash][extname]',
      chunkFileNames: 'js/[name]-[hash].js',
    }
  }
}
```

## データモデル

### デプロイメント設定モデル
```typescript
interface DeploymentConfig {
  sourceDir: string;        // 'timeline-memo-app'
  outputDir: string;        // 'dist' (ルートレベル)
  baseUrl: string;          // '/'
  buildCommand: string;     // 'npm run build:github-pages'
  artifactPath: string;     // './dist'
}
```

### ビルド成果物モデル
```typescript
interface BuildArtifacts {
  indexHtml: string;        // ルートレベルのindex.html
  assets: string[];         // CSS, JS, 画像ファイル
  serviceWorker?: string;   // PWA用Service Worker
  manifest?: string;        // PWA用マニフェスト
}
```

## エラーハンドリング

### 1. ビルドエラー対応
- TypeScriptコンパイルエラーの検出と報告
- 依存関係の不整合チェック
- アセットファイルの欠損検証

### 2. デプロイメントエラー対応
- GitHub Actions権限エラーの検出
- ファイルアップロード失敗の処理
- Pages設定の不整合検出

### 3. ランタイムエラー対応
- 404エラーの防止（正しいファイル配置）
- アセット読み込み失敗の対処
- Service Worker登録エラーの処理

## テスト戦略

### 1. ビルドテスト
```bash
# ローカルビルドテスト
cd timeline-memo-app
npm run build:github-pages
ls -la ../dist/  # ルートレベル出力確認
```

### 2. デプロイメントテスト
```bash
# GitHub Actions実行確認
git push origin main
# Actions タブで進行状況監視
```

### 3. 動作テスト
```bash
# デプロイ後の動作確認
curl -I https://chittai.github.io/
# レスポンスヘッダーとステータスコード確認
```

### 4. パフォーマンステスト
```bash
# Lighthouse監査
lighthouse https://chittai.github.io/ --output html
```

## 実装手順

### フェーズ1: ビルド設定の調整
1. `vite.config.ts` の出力ディレクトリ変更
2. パッケージスクリプトの確認
3. ローカルビルドテスト

### フェーズ2: GitHub Actions調整
1. ワークフローファイルのパス修正
2. アーティファクトアップロード設定変更
3. 権限設定の確認

### フェーズ3: デプロイメントテスト
1. 変更のコミット・プッシュ
2. GitHub Actions実行監視
3. デプロイ結果の確認

### フェーズ4: 動作検証
1. サイトアクセステスト
2. 機能動作確認
3. パフォーマンス測定

## セキュリティ考慮事項

### 1. GitHub Actions権限
- 最小権限の原則に従った設定
- トークンの適切な管理
- ワークフロー実行権限の制限

### 2. 静的ファイル配信
- HTTPS強制（GitHub Pages標準）
- セキュリティヘッダーの設定
- XSS対策の実装

### 3. 依存関係管理
- 脆弱性スキャンの実行
- 定期的な依存関係更新
- セキュリティパッチの適用

## パフォーマンス最適化

### 1. バンドル最適化
- コード分割の実装
- 不要なライブラリの除去
- 圧縮とminificationの適用

### 2. 配信最適化
- GitHub Pages CDNの活用
- キャッシュ戦略の実装
- 画像最適化の適用

### 3. ランタイム最適化
- 遅延読み込みの実装
- Service Workerによるキャッシュ
- プリロード戦略の適用