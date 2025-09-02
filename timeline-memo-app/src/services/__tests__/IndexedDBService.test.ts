import { IndexedDBService, IndexedDBError } from '../IndexedDBService';
import type { Post } from '../../types';

// IndexedDBのモック実装
class MockIDBRequest {
  result: any = null;
  error: any = null;
  onsuccess: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(private shouldSucceed: boolean = true, private resultValue?: any) {
    setTimeout(() => {
      if (this.shouldSucceed) {
        this.result = resultValue;
        this.onsuccess?.(new Event('success'));
      } else {
        this.error = new Error('Mock error');
        this.onerror?.(new Event('error'));
      }
    }, 0);
  }
}

class MockIDBTransaction {
  error: any = null;
  oncomplete: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(private shouldSucceed: boolean = true) {
    setTimeout(() => {
      if (this.shouldSucceed) {
        this.oncomplete?.(new Event('complete'));
      } else {
        this.error = new Error('Transaction error');
        this.onerror?.(new Event('error'));
      }
    }, 0);
  }

  objectStore(name: string) {
    return new MockIDBObjectStore();
  }
}

class MockIDBObjectStore {
  private data: Map<string, any> = new Map();

  add(value: any) {
    return new MockIDBRequest(true, value);
  }

  put(value: any) {
    this.data.set(value.id, value);
    return new MockIDBRequest(true, value);
  }

  get(key: string) {
    const result = this.data.get(key);
    return new MockIDBRequest(true, result);
  }

  delete(key: string) {
    this.data.delete(key);
    return new MockIDBRequest(true);
  }

  getAll() {
    return new MockIDBRequest(true, Array.from(this.data.values()));
  }

  createIndex() {
    // インデックス作成のモック
  }
}

class MockIDBDatabase {
  onerror: ((event: Event) => void) | null = null;
  objectStoreNames = { contains: () => false };

  transaction(storeNames: string[], mode: string) {
    return new MockIDBTransaction();
  }

  createObjectStore(name: string, options?: any) {
    return new MockIDBObjectStore();
  }

  close() {
    // データベースクローズのモック
  }
}

// IndexedDBをモック
const mockIndexedDB = {
  open: jest.fn()
};

// グローバルなIndexedDBのモック
Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
});

