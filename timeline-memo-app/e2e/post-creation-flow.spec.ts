import { test, expect } from '@playwright/test';

/**
 * 投稿作成から表示までのフローテスト
 * 要件: 1.1, 1.2, 1.3, 2.1, 2.2の統合確認
 */
test.describe('投稿作成から表示までのフロー', () => {
  test.beforeEach(async ({ page }) => {
    // アプリケーションにアクセス
    await page.goto('/');
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    
    // IndexedDBをクリア（テスト間の独立性を保つ）
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('TimelineMemoApp');
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve();
      });
    });
    
    // ページをリロードしてクリーンな状態にする
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('新規投稿の作成と表示', async ({ page }) => {
    const testContent = 'これはテスト投稿です。\n\n**太字テスト**\n\n- リスト項目1\n- リスト項目2';
    
    // 投稿フォームが表示されていることを確認
    const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
    await expect(textarea).toBeVisible();
    
    // 投稿内容を入力
    await textarea.fill(testContent);
    
    // 投稿ボタンをクリック
    const submitButton = page.locator('button:has-text("投稿")');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    
    // 投稿が成功したことを確認（フォームがクリアされる）
    await expect(textarea).toHaveValue('');
    
    // 投稿がタイムラインに表示されることを確認
    const postItem = page.locator('[data-testid="post-item"]').first();
    await expect(postItem).toBeVisible();
    
    // 投稿内容が正しく表示されることを確認
    await expect(postItem.locator('text=これはテスト投稿です。')).toBeVisible();
    
    // Markdownが正しくレンダリングされることを確認
    await expect(postItem.locator('strong:has-text("太字テスト")')).toBeVisible();
    await expect(postItem.locator('li:has-text("リスト項目1")')).toBeVisible();
    
    // 時間軸にマーカーが表示されることを確認
    const timelineMarker = page.locator('[data-testid="timeline-marker"]').first();
    await expect(timelineMarker).toBeVisible();
  });

  test('複数投稿の作成と時系列表示', async ({ page }) => {
    const posts = [
      '最初の投稿です',
      '2番目の投稿です',
      '3番目の投稿です'
    ];
    
    // 複数の投稿を作成
    for (const content of posts) {
      const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
      await textarea.fill(content);
      
      const submitButton = page.locator('button:has-text("投稿")');
      await submitButton.click();
      
      // 投稿が完了するまで少し待機
      await page.waitForTimeout(100);
    }
    
    // 投稿が新しい順（降順）で表示されることを確認
    const postItems = page.locator('[data-testid="post-item"]');
    await expect(postItems).toHaveCount(3);
    
    // 最新の投稿が最上部に表示されることを確認
    await expect(postItems.first().locator('text=3番目の投稿です')).toBeVisible();
    await expect(postItems.nth(1).locator('text=2番目の投稿です')).toBeVisible();
    await expect(postItems.nth(2).locator('text=最初の投稿です')).toBeVisible();
    
    // 時間軸に複数のマーカーが表示されることを確認
    const timelineMarkers = page.locator('[data-testid="timeline-marker"]');
    await expect(timelineMarkers).toHaveCount(3);
  });

  test('空の投稿の拒否', async ({ page }) => {
    // 空の投稿を試行
    const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
    await textarea.fill('');
    
    const submitButton = page.locator('button:has-text("投稿")');
    
    // 投稿ボタンが無効化されていることを確認
    await expect(submitButton).toBeDisabled();
    
    // 空白文字のみの投稿も拒否されることを確認
    await textarea.fill('   \n\n   ');
    await expect(submitButton).toBeDisabled();
  });

  test('Markdownプレビュー機能', async ({ page }) => {
    const markdownContent = '# 見出し1\n\n## 見出し2\n\n**太字** と *斜体*\n\n```javascript\nconsole.log("コード");\n```\n\n> 引用文';
    
    // Markdown内容を入力
    const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
    await textarea.fill(markdownContent);
    
    // プレビューボタンをクリック
    const previewButton = page.locator('button:has-text("プレビュー")');
    await previewButton.click();
    
    // プレビューが表示されることを確認
    const previewArea = page.locator('[data-testid="markdown-preview"]');
    await expect(previewArea).toBeVisible();
    
    // Markdownが正しくレンダリングされることを確認
    await expect(previewArea.locator('h1:has-text("見出し1")')).toBeVisible();
    await expect(previewArea.locator('h2:has-text("見出し2")')).toBeVisible();
    await expect(previewArea.locator('strong:has-text("太字")')).toBeVisible();
    await expect(previewArea.locator('em:has-text("斜体")')).toBeVisible();
    await expect(previewArea.locator('code:has-text("console.log")')).toBeVisible();
    await expect(previewArea.locator('blockquote:has-text("引用文")')).toBeVisible();
    
    // 編集モードに戻る
    const editButton = page.locator('button:has-text("編集")');
    await editButton.click();
    
    // テキストエリアが再表示されることを確認
    await expect(textarea).toBeVisible();
    await expect(previewArea).not.toBeVisible();
  });

  test('データ永続化の確認', async ({ page }) => {
    const testContent = 'データ永続化テスト用の投稿';
    
    // 投稿を作成
    const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
    await textarea.fill(testContent);
    
    const submitButton = page.locator('button:has-text("投稿")');
    await submitButton.click();
    
    // 投稿が表示されることを確認
    const postItem = page.locator('[data-testid="post-item"]').first();
    await expect(postItem.locator(`text=${testContent}`)).toBeVisible();
    
    // ページをリロード
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // リロード後も投稿が表示されることを確認（データ永続化）
    const persistedPost = page.locator('[data-testid="post-item"]').first();
    await expect(persistedPost.locator(`text=${testContent}`)).toBeVisible();
    
    // 時間軸マーカーも復元されることを確認
    const timelineMarker = page.locator('[data-testid="timeline-marker"]').first();
    await expect(timelineMarker).toBeVisible();
  });
});