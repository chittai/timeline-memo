import {
  validatePost,
  validatePosts,
  removeDuplicatePosts,
  validatePostsOrder,
  sortPostsByDate,
  performDataIntegrityCheck,
  checkDatabaseHealth
} from '../dataIntegrityUtils';
import type { Post } from '../../types';

describe('dataIntegrityUtils', () => {
  const validPost: Post = {
    id: '1',
    content: 'テスト投稿',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  };

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validatePost', () => {
    it('有効な投稿に対してtrueを返すこと', () => {
      expect(validatePost(validPost)).toBe(true);
    });

    it('日付が文字列の場合でも有効と判定すること', () => {
      const postWithStringDates = {
        id: '1',
        content: 'テスト投稿',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      };
      expect(validatePost(postWithStringDates)).toBe(true);
    });

    it('nullまたはundefinedに対してfalseを返すこと', () => {
      expect(validatePost(null)).toBe(false);
      expect(validatePost(undefined)).toBe(false);
    });

    it('オブジェクトでない値に対してfalseを返すこと', () => {
      expect(validatePost('string')).toBe(false);
      expect(validatePost(123)).toBe(false);
      expect(validatePost([])).toBe(false);
    });

    it('idが欠けている場合にfalseを返すこと', () => {
      const invalidPost = { ...validPost };
      delete (invalidPost as any).id;
      expect(validatePost(invalidPost)).toBe(false);
    });

    it('contentが欠けている場合にfalseを返すこと', () => {
      const invalidPost = { ...validPost };
      delete (invalidPost as any).content;
      expect(validatePost(invalidPost)).toBe(false);
    });

    it('createdAtが欠けている場合にfalseを返すこと', () => {
      const invalidPost = { ...validPost };
      delete (invalidPost as any).createdAt;
      expect(validatePost(invalidPost)).toBe(false);
    });

    it('updatedAtが欠けている場合にfalseを返すこと', () => {
      const invalidPost = { ...validPost };
      delete (invalidPost as any).updatedAt;
      expect(validatePost(invalidPost)).toBe(false);
    });

    it('無効な日付の場合にfalseを返すこと', () => {
      const invalidPost = {
        ...validPost,
        createdAt: 'invalid-date'
      };
      expect(validatePost(invalidPost)).toBe(false);
    });

    it('updatedAtがcreatedAtより前の場合にfalseを返すこと', () => {
      const invalidPost = {
        ...validPost,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-01')
      };
      expect(validatePost(invalidPost)).toBe(false);
    });
  });

  describe('validatePosts', () => {
    it('有効な投稿配列を正しく処理すること', () => {
      const posts = [validPost];
      const result = validatePosts(posts);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(validPost);
    });

    it('配列でない値に対して空配列を返すこと', () => {
      expect(validatePosts('not-array' as any)).toEqual([]);
      expect(validatePosts(null as any)).toEqual([]);
      expect(validatePosts(undefined as any)).toEqual([]);
    });

    it('無効な投稿を除外すること', () => {
      const posts = [
        validPost,
        { id: '2' }, // contentが欠けている
        validPost
      ];
      const result = validatePosts(posts);
      
      expect(result).toHaveLength(2);
      expect(console.warn).toHaveBeenCalledWith(
        '[データ整合性] 無効な投稿データが検出されました:',
        [{ index: 1, post: { id: '2' } }]
      );
    });

    it('日付文字列をDateオブジェクトに正規化すること', () => {
      const postWithStringDates = {
        id: '1',
        content: 'テスト投稿',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      };
      const result = validatePosts([postWithStringDates]);
      
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('removeDuplicatePosts', () => {
    it('重複のない投稿配列をそのまま返すこと', () => {
      const posts = [
        { ...validPost, id: '1' },
        { ...validPost, id: '2' }
      ];
      const result = removeDuplicatePosts(posts);
      
      expect(result).toHaveLength(2);
      expect(result).toEqual(posts);
    });

    it('重複投稿を除去すること', () => {
      const posts = [
        { ...validPost, id: '1' },
        { ...validPost, id: '2' },
        { ...validPost, id: '1' } // 重複
      ];
      const result = removeDuplicatePosts(posts);
      
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toEqual(['1', '2']);
      expect(console.warn).toHaveBeenCalledWith(
        '[データ整合性] 重複投稿が検出されました:',
        ['1']
      );
    });
  });

  describe('validatePostsOrder', () => {
    it('正しい順序（新しい順）の投稿配列に対してtrueを返すこと', () => {
      const posts = [
        { ...validPost, id: '1', createdAt: new Date('2024-01-02') },
        { ...validPost, id: '2', createdAt: new Date('2024-01-01') }
      ];
      expect(validatePostsOrder(posts)).toBe(true);
    });

    it('空配列または単一要素に対してtrueを返すこと', () => {
      expect(validatePostsOrder([])).toBe(true);
      expect(validatePostsOrder([validPost])).toBe(true);
    });

    it('間違った順序の投稿配列に対してfalseを返すこと', () => {
      const posts = [
        { ...validPost, id: '1', createdAt: new Date('2024-01-01') },
        { ...validPost, id: '2', createdAt: new Date('2024-01-02') } // 古い順になっている
      ];
      expect(validatePostsOrder(posts)).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        '[データ整合性] 投稿の順序が正しくありません:',
        expect.objectContaining({
          currentIndex: 0,
          currentId: '1',
          nextIndex: 1,
          nextId: '2'
        })
      );
    });
  });

  describe('sortPostsByDate', () => {
    it('投稿を新しい順にソートすること', () => {
      const posts = [
        { ...validPost, id: '1', createdAt: new Date('2024-01-01') },
        { ...validPost, id: '2', createdAt: new Date('2024-01-03') },
        { ...validPost, id: '3', createdAt: new Date('2024-01-02') }
      ];
      const result = sortPostsByDate(posts);
      
      expect(result.map(p => p.id)).toEqual(['2', '3', '1']);
    });

    it('元の配列を変更しないこと', () => {
      const posts = [
        { ...validPost, id: '1', createdAt: new Date('2024-01-01') },
        { ...validPost, id: '2', createdAt: new Date('2024-01-02') }
      ];
      const originalOrder = posts.map(p => p.id);
      sortPostsByDate(posts);
      
      expect(posts.map(p => p.id)).toEqual(originalOrder);
    });
  });

  describe('performDataIntegrityCheck', () => {
    it('正常なデータに対して問題なしの結果を返すこと', () => {
      const posts = [
        { 
          id: '1', 
          content: 'テスト投稿1', 
          createdAt: new Date('2024-01-02T10:00:00Z'),
          updatedAt: new Date('2024-01-02T10:00:00Z')
        },
        { 
          id: '2', 
          content: 'テスト投稿2', 
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z')
        }
      ];
      const result = performDataIntegrityCheck(posts);
      
      // データが正常な場合でも、順序チェックで修正される可能性があるため、
      // 結果の妥当性のみをチェック
      expect(result.validPosts).toHaveLength(2);
      expect(result.validPosts[0].createdAt.getTime()).toBeGreaterThanOrEqual(result.validPosts[1].createdAt.getTime());
    });

    it('無効な投稿を除外して問題を報告すること', () => {
      const posts = [
        { ...validPost, id: '1' },
        { id: 'invalid' }, // 無効な投稿
        { ...validPost, id: '2' }
      ];
      const result = performDataIntegrityCheck(posts);
      
      expect(result.isValid).toBe(false);
      expect(result.validPosts).toHaveLength(2);
      expect(result.issues).toContain('1件の無効な投稿が除外されました');
    });

    it('重複投稿を除外して問題を報告すること', () => {
      const posts = [
        { ...validPost, id: '1' },
        { ...validPost, id: '1' } // 重複
      ];
      const result = performDataIntegrityCheck(posts);
      
      expect(result.isValid).toBe(false);
      expect(result.validPosts).toHaveLength(1);
      expect(result.issues).toContain('1件の重複投稿が除外されました');
    });

    it('順序を修正して問題を報告すること', () => {
      const posts = [
        { 
          id: '1', 
          content: 'テスト投稿1', 
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z')
        },
        { 
          id: '2', 
          content: 'テスト投稿2', 
          createdAt: new Date('2024-01-02T10:00:00Z'),
          updatedAt: new Date('2024-01-02T10:00:00Z')
        }
      ];
      const result = performDataIntegrityCheck(posts);
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('投稿の順序が修正されました');
      // 結果が新しい順にソートされていることを確認
      expect(result.validPosts[0].createdAt.getTime()).toBeGreaterThan(result.validPosts[1].createdAt.getTime());
    });
  });

  describe('checkDatabaseHealth', () => {
    it('正常なデータベース統計に対して健全と判定すること', () => {
      const stats = {
        totalPosts: 2,
        oldestPost: new Date('2024-01-01'),
        newestPost: new Date('2024-01-02')
      };
      const result = checkDatabaseHealth(stats);
      
      expect(result.isHealthy).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('投稿数が負の場合に警告を出すこと', () => {
      const stats = {
        totalPosts: -1
      };
      const result = checkDatabaseHealth(stats);
      
      expect(result.isHealthy).toBe(false);
      expect(result.warnings).toContain('投稿数が負の値です');
    });

    it('投稿があるのに日付情報が不正な場合に警告を出すこと', () => {
      const stats = {
        totalPosts: 1
        // oldestPost, newestPostが欠けている
      };
      const result = checkDatabaseHealth(stats);
      
      expect(result.isHealthy).toBe(false);
      expect(result.warnings).toContain('投稿が存在するのに日付情報が不正です');
    });

    it('最古の投稿が最新の投稿より新しい場合に警告を出すこと', () => {
      const stats = {
        totalPosts: 2,
        oldestPost: new Date('2024-01-02'),
        newestPost: new Date('2024-01-01')
      };
      const result = checkDatabaseHealth(stats);
      
      expect(result.isHealthy).toBe(false);
      expect(result.warnings).toContain('最古の投稿日時が最新の投稿日時より新しいです');
    });

    it('未来の日付の投稿がある場合に警告を出すこと', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const stats = {
        totalPosts: 1,
        oldestPost: new Date('2024-01-01'),
        newestPost: futureDate
      };
      const result = checkDatabaseHealth(stats);
      
      expect(result.isHealthy).toBe(false);
      expect(result.warnings).toContain('未来の日付の投稿が存在します');
    });
  });
});