// Jest setup file
// テスト環境のセットアップを行う

import '@testing-library/jest-dom';

// IndexedDBのモックを設定
Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: {
    open: jest.fn(),
    deleteDatabase: jest.fn(),
  },
});

// その他のグローバルモックがあればここに追加