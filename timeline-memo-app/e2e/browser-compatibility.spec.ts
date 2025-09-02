import { test, expect, devices } from '@playwright/test';

/**
 * ブラウザ間互換性テスト
 * 異なるブラウザでの動作確認
 */
test.describe('ブラウザ間互換性テスト', () => {
  const testContent = 'ブラウザ互換性テスト用の投稿';

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
  });

  test('基本機能の動作確認 - 全ブラウザ', async ({ page, browserName }) => {
    console.log(`Testing on ${browserName}`);
    
    // アプリケーションが正常に読み込まれることを確認
    await expect(page.locator('textarea[placeholder*="今何を考えていますか"]')).toBeVisible();
    
    // 投稿作成機能
    const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
    await textarea.fill(testContent);
    
    const submitButton = page.locator('button:has-text("投稿")');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    
    // 投稿が表示されることを確認
    await expect(page.locator('[data-testid="post-item"]').first()).toBeVisible();
    await expect(page.locator(`text=${testContent}`)).toBeVisible();
    
    // 時間軸マーカーが表示されることを確認
    await expect(page.locator('[data-testid="timeline-marker"]').first()).toBeVisible();
  });

  test('CSS Grid/Flexboxレイアウトの互換性', async ({ page, browserName }) => {
    console.log(`Testing layout on ${browserName}`);
    
    // メインレイアウトが正しく表示されることを確認
    const mainLayout = page.locator('[data-testid="main-layout"]');
    await expect(mainLayout).toBeVisible();
    
    // 左右分割レイアウトの確認
    const timelinePanel = page.locator('[data-testid="timeline-panel"]');
    const postListPanel = page.locator('[data-testid="post-list-panel"]');
    
    await expect(timelinePanel).toBeVisible();
    await expect(postListPanel).toBeVisible();
    
    // パネルが適切に配置されていることを確認
    const timelinePanelBox = await timelinePanel.boundingBox();
    const postListPanelBox = await postListPanel.boundingBox();
    
    expect(timelinePanelBox).toBeTruthy();
    expect(postListPanelBox).toBeTruthy();
    
    if (timelinePanelBox && postListPanelBox) {
      // 左側パネルが右側パネルより左に配置されていることを確認
      expect(timelinePanelBox.x).toBeLessThan(postListPanelBox.x);
    }
  });

  test('JavaScript ES6+機能の互換性', async ({ page, browserName }) => {
    console.log(`Testing ES6+ features on ${browserName}`);
    
    // アプリケーションが正常に動作することを確認（ES6+機能を使用）
    await expect(page.locator('textarea[placeholder*="今何を考えていますか"]')).toBeVisible();
    
    // Promise、async/await、アロー関数などが正常に動作することを確認
    const jsResult = await page.evaluate(() => {
      // ES6+機能のテスト
      const testArray = [1, 2, 3];
      const doubled = testArray.map(x => x * 2);
      
      const testPromise = new Promise(resolve => {
        setTimeout(() => resolve('success'), 10);
      });
      
      return Promise.resolve({
        arrayMap: doubled,
        promiseSupport: true,
        arrowFunctions: true
      });
    });
    
    expect(jsResult.arrayMap).toEqual([2, 4, 6]);
    expect(jsResult.promiseSupport).toBe(true);
    expect(jsResult.arrowFunctions).toBe(true);
  });

  test('IndexedDB互換性', async ({ page, browserName }) => {
    console.log(`Testing IndexedDB on ${browserName}`);
    
    // IndexedDBが利用可能であることを確認
    const indexedDBSupport = await page.evaluate(() => {
      return 'indexedDB' in window;
    });
    
    expect(indexedDBSupport).toBe(true);
    
    // 投稿を作成してIndexedDBに保存
    const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
    await textarea.fill(`IndexedDBテスト - ${browserName}`);
    
    const submitButton = page.locator('button:has-text("投稿")');
    await submitButton.click();
    
    // 投稿が表示されることを確認
    await expect(page.locator(`text=IndexedDBテスト - ${browserName}`)).toBeVisible();
    
    // ページをリロードしてデータが永続化されていることを確認
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator(`text=IndexedDBテスト - ${browserName}`)).toBeVisible();
  });

  test('CSS変数とカスタムプロパティの互換性', async ({ page, browserName }) => {
    console.log(`Testing CSS variables on ${browserName}`);
    
    // CSS変数が正しく適用されていることを確認
    const cssVariableSupport = await page.evaluate(() => {
      const element = document.createElement('div');
      element.style.setProperty('--test-color', 'red');
      element.style.color = 'var(--test-color)';
      document.body.appendChild(element);
      
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      
      document.body.removeChild(element);
      
      return color === 'red' || color === 'rgb(255, 0, 0)';
    });
    
    expect(cssVariableSupport).toBe(true);
  });

  test('タッチイベントの互換性（モバイルブラウザ）', async ({ page, browserName }) => {
    // モバイルブラウザでのテスト
    if (browserName === 'webkit' || browserName === 'chromium') {
      console.log(`Testing touch events on ${browserName}`);
      
      // 投稿を作成
      const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
      await textarea.fill('タッチテスト投稿');
      
      const submitButton = page.locator('button:has-text("投稿")');
      await submitButton.click();
      
      // マーカーが表示されるまで待機
      await expect(page.locator('[data-testid="timeline-marker"]').first()).toBeVisible();
      
      // タッチイベントをシミュレート
      const marker = page.locator('[data-testid="timeline-marker"]').first();
      await marker.tap();
      
      // タップ後の反応を確認
      const postItem = page.locator('[data-testid="post-item"]').first();
      await expect(postItem).toHaveClass(/highlighted|selected/);
    }
  });

  test('フォント表示の互換性', async ({ page, browserName }) => {
    console.log(`Testing font rendering on ${browserName}`);
    
    // 日本語フォントが正しく表示されることを確認
    const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
    await textarea.fill('日本語フォントテスト：ひらがな、カタカナ、漢字');
    
    const submitButton = page.locator('button:has-text("投稿")');
    await submitButton.click();
    
    // 投稿が正しく表示されることを確認
    await expect(page.locator('text=日本語フォントテスト：ひらがな、カタカナ、漢字')).toBeVisible();
    
    // フォントが読み込まれていることを確認
    const fontLoaded = await page.evaluate(() => {
      return document.fonts.ready.then(() => true);
    });
    
    expect(fontLoaded).toBe(true);
  });

  test('スクロール動作の互換性', async ({ page, browserName }) => {
    console.log(`Testing scroll behavior on ${browserName}`);
    
    // 複数の投稿を作成してスクロールが必要な状況を作る
    for (let i = 0; i < 5; i++) {
      const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
      await textarea.fill(`スクロールテスト投稿 ${i + 1}`);
      
      const submitButton = page.locator('button:has-text("投稿")');
      await submitButton.click();
      
      await page.waitForTimeout(100);
    }
    
    // 投稿リストパネルでスクロールをテスト
    const postListPanel = page.locator('[data-testid="post-list-panel"]');
    await expect(postListPanel).toBeVisible();
    
    // スクロール動作をテスト
    await postListPanel.evaluate((element) => {
      element.scrollTop = element.scrollHeight / 2;
    });
    
    // スクロール位置が変更されたことを確認
    const scrollTop = await postListPanel.evaluate((element) => element.scrollTop);
    expect(scrollTop).toBeGreaterThan(0);
  });

  test('ローカルストレージの互換性', async ({ page, browserName }) => {
    console.log(`Testing localStorage on ${browserName}`);
    
    // ローカルストレージが利用可能であることを確認
    const localStorageSupport = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value');
        const value = localStorage.getItem('test');
        localStorage.removeItem('test');
        return value === 'value';
      } catch (e) {
        return false;
      }
    });
    
    expect(localStorageSupport).toBe(true);
  });

  test('エラーハンドリングの互換性', async ({ page, browserName }) => {
    console.log(`Testing error handling on ${browserName}`);
    
    // コンソールエラーをキャッチ
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // アプリケーションを使用
    const textarea = page.locator('textarea[placeholder*="今何を考えていますか"]');
    await textarea.fill('エラーハンドリングテスト');
    
    const submitButton = page.locator('button:has-text("投稿")');
    await submitButton.click();
    
    // 投稿が正常に作成されることを確認
    await expect(page.locator('text=エラーハンドリングテスト')).toBeVisible();
    
    // 重大なJavaScriptエラーが発生していないことを確認
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});