import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

/**
 * テストセットアップファイル
 * 各テスト実行前後の共通処理とモック設定を行う
 */

// 各テスト後のクリーンアップ処理
afterEach(() => {
  cleanup();
  // LocalStorageをクリア
  localStorage.clear();
  // SessionStorageをクリア
  sessionStorage.clear();
  // すべてのモックをリセット
  vi.clearAllMocks();
});

// 各テスト前のセットアップ処理
beforeEach(() => {
  // LocalStorageのモック設定
  const localStorageMock = {
    getItem: vi.fn((key: string) => {
      return localStorageMock.store[key] || null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      localStorageMock.store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageMock.store[key];
    }),
    clear: vi.fn(() => {
      localStorageMock.store = {};
    }),
    store: {} as Record<string, string>
  };
  
  vi.stubGlobal('localStorage', localStorageMock);

  // SessionStorageのモック設定
  const sessionStorageMock = {
    getItem: vi.fn((key: string) => {
      return sessionStorageMock.store[key] || null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      sessionStorageMock.store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete sessionStorageMock.store[key];
    }),
    clear: vi.fn(() => {
      sessionStorageMock.store = {};
    }),
    store: {} as Record<string, string>
  };
  
  vi.stubGlobal('sessionStorage', sessionStorageMock);

  // IndexedDBのモック設定（基本的なモック）
  const indexedDBMock = {
    open: vi.fn(() => ({
      result: {
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            add: vi.fn(),
            put: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
            getAll: vi.fn(() => ({ onsuccess: null, result: [] }))
          }))
        }))
      },
      onsuccess: null,
      onerror: null
    })),
    deleteDatabase: vi.fn()
  };
  
  vi.stubGlobal('indexedDB', indexedDBMock);

  // console.errorの抑制（テスト中の不要なログを防ぐ）
  const originalError = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    // React の警告やエラーは表示しない
    const message = args[0];
    if (
      typeof message === 'string' && 
      (message.includes('Warning:') || 
       message.includes('Error:') ||
       message.includes('Failed prop type'))
    ) {
      return;
    }
    // その他のエラーは元の動作を維持
    originalError(...args);
  });

  // console.warnの抑制
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  // DateのモックをリセットしてデフォルトのDateを使用
  vi.useRealTimers();
});

// グローバルなエラーハンドリング設定
global.addEventListener = vi.fn();
global.removeEventListener = vi.fn();

// ResizeObserverのモック（レスポンシブテスト用）
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// IntersectionObserverのモック（スクロールテスト用）
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// matchMediaのモック（レスポンシブテスト用）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// scrollToのモック
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// scrollIntoViewのモック
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  writable: true,
  value: vi.fn(),
});

// getComputedStyleのモック拡張
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = vi.fn().mockImplementation((element) => {
  const style = originalGetComputedStyle(element);
  return {
    ...style,
    visibility: 'visible',
    display: 'block',
    opacity: '1',
    getPropertyValue: vi.fn((prop) => {
      switch (prop) {
        case 'visibility': return 'visible';
        case 'display': return 'block';
        case 'opacity': return '1';
        default: return style.getPropertyValue(prop);
      }
    })
  };
});

/**
 * テスト用のユーティリティ関数
 */

// テスト用のタイマー制御
export const advanceTimersByTime = (ms: number) => {
  vi.advanceTimersByTime(ms);
};

// テスト用の日付設定
export const setMockDate = (date: Date) => {
  vi.setSystemTime(date);
};

// テスト用のLocalStorage操作
export const setLocalStorageItem = (key: string, value: string) => {
  localStorage.setItem(key, value);
};

export const getLocalStorageItem = (key: string) => {
  return localStorage.getItem(key);
};

// テスト用のエラー発生
export const triggerError = (message: string) => {
  throw new Error(message);
};

// テスト用の非同期待機
export const waitForNextTick = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};