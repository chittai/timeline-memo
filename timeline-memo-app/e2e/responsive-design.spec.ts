import { test, expect } from '@playwright/test';

/**
 * レスポンシブデザインのテスト
 * 要件: 6.1, 6.2, 6.3の統合確認
 */
test.describe('レスポンシブデザイン', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // IndexedDBをクリア
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('TimelineMemoApp');
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve();
      });
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // テスト用の投稿を作成
    const testPosts = ['デスクトップテスト', 'タブレットテスト', 'モバイルテスト'];
    
    for (const content of testPosts) {
      const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
      await textarea.fill(content);
      
      const submitButton = page.locator('button:has-text("投稿")');
      await submitButton.click();
      
      await page.waitForTimeout(100);
    }
  });

  test('デスクトップレイアウト（1024px以上）', async ({ page }) => {
    // デスクトップサイズに設定
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // 左右分割レイアウトが表示されることを確認
    const timelinePanel = page.locator('[data-testid="timeline-panel"]');
    const postListPanel = page.locator('[data-testid="post-list-panel"]');
    
    await expect(timelinePanel).toBeVisible();
    await expect(postListPanel).toBeVisible();
    
    // 左側パネルの幅が適切であることを確認（約300px）
    const timelinePanelBox = await timelinePanel.boundingBox();
    expect(timelinePanelBox?.width).toBeGreaterThan(250);
    expect(timelinePanelBox?.width).toBeLessThan(350);
    
    // 右側パネルが残りの幅を占めることを確認
    const postListPanelBox = await postListPanel.boundingBox();
    expect(postListPanelBox?.width).toBeGreaterThan(800);
    
    // 両パネルが横並びに配置されていることを確認
    expect(timelinePanelBox?.x).toBeLessThan(postListPanelBox?.x || 0);
  });

  test('タブレットレイアウト（768px - 1023px）', async ({ page }) => {
    // タブレットサイズに設定
    await page.setViewportSize({ width: 900, height: 600 });
    
    // 左右分割レイアウトが維持されることを確認
    const timelinePanel = page.locator('[data-testid="timeline-panel"]');
    const postListPanel = page.locator('[data-testid="post-list-panel"]');
    
    await expect(timelinePanel).toBeVisible();
    await expect(postListPanel).toBeVisible();
    
    // 左側パネルの幅が調整されることを確認（約250px）
    const timelinePanelBox = await timelinePanel.boundingBox();
    expect(timelinePanelBox?.width).toBeGreaterThan(200);
    expect(timelinePanelBox?.width).toBeLessThan(300);
    
    // 投稿フォームが適切に表示されることを確認
    const postForm = page.locator('[data-testid="post-form"]');
    await expect(postForm).toBeVisible();
    
    // テキストエリアが適切なサイズであることを確認
    const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
    const textareaBox = await textarea.boundingBox();
    expect(textareaBox?.width).toBeGreaterThan(400);
  });

  test('モバイルレイアウト（767px以下）', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 上下分割レイアウトに変更されることを確認
    const mainLayout = page.locator('[data-testid="main-layout"]');
    await expect(mainLayout).toBeVisible();
    
    // モバイル用のレイアウトクラスが適用されることを確認
    await expect(mainLayout).toHaveClass(/mobile|flex-col/);
    
    // 時間軸パネルが上部に表示されることを確認
    const timelinePanel = page.locator('[data-testid="timeline-panel"]');
    await expect(timelinePanel).toBeVisible();
    
    // 投稿リストパネルが下部に表示されることを確認
    const postListPanel = page.locator('[data-testid="post-list-panel"]');
    await expect(postListPanel).toBeVisible();
    
    // 時間軸パネルの高さが制限されることを確認（約200px）
    const timelinePanelBox = await timelinePanel.boundingBox();
    expect(timelinePanelBox?.height).toBeLessThan(250);
    
    // 投稿フォームがモバイル向けに最適化されることを確認
    const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
    const textareaBox = await textarea.boundingBox();
    expect(textareaBox?.width).toBeLessThan(350);
  });

  test('画面サイズ変更時の動的レイアウト調整', async ({ page }) => {
    // デスクトップサイズから開始
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // 左右分割レイアウトを確認
    const timelinePanel = page.locator('[data-testid="timeline-panel"]');
    const postListPanel = page.locator('[data-testid="post-list-panel"]');
    
    let timelinePanelBox = await timelinePanel.boundingBox();
    let postListPanelBox = await postListPanel.boundingBox();
    
    // 横並び配置を確認
    expect(timelinePanelBox?.x).toBeLessThan(postListPanelBox?.x || 0);
    
    // タブレットサイズに変更
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(300); // レイアウト調整を待機
    
    // レイアウトが調整されることを確認
    timelinePanelBox = await timelinePanel.boundingBox();
    expect(timelinePanelBox?.width).toBeLessThan(300);
    
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // 上下分割レイアウトに変更されることを確認
    const mainLayout = page.locator('[data-testid="main-layout"]');
    await expect(mainLayout).toHaveClass(/mobile|flex-col/);
    
    // デスクトップサイズに戻す
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);
    
    // 左右分割レイアウトに戻ることを確認
    timelinePanelBox = await timelinePanel.boundingBox();
    postListPanelBox = await postListPanel.boundingBox();
    expect(timelinePanelBox?.x).toBeLessThan(postListPanelBox?.x || 0);
  });

  test('タッチデバイス向けのインタラクション', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // タッチイベントのシミュレーション
    const firstMarker = page.locator('[data-testid="timeline-marker"]').first();
    await expect(firstMarker).toBeVisible();
    
    // タップでプレビューが表示されることを確認
    await firstMarker.tap();
    
    // モバイルでは長押しでプレビューが表示される場合もある
    const preview = page.locator('[data-testid="post-preview"]');
    
    // プレビューまたはハイライトが機能することを確認
    const postItems = page.locator('[data-testid="post-item"]');
    const firstPost = postItems.first();
    
    // タップ後に何らかの反応があることを確認
    await expect(firstPost).toHaveClass(/highlighted|selected/);
  });

  test('フォント・ボタンサイズのモバイル最適化', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 投稿ボタンのサイズが適切であることを確認
    const submitButton = page.locator('button:has-text("投稿")');
    const buttonBox = await submitButton.boundingBox();
    
    // モバイルでタップしやすいサイズ（最小44px）
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    
    // テキストエリアのフォントサイズが適切であることを確認
    const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
    const fontSize = await textarea.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    
    // モバイルで読みやすいフォントサイズ（16px以上）
    const fontSizeValue = parseInt(fontSize);
    expect(fontSizeValue).toBeGreaterThanOrEqual(16);
  });

  test('横向き・縦向きの対応', async ({ page }) => {
    // 縦向きモバイル
    await page.setViewportSize({ width: 375, height: 667 });
    
    let mainLayout = page.locator('[data-testid="main-layout"]');
    await expect(mainLayout).toBeVisible();
    
    // 横向きモバイル
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(300);
    
    // レイアウトが適切に調整されることを確認
    await expect(mainLayout).toBeVisible();
    
    // 時間軸パネルが適切に表示されることを確認
    const timelinePanel = page.locator('[data-testid="timeline-panel"]');
    await expect(timelinePanel).toBeVisible();
    
    // 投稿リストが適切に表示されることを確認
    const postListPanel = page.locator('[data-testid="post-list-panel"]');
    await expect(postListPanel).toBeVisible();
  });

  test('スクロール動作のレスポンシブ対応', async ({ page }) => {
    // 追加の投稿を作成してスクロールが必要な状況を作る
    for (let i = 0; i < 10; i++) {
      const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
      await textarea.fill(`追加投稿 ${i + 1}`);
      
      const submitButton = page.locator('button:has-text("投稿")');
      await submitButton.click();
      
      await page.waitForTimeout(50);
    }
    
    // デスクトップでのスクロール動作を確認
    await page.setViewportSize({ width: 1200, height: 800 });
    
    const postListPanel = page.locator('[data-testid="post-list-panel"]');
    await postListPanel.evaluate((element) => {
      element.scrollTop = element.scrollHeight / 2;
    });
    
    await page.waitForTimeout(300);
    
    // モバイルでのスクロール動作を確認
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    await postListPanel.evaluate((element) => {
      element.scrollTop = element.scrollHeight / 3;
    });
    
    await page.waitForTimeout(300);
    
    // スクロール位置が適切に維持されることを確認
    const scrollTop = await postListPanel.evaluate((element) => element.scrollTop);
    expect(scrollTop).toBeGreaterThan(0);
  });
});