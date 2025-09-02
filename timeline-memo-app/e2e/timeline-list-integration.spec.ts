import { test, expect } from '@playwright/test';

/**
 * 時間軸とリスト連携のテスト
 * 要件: 4.4, 4.5, 5.5, 5.6の統合確認
 */
test.describe('時間軸とリスト連携', () => {
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
    
    // テスト用の投稿を複数作成
    const testPosts = [
      '1番目の投稿です',
      '2番目の投稿です', 
      '3番目の投稿です',
      '4番目の投稿です',
      '5番目の投稿です'
    ];
    
    for (const content of testPosts) {
      const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
      await textarea.fill(content);
      
      const submitButton = page.locator('button:has-text("投稿")');
      await submitButton.click();
      
      // 投稿間に少し時間差を作る
      await page.waitForTimeout(200);
    }
    
    // 投稿が完了するまで待機
    await expect(page.locator('[data-testid="post-item"]')).toHaveCount(5);
  });

  test('マーカークリック時の右側リストハイライト', async ({ page }) => {
    // 時間軸マーカーが表示されることを確認
    const timelineMarkers = page.locator('[data-testid="timeline-marker"]');
    await expect(timelineMarkers).toHaveCount(5);
    
    // 3番目のマーカーをクリック
    const thirdMarker = timelineMarkers.nth(2);
    await thirdMarker.click();
    
    // 対応する投稿がハイライトされることを確認
    const postItems = page.locator('[data-testid="post-item"]');
    const thirdPost = postItems.nth(2);
    
    // ハイライトクラスが適用されることを確認
    await expect(thirdPost).toHaveClass(/highlighted|selected/);
    
    // 他の投稿はハイライトされていないことを確認
    await expect(postItems.nth(0)).not.toHaveClass(/highlighted|selected/);
    await expect(postItems.nth(1)).not.toHaveClass(/highlighted|selected/);
    await expect(postItems.nth(3)).not.toHaveClass(/highlighted|selected/);
    await expect(postItems.nth(4)).not.toHaveClass(/highlighted|selected/);
  });

  test('リストスクロール時の左側マーカーハイライト', async ({ page }) => {
    // 投稿リストエリアを取得
    const postListPanel = page.locator('[data-testid="post-list-panel"]');
    await expect(postListPanel).toBeVisible();
    
    // 投稿リストを下にスクロール
    await postListPanel.evaluate((element) => {
      element.scrollTop = element.scrollHeight / 2;
    });
    
    // スクロール処理が完了するまで待機
    await page.waitForTimeout(300);
    
    // 現在表示されている投稿に対応するマーカーがハイライトされることを確認
    const timelineMarkers = page.locator('[data-testid="timeline-marker"]');
    
    // 少なくとも1つのマーカーがアクティブ状態になることを確認
    const activeMarkers = timelineMarkers.locator('.active, .highlighted');
    await expect(activeMarkers).toHaveCount.greaterThan(0);
  });

  test('マーカーホバー時のプレビュー表示', async ({ page }) => {
    // 最初のマーカーにホバー
    const firstMarker = page.locator('[data-testid="timeline-marker"]').first();
    await firstMarker.hover();
    
    // プレビューツールチップが表示されることを確認
    const preview = page.locator('[data-testid="post-preview"]');
    await expect(preview).toBeVisible();
    
    // プレビュー内容が正しく表示されることを確認
    await expect(preview.locator('text=5番目の投稿です')).toBeVisible();
    
    // マーカーから離れるとプレビューが非表示になることを確認
    await page.locator('body').hover();
    await expect(preview).not.toBeVisible();
  });

  test('複数マーカーの同時ホバー処理', async ({ page }) => {
    // 複数のマーカーを順番にホバー
    const markers = page.locator('[data-testid="timeline-marker"]');
    
    // 1番目のマーカーにホバー
    await markers.nth(0).hover();
    let preview = page.locator('[data-testid="post-preview"]');
    await expect(preview).toBeVisible();
    await expect(preview.locator('text=5番目の投稿です')).toBeVisible();
    
    // 2番目のマーカーにホバー（プレビューが切り替わる）
    await markers.nth(1).hover();
    await expect(preview.locator('text=4番目の投稿です')).toBeVisible();
    
    // 3番目のマーカーにホバー
    await markers.nth(2).hover();
    await expect(preview.locator('text=3番目の投稿です')).toBeVisible();
  });

  test('スムーズなスクロールアニメーション', async ({ page }) => {
    // 最後のマーカーをクリック
    const lastMarker = page.locator('[data-testid="timeline-marker"]').last();
    await lastMarker.click();
    
    // スクロールアニメーションが完了するまで待機
    await page.waitForTimeout(500);
    
    // 対応する投稿が表示領域に入っていることを確認
    const lastPost = page.locator('[data-testid="post-item"]').last();
    await expect(lastPost).toBeInViewport();
    
    // ハイライト状態になっていることを確認
    await expect(lastPost).toHaveClass(/highlighted|selected/);
  });

  test('時間軸の表示範囲計算', async ({ page }) => {
    // 時間軸が表示されていることを確認
    const timelineAxis = page.locator('[data-testid="timeline-axis"]');
    await expect(timelineAxis).toBeVisible();
    
    // 時間ラベルが表示されていることを確認
    const timeLabels = page.locator('[data-testid="time-label"]');
    await expect(timeLabels.first()).toBeVisible();
    
    // マーカーが時間軸上に適切に配置されていることを確認
    const markers = page.locator('[data-testid="timeline-marker"]');
    
    for (let i = 0; i < 5; i++) {
      const marker = markers.nth(i);
      await expect(marker).toBeVisible();
      
      // マーカーが時間軸の範囲内に配置されていることを確認
      const markerBox = await marker.boundingBox();
      const axisBox = await timelineAxis.boundingBox();
      
      expect(markerBox).toBeTruthy();
      expect(axisBox).toBeTruthy();
      
      if (markerBox && axisBox) {
        expect(markerBox.y).toBeGreaterThanOrEqual(axisBox.y);
        expect(markerBox.y + markerBox.height).toBeLessThanOrEqual(axisBox.y + axisBox.height);
      }
    }
  });

  test('同じ時間帯の複数投稿への対応', async ({ page }) => {
    // 短時間で複数の投稿を作成（同じ時間帯になる可能性が高い）
    const rapidPosts = ['急速投稿1', '急速投稿2', '急速投稿3'];
    
    for (const content of rapidPosts) {
      const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
      await textarea.fill(content);
      
      const submitButton = page.locator('button:has-text("投稿")');
      await submitButton.click();
      
      // 意図的に短い間隔で投稿
      await page.waitForTimeout(50);
    }
    
    // 新しい投稿が追加されることを確認
    await expect(page.locator('[data-testid="post-item"]')).toHaveCount(8);
    
    // 時間軸に新しいマーカーが追加されることを確認
    const markers = page.locator('[data-testid="timeline-marker"]');
    await expect(markers).toHaveCount(8);
    
    // 近接したマーカーが適切に配置されていることを確認
    // （重複せずに表示されている）
    const markerPositions = await markers.evaluateAll((elements) => {
      return elements.map(el => {
        const rect = el.getBoundingClientRect();
        return { top: rect.top, left: rect.left };
      });
    });
    
    // 各マーカーが異なる位置にあることを確認
    const uniquePositions = new Set(markerPositions.map(pos => `${pos.top}-${pos.left}`));
    expect(uniquePositions.size).toBe(markerPositions.length);
  });
});