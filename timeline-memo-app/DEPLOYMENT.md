# デプロイメントガイド

このドキュメントでは、タイムラインメモアプリのデプロイメント方法について説明します。

## 📋 目次

- [事前準備](#事前準備)
- [Vercelへのデプロイ](#vercelへのデプロイ)
- [GitHub Pagesへのデプロイ](#github-pagesへのデプロイ)
- [PWA機能の確認](#pwa機能の確認)
- [パフォーマンス最適化](#パフォーマンス最適化)
- [トラブルシューティング](#トラブルシューティング)

## 🚀 事前準備

### 1. 依存関係のインストール

```bash
cd timeline-memo-app
npm install
```

### 2. ビルドテスト

```bash
# 本番ビルドの実行
npm run build

# パフォーマンステストの実行
npm run performance:test

# プレビューサーバーでの動作確認
npm run preview
```

### 3. テストの実行

```bash
# 全テストの実行
npm run test:all
```

## 🌐 Vercelへのデプロイ

### 方法1: Vercel CLIを使用

1. Vercel CLIのインストール
```bash
npm install -g vercel
```

2. Vercelにログイン
```bash
vercel login
```

3. プロジェクトのデプロイ
```bash
# プレビューデプロイ
npm run deploy:preview

# 本番デプロイ
npm run deploy:vercel
```

### 方法2: Vercel Webダッシュボード

1. [Vercel](https://vercel.com)にアクセスしてログイン
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. 以下の設定を行う：
   - **Framework Preset**: Vite
   - **Root Directory**: `timeline-memo-app`
   - **Build Command**: `npm run build:production`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

```
NODE_ENV=production
```

## 📄 GitHub Pagesへのデプロイ

### 自動デプロイの設定

1. GitHubリポジトリの設定
   - Settings → Pages
   - Source: GitHub Actions

2. ワークフローファイルの確認
   - `.github/workflows/deploy.yml` が存在することを確認

3. デプロイの実行
   - `main` ブランチにプッシュすると自動的にデプロイされます

### 手動デプロイ

```bash
# GitHub Pages用ビルド
npm run build:github-pages

# distディレクトリの内容をgh-pagesブランチにプッシュ
# (gh-pages パッケージを使用する場合)
npx gh-pages -d dist
```

## 📱 PWA機能の確認

デプロイ後、以下のPWA機能が正常に動作することを確認してください：

### 1. Service Workerの登録

ブラウザの開発者ツールで確認：
- Application → Service Workers
- 登録されたService Workerが表示されること

### 2. マニフェストファイル

- Application → Manifest
- アプリ情報が正しく表示されること

### 3. インストール機能

- デスクトップ: アドレスバーのインストールアイコン
- モバイル: 「ホーム画面に追加」オプション

### 4. オフライン機能

- ネットワークを無効にしてアプリが動作すること
- キャッシュされたリソースが正常に読み込まれること

## ⚡ パフォーマンス最適化

### ビルド最適化の確認

```bash
# バンドルサイズの分析
npm run build:analyze

# パフォーマンステストの実行
npm run performance:build
```

### Lighthouseテスト

```bash
# Lighthouseのインストール
npm install -g lighthouse

# プレビューサーバーの起動
npm run preview &

# Lighthouseテストの実行
npm run performance:lighthouse
```

### 推奨スコア

- **Performance**: 90以上
- **Accessibility**: 95以上
- **Best Practices**: 95以上
- **SEO**: 90以上
- **PWA**: 90以上

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. ビルドエラー

```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# TypeScriptエラーの確認
npm run lint
```

#### 2. Service Workerが登録されない

- HTTPSでアクセスしていることを確認
- ブラウザのキャッシュをクリア
- 開発者ツールでService Workerを手動で削除

#### 3. PWAインストールができない

- マニフェストファイルが正しく配信されていることを確認
- HTTPSでアクセスしていることを確認
- 必要なアイコンファイルが存在することを確認

#### 4. パフォーマンスが悪い

```bash
# バンドルサイズの確認
npm run performance:test

# 不要な依存関係の削除
npm audit
```

### デバッグ用のコマンド

```bash
# 詳細なビルドログ
DEBUG=* npm run build

# プレビューサーバーでのデバッグ
npm run preview -- --debug

# Service Workerのデバッグ
# ブラウザの開発者ツール → Application → Service Workers → Update
```

## 📊 監視とメンテナンス

### 定期的な確認事項

1. **依存関係の更新**
```bash
npm audit
npm update
```

2. **パフォーマンスの監視**
```bash
npm run performance:build
```

3. **セキュリティの確認**
```bash
npm audit --audit-level moderate
```

### アップデート手順

1. 依存関係の更新
2. テストの実行
3. ビルドの確認
4. デプロイ

## 🔗 関連リンク

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. このドキュメントのトラブルシューティング
2. プロジェクトのIssues
3. 各プラットフォームの公式ドキュメント