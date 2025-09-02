import { v4 as uuidv4 } from 'uuid';
import type { Post } from '../types';
import type { DataService } from './DataService';

// IndexedDBエラーの型定義
export class IndexedDBError extends Error {
  public operation: string;
  public originalError?: Error;
  
  constructor(
    message: string,
    operation: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'IndexedDBError';
    this.operation = operation;
    this.originalError = originalError;
  }
}

// ログレベルの定義
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class IndexedDBService implements DataService {
  private dbName = 'TimelineMemoApp';
  private version = 1;
  private storeName = 'posts';
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * ログ出力用のプライベートメソッド
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [IndexedDBService] ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'error':
        console.error(logMessage, data);
        break;
    }
  }

  /**
   * データベースの初期化
   * 複数回呼び出されても安全に処理される
   */
  async init(): Promise<void> {
    // 既に初期化済みの場合は何もしない
    if (this.isInitialized && this.db) {
      return;
    }

    // 初期化中の場合は既存のPromiseを返す
    if (this.initPromise) {
      return this.initPromise;
    }

    this.log('info', 'データベースの初期化を開始');

    this.initPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
          const error = new IndexedDBError(
            'データベースのオープンに失敗しました',
            'init',
            request.error || undefined
          );
          this.log('error', 'データベースオープンエラー', error);
          reject(error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.isInitialized = true;
          this.log('info', 'データベースの初期化が完了しました');
          
          // データベース接続エラーのハンドリング
          this.db.onerror = (event) => {
            this.log('error', 'データベース接続エラー', event);
          };

          resolve();
        };

        request.onupgradeneeded = (event) => {
          this.log('info', `データベースのマイグレーションを実行 (バージョン: ${this.version})`);
          this.handleDatabaseUpgrade(event);
        };

        request.onblocked = () => {
          this.log('warn', 'データベースのアップグレードがブロックされました');
        };

      } catch (error) {
        const dbError = new IndexedDBError(
          'データベース初期化中に予期しないエラーが発生しました',
          'init',
          error as Error
        );
        this.log('error', '初期化エラー', dbError);
        reject(dbError);
      }
    });

    return this.initPromise;
  }

  /**
   * データベースのマイグレーション処理
   */
  private handleDatabaseUpgrade(event: IDBVersionChangeEvent): void {
    const db = (event.target as IDBOpenDBRequest).result;
    const transaction = (event.target as IDBOpenDBRequest).transaction;

    try {
      // バージョン1: 初期スキーマの作成
      if (event.oldVersion < 1) {
        this.log('info', 'バージョン1のスキーマを作成中');
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // インデックスの作成
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          
          this.log('info', 'postsストアとインデックスを作成しました');
        }
      }

      // 将来のバージョンアップ用の拡張ポイント
      // if (event.oldVersion < 2) {
      //   // バージョン2の変更内容
      // }

      if (transaction) {
        transaction.oncomplete = () => {
          this.log('info', 'データベースマイグレーションが完了しました');
        };

        transaction.onerror = () => {
          this.log('error', 'マイグレーション中にエラーが発生しました', transaction.error);
        };
      }

    } catch (error) {
      this.log('error', 'マイグレーション処理でエラーが発生しました', error);
      throw new IndexedDBError(
        'データベースマイグレーションに失敗しました',
        'migration',
        error as Error
      );
    }
  }

  /**
   * データベース接続の確認と自動初期化
   */
  private async ensureConnection(): Promise<void> {
    if (!this.db || !this.isInitialized) {
      await this.init();
    }
  }

  async createPost(content: string): Promise<Post> {
    try {
      await this.ensureConnection();
      
      // バリデーション
      if (!content || content.trim().length === 0) {
        throw new IndexedDBError(
          'コンテンツが空です',
          'createPost'
        );
      }

      const post: Post = {
        id: uuidv4(),
        content: content.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.log('debug', '新しい投稿を作成中', { postId: post.id });

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.add(post);

        request.onerror = () => {
          const error = new IndexedDBError(
            '投稿の作成に失敗しました',
            'createPost',
            request.error || undefined
          );
          this.log('error', '投稿作成エラー', { postId: post.id, error });
          reject(error);
        };

        request.onsuccess = () => {
          this.log('info', '投稿を作成しました', { postId: post.id });
          resolve(post);
        };

        transaction.onerror = () => {
          const error = new IndexedDBError(
            'トランザクションエラーが発生しました',
            'createPost',
            transaction.error || undefined
          );
          this.log('error', 'トランザクションエラー', error);
          reject(error);
        };
      });
    } catch (error) {
      this.log('error', '投稿作成処理でエラーが発生しました', error);
      if (error instanceof IndexedDBError) {
        throw error;
      }
      throw new IndexedDBError(
        '投稿の作成中に予期しないエラーが発生しました',
        'createPost',
        error as Error
      );
    }
  }

  async updatePost(id: string, content: string): Promise<Post> {
    try {
      await this.ensureConnection();

      // バリデーション
      if (!id || id.trim().length === 0) {
        throw new IndexedDBError(
          '投稿IDが無効です',
          'updatePost'
        );
      }

      if (!content || content.trim().length === 0) {
        throw new IndexedDBError(
          'コンテンツが空です',
          'updatePost'
        );
      }

      this.log('debug', '投稿を更新中', { postId: id });

      const existingPost = await this.getPost(id);
      if (!existingPost) {
        throw new IndexedDBError(
          '指定された投稿が見つかりません',
          'updatePost'
        );
      }

      const updatedPost: Post = {
        ...existingPost,
        content: content.trim(),
        updatedAt: new Date(),
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(updatedPost);

        request.onerror = () => {
          const error = new IndexedDBError(
            '投稿の更新に失敗しました',
            'updatePost',
            request.error || undefined
          );
          this.log('error', '投稿更新エラー', { postId: id, error });
          reject(error);
        };

        request.onsuccess = () => {
          this.log('info', '投稿を更新しました', { postId: id });
          resolve(updatedPost);
        };

        transaction.onerror = () => {
          const error = new IndexedDBError(
            'トランザクションエラーが発生しました',
            'updatePost',
            transaction.error || undefined
          );
          this.log('error', 'トランザクションエラー', error);
          reject(error);
        };
      });
    } catch (error) {
      this.log('error', '投稿更新処理でエラーが発生しました', { postId: id, error });
      if (error instanceof IndexedDBError) {
        throw error;
      }
      throw new IndexedDBError(
        '投稿の更新中に予期しないエラーが発生しました',
        'updatePost',
        error as Error
      );
    }
  }

  async deletePost(id: string): Promise<void> {
    try {
      await this.ensureConnection();

      // バリデーション
      if (!id || id.trim().length === 0) {
        throw new IndexedDBError(
          '投稿IDが無効です',
          'deletePost'
        );
      }

      this.log('debug', '投稿を削除中', { postId: id });

      // 削除前に投稿の存在確認
      const existingPost = await this.getPost(id);
      if (!existingPost) {
        throw new IndexedDBError(
          '指定された投稿が見つかりません',
          'deletePost'
        );
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);

        request.onerror = () => {
          const error = new IndexedDBError(
            '投稿の削除に失敗しました',
            'deletePost',
            request.error || undefined
          );
          this.log('error', '投稿削除エラー', { postId: id, error });
          reject(error);
        };

        request.onsuccess = () => {
          this.log('info', '投稿を削除しました', { postId: id });
          resolve();
        };

        transaction.onerror = () => {
          const error = new IndexedDBError(
            'トランザクションエラーが発生しました',
            'deletePost',
            transaction.error || undefined
          );
          this.log('error', 'トランザクションエラー', error);
          reject(error);
        };
      });
    } catch (error) {
      this.log('error', '投稿削除処理でエラーが発生しました', { postId: id, error });
      if (error instanceof IndexedDBError) {
        throw error;
      }
      throw new IndexedDBError(
        '投稿の削除中に予期しないエラーが発生しました',
        'deletePost',
        error as Error
      );
    }
  }

  async getPost(id: string): Promise<Post | null> {
    try {
      await this.ensureConnection();

      // バリデーション
      if (!id || id.trim().length === 0) {
        throw new IndexedDBError(
          '投稿IDが無効です',
          'getPost'
        );
      }

      this.log('debug', '投稿を取得中', { postId: id });

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(id);

        request.onerror = () => {
          const error = new IndexedDBError(
            '投稿の取得に失敗しました',
            'getPost',
            request.error || undefined
          );
          this.log('error', '投稿取得エラー', { postId: id, error });
          reject(error);
        };

        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            // Date オブジェクトに変換
            result.createdAt = new Date(result.createdAt);
            result.updatedAt = new Date(result.updatedAt);
            this.log('debug', '投稿を取得しました', { postId: id });
          } else {
            this.log('debug', '投稿が見つかりませんでした', { postId: id });
          }
          resolve(result || null);
        };

        transaction.onerror = () => {
          const error = new IndexedDBError(
            'トランザクションエラーが発生しました',
            'getPost',
            transaction.error || undefined
          );
          this.log('error', 'トランザクションエラー', error);
          reject(error);
        };
      });
    } catch (error) {
      this.log('error', '投稿取得処理でエラーが発生しました', { postId: id, error });
      if (error instanceof IndexedDBError) {
        throw error;
      }
      throw new IndexedDBError(
        '投稿の取得中に予期しないエラーが発生しました',
        'getPost',
        error as Error
      );
    }
  }

  async getAllPosts(): Promise<Post[]> {
    try {
      await this.ensureConnection();

      this.log('debug', '全ての投稿を取得中');

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onerror = () => {
          const error = new IndexedDBError(
            '投稿一覧の取得に失敗しました',
            'getAllPosts',
            request.error || undefined
          );
          this.log('error', '投稿一覧取得エラー', error);
          reject(error);
        };

        request.onsuccess = () => {
          try {
            const posts = request.result.map((post: any) => ({
              ...post,
              createdAt: new Date(post.createdAt),
              updatedAt: new Date(post.updatedAt),
            }));
            
            // 新しい順にソート
            posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            
            this.log('info', `${posts.length}件の投稿を取得しました`);
            resolve(posts);
          } catch (error) {
            const dbError = new IndexedDBError(
              '投稿データの処理中にエラーが発生しました',
              'getAllPosts',
              error as Error
            );
            this.log('error', 'データ処理エラー', dbError);
            reject(dbError);
          }
        };

        transaction.onerror = () => {
          const error = new IndexedDBError(
            'トランザクションエラーが発生しました',
            'getAllPosts',
            transaction.error || undefined
          );
          this.log('error', 'トランザクションエラー', error);
          reject(error);
        };
      });
    } catch (error) {
      this.log('error', '投稿一覧取得処理でエラーが発生しました', error);
      if (error instanceof IndexedDBError) {
        throw error;
      }
      throw new IndexedDBError(
        '投稿一覧の取得中に予期しないエラーが発生しました',
        'getAllPosts',
        error as Error
      );
    }
  }

  async getPostsByDateRange(start: Date, end: Date): Promise<Post[]> {
    try {
      // バリデーション
      if (!start || !end) {
        throw new IndexedDBError(
          '開始日時と終了日時が必要です',
          'getPostsByDateRange'
        );
      }

      if (start > end) {
        throw new IndexedDBError(
          '開始日時は終了日時より前である必要があります',
          'getPostsByDateRange'
        );
      }

      this.log('debug', '日付範囲で投稿を取得中', { 
        start: start.toISOString(), 
        end: end.toISOString() 
      });

      const allPosts = await this.getAllPosts();
      const filteredPosts = allPosts.filter(post => 
        post.createdAt >= start && post.createdAt <= end
      );

      this.log('info', `日付範囲で${filteredPosts.length}件の投稿を取得しました`, {
        start: start.toISOString(),
        end: end.toISOString(),
        count: filteredPosts.length
      });

      return filteredPosts;
    } catch (error) {
      this.log('error', '日付範囲投稿取得処理でエラーが発生しました', error);
      if (error instanceof IndexedDBError) {
        throw error;
      }
      throw new IndexedDBError(
        '日付範囲での投稿取得中に予期しないエラーが発生しました',
        'getPostsByDateRange',
        error as Error
      );
    }
  }

  subscribeToUpdates(_callback: (posts: Post[]) => void): () => void {
    // フェーズ1では実装なし（フェーズ2でSupabaseリアルタイム更新用）
    this.log('debug', 'subscribeToUpdatesが呼び出されました（フェーズ1では未実装）');
    return () => {};
  }

  /**
   * データベース接続を閉じる
   */
  async close(): Promise<void> {
    if (this.db) {
      this.log('info', 'データベース接続を閉じています');
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
    }
  }

  /**
   * データベースの状態を取得
   */
  getStatus(): { isInitialized: boolean; isConnected: boolean } {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.db !== null
    };
  }

  /**
   * データベースの統計情報を取得
   */
  async getStats(): Promise<{ totalPosts: number; oldestPost?: Date; newestPost?: Date }> {
    try {
      const posts = await this.getAllPosts();
      
      if (posts.length === 0) {
        return { totalPosts: 0 };
      }

      // 投稿は既に新しい順にソートされている
      const newestPost = posts[0].createdAt;
      const oldestPost = posts[posts.length - 1].createdAt;

      const stats = {
        totalPosts: posts.length,
        oldestPost,
        newestPost
      };

      this.log('info', 'データベース統計情報を取得しました', stats);
      return stats;
    } catch (error) {
      this.log('error', '統計情報取得でエラーが発生しました', error);
      throw new IndexedDBError(
        'データベース統計情報の取得に失敗しました',
        'getStats',
        error as Error
      );
    }
  }
}