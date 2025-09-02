import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../App';

/**
 * アプリケーション全体の統合テスト
 * 複数のコンポーネントが連携して動作することを確認
 */

// IndexedDBのモック
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

// グローバルなIndexedDBをモック
Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// IDBRequestのモック
const createMockIDBRequest = (result?: any) => {
  const request = {
    result,
    error: null,
    onsuccess: null as ((event: any) => void) | null,
    onerror: null as ((event: any) => void) | null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  
  setTimeout(() => {
    if (request.onsuccess) {
      request.onsuccess({ target: request });
    }
  }, 0);
  
  return request;
};

// IDBDatabaseのモック
const createMockIDBDatabase = () => ({
  transaction: jest.fn(() => ({
    objectStore: jest.fn(() => ({
      add: jest.fn(() => createMockIDBRequest()),
      put: jest.fn(() => createMockIDBRequest()),
      delete: jest.fn(() => createMockIDBRequest()),
      get: jest.fn(() => createMockIDBRequest(null)),
      getAll: jest.fn(() => createMockIDBRequest([])),
      createIndex: jest.fn(),
    })),
    oncomplete: null,
    onerror: null,
  })),
  createObjectStore: jest.fn(() => ({
    createIndex: jest.fn(),
  })),
  close: jest.fn(),
});

describe('アプリケーション全体の統合テスト', () => {
  beforeEach(() => {
    // IndexedDBのモックをリセット
    jest.clearAllMocks();
    
    mockIndexedDB.open.mockImplementation(() => {
      const request = createMockIDBRequest();
      request.result = createMockIDBDatabase();
      return request;
    });
    
    // LocalStorageをクリア
    localStorage.clear();
  });

  test('アプリケーションが正常に読み込まれる', async () => {
    render(<App />);
    
    // アプリが正常に読み込まれることを確認
    await waitFor(() => {
      expect(screen.getByText('Timeline Memo')).toBeInTheDocument();
    });
    
    // メインレイアウトが表示されることを確認
    expect(screen.getByText('タイムライン')).toBeInTheDocument();
    expect(screen.getByText('投稿リスト')).toBeInTheDocument();
  });

  test('基本的なレイアウト構造が正しく表示される', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Timeline Memo')).toBeInTheDocument();
    });
    
    // 左側の時間軸パネルが表示されることを確認
    expect(screen.getByText('タイムライン')).toBeInTheDocument();
    
    // 右側の投稿リストパネルが表示されることを確認
    expect(screen.getByText('投稿リスト')).toBeInTheDocument();
    
    // 初期状態では投稿がないことを確認
    expect(screen.getByText('まだ投稿がありません')).toBeInTheDocument();
  });

  test('データサービスが正常に初期化される', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Timeline Memo')).toBeInTheDocument();
    });
    
    // IndexedDBサービスが初期化されることを確認
    expect(mockIndexedDB.open).toHaveBeenCalled();
  });
});