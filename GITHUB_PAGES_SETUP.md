# 📄 GitHub Pagesデプロイメント手順

このドキュメントでは、タイムラインメモアプリをGitHub Pagesで公開する具体的な手順を説明します。

## 🚀 ステップ1: GitHubリポジトリの作成

### 1.1 GitHubでリポジトリを作成

1. [GitHub](https://github.com)にログイン
2. 右上の「+」→「New repository」をクリック
3. リポジトリ設定：
   - **Repository name**: `timeline-memo-app`（または任意の名前）
   - **Description**: `気軽にメモや感情を記録できるタイムラインアプリ`
   - **Public** を選択（GitHub Pagesは無料プランではPublicリポジトリのみ）
   - **Add a README file** はチェックしない（既存プロジェクトのため）

### 1.2 ローカルリポジトリをGitHubにプッシュ

```bash
# 現在のディレクトリで実行
git add .
git commit -m "初回コミット: タイムラインメモアプリの実装完了"

# GitHubリポジトリのURLを設定（YOUR_USERNAMEを実際のユーザー名に変更）
git remote add origin https://github.com/YOUR_USERNAME/timeline-memo.git

# mainブランチにプッシュ
git branch -M main
git push -u origin main
```

## 🔧 ステップ2: GitHub Pagesの設定

### 2.1 リポジトリ設定でPages機能を有効化

1. GitHubリポジトリページで「Settings」タブをクリック
2. 左サイドバーの「Pages」をクリック
3. Source設定：
   - **Source**: `GitHub Actions` を選択
   - これにより、`.github/workflows/deploy.yml`が自動的に使用されます

### 2.2 Actions権限の確認

1. 「Settings」→「Actions」→「General」
2. 「Workflow permissions」で以下を確認：
   - ✅ **Read and write permissions** が選択されている
   - ✅ **Allow GitHub Actions to create and approve pull requests** がチェックされている

## 📦 ステップ3: デプロイメントの実行

### 3.1 自動デプロイメント

mainブランチにプッシュすると、GitHub Actionsが自動的に実行されます：

```bash
# 何か変更を加えた後
git add .
git commit -m "機能追加: XXX"
git push origin main
```

### 3.2 デプロイメント状況の確認

1. GitHubリポジトリの「Actions」タブで進行状況を確認
2. 緑のチェックマークが表示されればデプロイ成功
3. 「Settings」→「Pages」でサイトURLを確認

## 🌐 ステップ4: アクセス方法

### 4.1 公開URL

デプロイが完了すると、以下のURLでアクセス可能になります：

```
https://YOUR_USERNAME.github.io/timeline-memo-app/
```

### 4.2 カスタムドメイン（オプション）

独自ドメインを使用したい場合：

1. 「Settings」→「Pages」→「Custom domain」
2. ドメイン名を入力（例：`timeline-memo.example.com`）
3. DNSレコードを設定：
   ```
   CNAME timeline-memo YOUR_USERNAME.github.io
   ```

## 🔍 ステップ5: 動作確認

### 5.1 基本機能の確認

デプロイ後、以下の機能が正常に動作することを確認：

- ✅ アプリの読み込み
- ✅ 新規投稿の作成
- ✅ 投稿の表示
- ✅ 投稿の編集・削除
- ✅ タイムライン表示
- ✅ レスポンシブデザイン

### 5.2 PWA機能の確認

- ✅ Service Workerの登録
- ✅ オフライン動作
- ✅ アプリインストール（モバイル/デスクトップ）
- ✅ プッシュ通知（対応ブラウザ）

## 🛠️ トラブルシューティング

### よくある問題と解決方法

#### 1. 404エラーが発生する

**原因**: ベースパスの設定が正しくない

**解決方法**:
```bash
# vite.config.tsのbase設定を確認
base: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES 
  ? '/リポジトリ名/' 
  : '/',
```

#### 2. GitHub Actionsが失敗する

**原因**: 権限設定やワークフロー設定の問題

**解決方法**:
1. 「Settings」→「Actions」→「General」で権限を確認
2. ワークフローファイルの構文をチェック
3. ログを確認してエラー内容を特定

#### 3. アセットが読み込まれない

**原因**: 相対パスの問題

**解決方法**:
```bash
# ビルド後のdistディレクトリを確認
cd timeline-memo-app
npm run build:github-pages
ls -la dist/
```

#### 4. Service Workerが動作しない

**原因**: HTTPSが必要

**解決方法**:
- GitHub Pagesは自動的にHTTPSを提供
- カスタムドメインの場合はSSL証明書を設定

## 📊 パフォーマンス最適化

### Lighthouseテスト

デプロイ後のパフォーマンスを確認：

```bash
# ローカルでテスト
npm install -g lighthouse
lighthouse https://YOUR_USERNAME.github.io/timeline-memo-app/ --output html
```

### 推奨スコア目標

- **Performance**: 90以上
- **Accessibility**: 95以上
- **Best Practices**: 95以上
- **SEO**: 90以上
- **PWA**: 90以上

## 🔄 継続的な更新

### 自動デプロイメント

1. ローカルで開発・テスト
2. mainブランチにプッシュ
3. GitHub Actionsが自動実行
4. 数分後に本番サイトに反映

### 手動デプロイメント

緊急時やテスト用：

```bash
# ローカルビルド
cd timeline-memo-app
npm run build:github-pages

# 手動でgh-pagesブランチにデプロイ（gh-pagesパッケージ使用時）
npx gh-pages -d dist
```

## 📞 サポート情報

### 参考リンク

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

### よくある質問

**Q: プライベートリポジトリでGitHub Pagesを使えますか？**
A: GitHub Pro以上のプランが必要です。無料プランではパブリックリポジトリのみ。

**Q: デプロイにどのくらい時間がかかりますか？**
A: 通常2-5分程度。初回は少し長くかかる場合があります。

**Q: 複数の環境（staging/production）を作れますか？**
A: ブランチベースでの環境分離が可能です。詳細は高度な設定を参照。

---

🎉 **これで GitHub Pages でのデプロイメントが完了です！**

何か問題が発生した場合は、GitHub ActionsのログやIssuesで確認してください。