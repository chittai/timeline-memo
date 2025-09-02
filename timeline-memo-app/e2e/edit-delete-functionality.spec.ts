import { test, expect } from '@playwright/test';

/**
 * 投稿編集・削除機能のE2Eテスト
 * 要件: 7.1, 7.2, 7.3, 7.4の統合確認
 */
test.describe('投稿編集・削除機能', () => {
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
    const testPosts = [
      '編集テスト用の投稿です',
      '削除テスト用の投稿です',
      '保持される投稿です'
    ];
    
    for (const content of testPosts) {
      const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
      await textarea.fill(content);
      
      const submitButton = page.locator('button:has-text("投稿")');
      await submitButton.click();
      
      await page.waitForTimeout(100);
    }
    
    // 投稿が作成されることを確認
    await expect(page.locator('[data-testid="post-item"]')).toHaveCount(3);
  });

  test('投稿編集機能の完全フロー', async ({ page }) => {
    // 最初の投稿の編集ボタンをクリック
    const firstPost = page.locator('[data-testid="post-item"]').first();
    const editButton = firstPost.locator('button:has-text("編集"), button[aria-label*="編集"]');
    
    await expect(editButton).toBeVisible();
    await editButton.click();
    
    // 編集モードに切り替わることを確認
    const editTextarea = firstPost.locator('textarea');
    await expect(editTextarea).toBeVisible();
    await expect(editTextarea).toHaveValue('保持される投稿です');
    
    // 投稿内容を編集
    const newContent = '編集後の投稿内容です\n\n**太字テスト**\n\n- 編集後のリスト';
    await editTextarea.fill(newContent);
    
    // 保存ボタンをクリック
    const saveButton = firstPost.locator('button:has-text("保存"), button[aria-label*="保存"]');
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    
    // 編集モードが終了することを確認
    await expect(editTextarea).not.toBeVisible();
    
    // 編集された内容が表示されることを確認
    await expect(firstPost.locator('text=編集後の投稿内容です')).toBeVisible();
    await expect(firstPost.locator('strong:has-text("太字テスト")')).toBeVisible();
    await expect(firstPost.locator('li:has-text("編集後のリスト")')).toBeVisible();
    
    // データが永続化されることを確認（ページリロード）
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const persistedPost = page.locator('[data-testid="post-item"]').first();
    await expect(persistedPost.locator('text=編集後の投稿内容です')).toBeVisible();
  });

  test('編集キャンセル機能', async ({ page }) => {
    const secondPost = page.locator('[data-testid="post-item"]').nth(1);
    const originalContent = '削除テスト用の投稿です';
    
    // 編集ボタンをクリック
    const editButton = secondPost.locator('button:has-text("編集"), button[aria-label*="編集"]');
    await editButton.click();
    
    // 編集モードに切り替わることを確認
    const editTextarea = secondPost.locator('textarea');
    await expect(editTextarea).toBeVisible();
    await expect(editTextarea).toHaveValue(originalContent);
    
    // 内容を変更
    await editTextarea.fill('キャンセルされる変更内容');
    
    // キャンセルボタンをクリック
    const cancelButton = secondPost.locator('button:has-text("キャンセル"), button[aria-label*="キャンセル"]');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
    
    // 編集モードが終了することを確認
    await expect(editTextarea).not.toBeVisible();
    
    // 元の内容が保持されることを確認
    await expect(secondPost.locator(`text=${originalContent}`)).toBeVisible();
    await expect(secondPost.locator('text=キャンセルされる変更内容')).not.toBeVisible();
  });

  test('投稿削除機能の完全フロー', async ({ page }) => {
    // 削除前の投稿数を確認
    await expect(page.locator('[data-testid="post-item"]')).toHaveCount(3);
    
    // 2番目の投稿の削除ボタンをクリック
    const secondPost = page.locator('[data-testid="post-item"]').nth(1);
    const deleteButton = secondPost.locator('button:has-text("削除"), button[aria-label*="削除"]');
    
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
    
    // 削除確認ダイアログが表示されることを確認
    const confirmDialog = page.locator('[data-testid="delete-confirm-dialog"]');
    await expect(confirmDialog).toBeVisible();
    
    // ダイアログに適切なメッセージが表示されることを確認
    await expect(confirmDialog.locator('text=削除しますか')).toBeVisible();
    
    // 削除を確認
    const confirmButton = confirmDialog.locator('button:has-text("削除"), button:has-text("はい")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
    
    // ダイアログが閉じることを確認
    await expect(confirmDialog).not.toBeVisible();
    
    // 投稿が削除されることを確認
    await expect(page.locator('[data-testid="post-item"]')).toHaveCount(2);
    
    // 削除された投稿の内容が表示されないことを確認
    await expect(page.locator('text=削除テスト用の投稿です')).not.toBeVisible();
    
    // 他の投稿は残っていることを確認
    await expect(page.locator('text=保持される投稿です')).toBeVisible();
    await expect(page.locator('text=編集テスト用の投稿です')).toBeVisible();
    
    // 時間軸からもマーカーが削除されることを確認
    const timelineMarkers = page.locator('[data-testid="timeline-marker"]');
    await expect(timelineMarkers).toHaveCount(2);
  });

  test('削除キャンセル機能', async ({ page }) => {
    // 削除前の投稿数を確認
    await expect(page.locator('[data-testid="post-item"]')).toHaveCount(3);
    
    // 最初の投稿の削除ボタンをクリック
    const firstPost = page.locator('[data-testid="post-item"]').first();
    const deleteButton = firstPost.locator('button:has-text("削除"), button[aria-label*="削除"]');
    
    await deleteButton.click();
    
    // 削除確認ダイアログが表示されることを確認
    const confirmDialog = page.locator('[data-testid="delete-confirm-dialog"]');
    await expect(confirmDialog).toBeVisible();
    
    // キャンセルボタンをクリック
    const cancelButton = confirmDialog.locator('button:has-text("キャンセル"), button:has-text("いいえ")');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
    
    // ダイアログが閉じることを確認
    await expect(confirmDialog).not.toBeVisible();
    
    // 投稿が削除されていないことを確認
    await expect(page.locator('[data-testid="post-item"]')).toHaveCount(3);
    await expect(page.locator('text=保持される投稿です')).toBeVisible();
  });

  test('データ永続化の確認（編集・削除後）', async ({ page }) => {
    // 投稿を編集
    const firstPost = page.locator('[data-testid="post-item"]').first();
    const editButton = firstPost.locator('button:has-text("編集"), button[aria-label*="編集"]');
    await editButton.click();
    
    const editTextarea = firstPost.locator('textarea');
    await editTextarea.fill('永続化テスト用の編集内容');
    
    const saveButton = firstPost.locator('button:has-text("保存"), button[aria-label*="保存"]');
    await saveButton.click();
    
    // 投稿を削除
    const secondPost = page.locator('[data-testid="post-item"]').nth(1);
    const deleteButton = secondPost.locator('button:has-text("削除"), button[aria-label*="削除"]');
    await deleteButton.click();
    
    const confirmDialog = page.locator('[data-testid="delete-confirm-dialog"]');
    const confirmButton = confirmDialog.locator('button:has-text("削除"), button:has-text("はい")');
    await confirmButton.click();
    
    // 変更後の状態を確認
    await expect(page.locator('[data-testid="post-item"]')).toHaveCount(2);
    await expect(page.locator('text=永続化テスト用の編集内容')).toBeVisible();
    
    // ページをリロード
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 変更が永続化されていることを確認
    await expect(page.locator('[data-testid="post-item"]')).toHaveCount(2);
    await expect(page.locator('text=永続化テスト用の編集内容')).toBeVisible();
    await expect(page.locator('text=削除テスト用の投稿です')).not.toBeVisible();
    
    // 時間軸の状態も正しく復元されることを確認
    const timelineMarkers = page.locator('[data-testid="timeline-marker"]');
    await expect(timelineMarkers).toHaveCount(2);
  });

  test('複数投稿の同時編集制限', async ({ page }) => {
    // 最初の投稿を編集モードにする
    const firstPost = page.locator('[data-testid="post-item"]').first();
    const firstEditButton = firstPost.locator('button:has-text("編集"), button[aria-label*="編集"]');
    await firstEditButton.click();
    
    // 編集モードになることを確認
    const firstEditTextarea = firstPost.locator('textarea');
    await expect(firstEditTextarea).toBeVisible();
    
    // 2番目の投稿の編集ボタンをクリック
    const secondPost = page.locator('[data-testid="post-item"]').nth(1);
    const secondEditButton = secondPost.locator('button:has-text("編集"), button[aria-label*="編集"]');
    
    // 2番目の編集ボタンが無効化されているか、クリックしても編集モードにならないことを確認
    if (await secondEditButton.isVisible()) {
      await secondEditButton.click();
      
      // 2番目の投稿が編集モードにならないことを確認
      const secondEditTextarea = secondPost.locator('textarea');
      await expect(secondEditTextarea).not.toBeVisible();
    }
    
    // 最初の投稿の編集をキャンセル
    const cancelButton = firstPost.locator('button:has-text("キャンセル"), button[aria-label*="キャンセル"]');
    await cancelButton.click();
    
    // 編集モードが終了することを確認
    await expect(firstEditTextarea).not.toBeVisible();
    
    // 2番目の投稿が編集可能になることを確認
    await secondEditButton.click();
    const secondEditTextarea = secondPost.locator('textarea');
    await expect(secondEditTextarea).toBeVisible();
  });

  test('空の内容での編集保存の防止', async ({ page }) => {
    const firstPost = page.locator('[data-testid="post-item"]').first();
    const editButton = firstPost.locator('button:has-text("編集"), button[aria-label*="編集"]');
    await editButton.click();
    
    const editTextarea = firstPost.locator('textarea');
    await expect(editTextarea).toBeVisible();
    
    // 内容を空にする
    await editTextarea.fill('');
    
    // 保存ボタンが無効化されることを確認
    const saveButton = firstPost.locator('button:has-text("保存"), button[aria-label*="保存"]');
    await expect(saveButton).toBeDisabled();
    
    // 空白文字のみの場合も無効化されることを確認
    await editTextarea.fill('   \n\n   ');
    await expect(saveButton).toBeDisabled();
    
    // 有効な内容を入力すると保存ボタンが有効になることを確認
    await editTextarea.fill('有効な内容');
    await expect(saveButton).toBeEnabled();
  });
});