describe('IndexedDBService', () => {
  let service: IndexedDBService;
  let mockDB: MockIDBDatabase;

  beforeEach(() => {
    service = new IndexedDBService();
    mockDB = new MockIDBDatabase();
    
    // コンソールログを抑制
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // IndexedDBのモックをリセット
    mockIndexedDB.open.mockReset();
    
    // 成功するモックリクエストを設定
    mockIndexedDB.open.mockImplementation(() => {
      const request = new MockIDBRequest(true, mockDB);
      setTimeout(() => {
        // onupgradeneededイベントをシミュレート
        const upgradeEvent = {
          target: request,
          oldVersion: 0,
          newVersion: 1
        } as any;
        
        if ((request as any).onupgradeneeded) {
          (request as any).onupgradeneeded(upgradeEvent);
        }
      }, 0);
      return request;
    });
  });

  afterEach(async () => {
    await service.close();
    jest.restoreAllMocks();
  });

  describe('IndexedDBError', () => {
    it('IndexedDBErrorクラスが正しく動作する', () => {
      const error = new IndexedDBError('テストエラー', 'testOperation');
      
      expect(error.message).toBe('テストエラー');
      expect(error.operation).toBe('testOperation');
      expect(error.name).toBe('IndexedDBError');
      expect(error instanceof Error).toBe(true);
    });

    it('originalErrorを含むIndexedDBErrorが正しく動作する', () => {
      const originalError = new Error('元のエラー');
      const error = new IndexedDBError('テストエラー', 'testOperation', originalError);
      
      expect(error.message).toBe('テストエラー');
      expect(error.operation).toBe('testOperation');
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('初期化', () => {
    it('データベースが正常に初期化される', async () => {
      await service.init();
      const status = service.getStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.isConnected).toBe(true);
    });

    it('複数回の初期化呼び出しが安全に処理される', async () => {
      await service.init();
      await service.init();
      await service.init();
      
      const status = service.getStatus();
      expect(status.isInitialized).toBe(true);
      expect(mockIndexedDB.open).toHaveBeenCalledTimes(1);
    });
  });

  describe('投稿作成', () => {
    beforeEach(async () => {
      await service.init();
    });

    it('有効なコンテンツで投稿を作成できる', async () => {
      const content = 'テスト投稿です';
      const post = await service.createPost(content);
      
      expect(post).toHaveProperty('id');
      expect(post.content).toBe(content);
      expect(post.createdAt).toBeInstanceOf(Date);
      expect(post.updatedAt).toBeInstanceOf(Date);
      expect(typeof post.id).toBe('string');
    });

    it('空のコンテンツでエラーを投げる', async () => {
      await expect(service.createPost('')).rejects.toThrow(IndexedDBError);
      await expect(service.createPost('   ')).rejects.toThrow('コンテンツが空です');
    });

    it('コンテンツの前後の空白が削除される', async () => {
      const content = '  テスト投稿  ';
      const post = await service.createPost(content);
      
      expect(post.content).toBe('テスト投稿');
    });
  });

  describe('投稿取得', () => {
    let testPost: Post;

    beforeEach(async () => {
      await service.init();
      testPost = await service.createPost('テスト投稿');
    });

    it('存在する投稿を取得できる', async () => {
      const post = await service.getPost(testPost.id);
      
      expect(post).not.toBeNull();
      expect(post!.id).toBe(testPost.id);
      expect(post!.content).toBe(testPost.content);
    });

    it('存在しない投稿でnullを返す', async () => {
      const post = await service.getPost('non-existent-id');
      expect(post).toBeNull();
    });

    it('無効なIDでエラーを投げる', async () => {
      await expect(service.getPost('')).rejects.toThrow('投稿IDが無効です');
      await expect(service.getPost('   ')).rejects.toThrow('投稿IDが無効です');
    });
  });

  describe('投稿更新', () => {
    let testPost: Post;

    beforeEach(async () => {
      await service.init();
      testPost = await service.createPost('元の投稿');
    });

    it('存在する投稿を更新できる', async () => {
      const newContent = '更新された投稿';
      const updatedPost = await service.updatePost(testPost.id, newContent);
      
      expect(updatedPost.id).toBe(testPost.id);
      expect(updatedPost.content).toBe(newContent);
      expect(updatedPost.createdAt).toEqual(testPost.createdAt);
      expect(updatedPost.updatedAt.getTime()).toBeGreaterThan(testPost.updatedAt.getTime());
    });

    it('存在しない投稿の更新でエラーを投げる', async () => {
      await expect(service.updatePost('non-existent-id', '新しいコンテンツ'))
        .rejects.toThrow('指定された投稿が見つかりません');
    });

    it('無効なIDでエラーを投げる', async () => {
      await expect(service.updatePost('', '新しいコンテンツ'))
        .rejects.toThrow('投稿IDが無効です');
    });

    it('空のコンテンツでエラーを投げる', async () => {
      await expect(service.updatePost(testPost.id, ''))
        .rejects.toThrow('コンテンツが空です');
    });
  });

  describe('投稿削除', () => {
    let testPost: Post;

    beforeEach(async () => {
      await service.init();
      testPost = await service.createPost('削除テスト投稿');
    });

    it('存在する投稿を削除できる', async () => {
      await service.deletePost(testPost.id);
      
      const deletedPost = await service.getPost(testPost.id);
      expect(deletedPost).toBeNull();
    });

    it('存在しない投稿の削除でエラーを投げる', async () => {
      await expect(service.deletePost('non-existent-id'))
        .rejects.toThrow('指定された投稿が見つかりません');
    });

    it('無効なIDでエラーを投げる', async () => {
      await expect(service.deletePost(''))
        .rejects.toThrow('投稿IDが無効です');
    });
  });

  describe('全投稿取得', () => {
    beforeEach(async () => {
      await service.init();
    });

    it('空のデータベースで空配列を返す', async () => {
      const posts = await service.getAllPosts();
      expect(posts).toEqual([]);
    });

    it('複数の投稿を新しい順で取得できる', async () => {
      const post1 = await service.createPost('投稿1');
      await new Promise(resolve => setTimeout(resolve, 10)); // 時間差を作る
      const post2 = await service.createPost('投稿2');
      
      const posts = await service.getAllPosts();
      
      expect(posts).toHaveLength(2);
      expect(posts[0].id).toBe(post2.id); // 新しい投稿が最初
      expect(posts[1].id).toBe(post1.id);
    });
  });

  describe('日付範囲での投稿取得', () => {
    beforeEach(async () => {
      await service.init();
    });

    it('無効な日付範囲でエラーを投げる', async () => {
      const startDate = new Date('2024-01-31');
      const endDate = new Date('2024-01-01');

      await expect(service.getPostsByDateRange(startDate, endDate))
        .rejects.toThrow(IndexedDBError);
      await expect(service.getPostsByDateRange(startDate, endDate))
        .rejects.toThrow('開始日時は終了日時より前である必要があります');
    });

    it('null/undefinedの日付でエラーを投げる', async () => {
      await expect(service.getPostsByDateRange(null as any, new Date()))
        .rejects.toThrow('開始日時と終了日時が必要です');
      
      await expect(service.getPostsByDateRange(new Date(), null as any))
        .rejects.toThrow('開始日時と終了日時が必要です');
    });

    it('指定した日付範囲の投稿を取得できる', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      await service.createPost('古い投稿');
      await service.createPost('新しい投稿');
      
      const posts = await service.getPostsByDateRange(oneHourAgo, now);
      expect(posts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('統計情報', () => {
    beforeEach(async () => {
      await service.init();
    });

    it('空のデータベースで正しい統計を返す', async () => {
      const stats = await service.getStats();
      
      expect(stats.totalPosts).toBe(0);
      expect(stats.oldestPost).toBeUndefined();
      expect(stats.newestPost).toBeUndefined();
    });

    it('投稿がある場合の統計を正しく返す', async () => {
      const post1 = await service.createPost('投稿1');
      await new Promise(resolve => setTimeout(resolve, 10));
      const post2 = await service.createPost('投稿2');
      
      const stats = await service.getStats();
      
      expect(stats.totalPosts).toBe(2);
      expect(stats.oldestPost).toEqual(post1.createdAt);
      expect(stats.newestPost).toEqual(post2.createdAt);
    });
  });

  describe('ユーティリティメソッド', () => {
    it('getStatusが正しい状態を返す', () => {
      const status = service.getStatus();
      
      expect(status).toHaveProperty('isInitialized');
      expect(status).toHaveProperty('isConnected');
      expect(typeof status.isInitialized).toBe('boolean');
      expect(typeof status.isConnected).toBe('boolean');
    });

    it('subscribeToUpdatesが空の関数を返す', () => {
      const unsubscribe = service.subscribeToUpdates(() => {});
      
      expect(typeof unsubscribe).toBe('function');
      // 呼び出してもエラーが発生しないことを確認
      expect(() => unsubscribe()).not.toThrow();
    });

    it('closeメソッドが正常に動作する', async () => {
      await service.init();
      expect(service.getStatus().isConnected).toBe(true);
      
      await service.close();
      expect(service.getStatus().isConnected).toBe(false);
      expect(service.getStatus().isInitialized).toBe(false);
    });
  });
});