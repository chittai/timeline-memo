import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiaryService } from '../DiaryService';
import type { DataService, Post } from '../../types';

// モックのDataService
class MockDataService implements DataService {
  private posts: Post[] = [];

  async createPost(content: string): Promise<Post> {
    const post: Post = {
      id: `post-${Date.now()}`,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.posts.push(post);
    return post;
  }

  async updatePost(id: string, content: string): Promise<Post> {
    const post = this.posts.find(p => p.id === id);
    if (!post) throw new Error('投稿が見つかりません');
    post.content = content;
    post.updatedAt = new Date();
    return post;
  }

  async deletePost(id: string): Promise<void> {
    const index = this.posts.findIndex(p => p.id === id);
    if (index === -1) throw new Error('投稿が見つかりません');
    this.posts.splice(index, 1);
  }

  async getPost(id: string): Promise<Post | null> {
    return this.posts.find(p => p.id === id) || null;
  }

  async getAllPosts(): Promise<Post[]> {
    return [...this.posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPostsByDateRange(start: Date, end: Date): Promise<Post[]> {
    return this.posts.filter(post => 
      post.createdAt >= start && post.createdAt <= end
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  subscribeToUpdates(_callback: (posts: Post[]) => void): () => void {
    return () => {};
  }

  // テスト用のヘルパーメソッド
  setPosts(posts: Post[]): void {
    this.posts = posts;
  }

  clear(): void {
    this.posts = [];
  }
}

describe('DiaryService', () => {
  let diaryService: DiaryService;
  let mockDataService: MockDataService;

  beforeEach(() => {
    mockDataService = new MockDataService();
    diaryService = new DiaryService(mockDataService);
  });

  describe('getEntriesByDateRange', () => {
    it('指定した日付範囲の日記エントリーを正しく取得できる', async () => {
      // テストデータの準備
      const posts: Post[] = [
        {
          id: '1',
          content: '今日の投稿1',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: '2',
          content: '今日の投稿2',
          createdAt: new Date('2024-01-15T14:00:00Z'),
          updatedAt: new Date('2024-01-15T14:00:00Z')
        },
        {
          id: '3',
          content: '昨日の投稿',
          createdAt: new Date('2024-01-14T12:00:00Z'),
          updatedAt: new Date('2024-01-14T12:00:00Z')
        }
      ];
      mockDataService.setPosts(posts);

      const start = new Date('2024-01-14T00:00:00Z');
      const end = new Date('2024-01-15T23:59:59Z');

      const entries = await diaryService.getEntriesByDateRange(start, end);

      expect(entries).toHaveLength(2);
      expect(entries[0].date).toBe('2024-01-15');
      expect(entries[0].postCount).toBe(2);
      expect(entries[1].date).toBe('2024-01-14');
      expect(entries[1].postCount).toBe(1);
    });

    it('開始日が終了日より後の場合は日付を修正して結果を返す', async () => {
      const start = new Date('2024-01-15T00:00:00Z');
      const end = new Date('2024-01-14T00:00:00Z');

      // エラーハンドリングにより、日付が修正されて空の配列が返される
      const entries = await diaryService.getEntriesByDateRange(start, end);
      expect(Array.isArray(entries)).toBe(true);
    });

    it('投稿がない場合は空の配列を返す', async () => {
      const start = new Date('2024-01-14T00:00:00Z');
      const end = new Date('2024-01-15T23:59:59Z');

      const entries = await diaryService.getEntriesByDateRange(start, end);

      expect(entries).toHaveLength(0);
    });
  });

  describe('getEntryByDate', () => {
    it('指定した日付の日記エントリーを正しく取得できる', async () => {
      const posts: Post[] = [
        {
          id: '1',
          content: '今日の投稿1',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: '2',
          content: '今日の投稿2',
          createdAt: new Date('2024-01-15T14:00:00Z'),
          updatedAt: new Date('2024-01-15T14:00:00Z')
        }
      ];
      mockDataService.setPosts(posts);

      const targetDate = new Date('2024-01-15');
      const entry = await diaryService.getEntryByDate(targetDate);

      expect(entry).not.toBeNull();
      expect(entry!.date).toBe('2024-01-15');
      expect(entry!.postCount).toBe(2);
      expect(entry!.posts).toHaveLength(2);
      // 新しい投稿が先に来ることを確認
      expect(entry!.posts[0].id).toBe('2');
      expect(entry!.posts[1].id).toBe('1');
    });

    it('投稿がない日の場合はnullを返す', async () => {
      const targetDate = new Date('2024-01-15');
      const entry = await diaryService.getEntryByDate(targetDate);

      expect(entry).toBeNull();
    });
  });

  describe('getCalendarData', () => {
    it('指定した年月のカレンダーデータを正しく生成できる', async () => {
      const posts: Post[] = [
        {
          id: '1',
          content: '1月15日の投稿',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: '2',
          content: '1月20日の投稿',
          createdAt: new Date('2024-01-20T10:00:00Z'),
          updatedAt: new Date('2024-01-20T10:00:00Z')
        }
      ];
      mockDataService.setPosts(posts);

      const calendarData = await diaryService.getCalendarData(2024, 1);

      expect(calendarData).toHaveLength(31); // 1月は31日
      

      // 投稿がある日をチェック
      const day15 = calendarData.find(day => day.date.getDate() === 15 && day.date.getMonth() === 0);
      expect(day15?.hasPost).toBe(true);
      expect(day15?.postCount).toBe(1);

      const day20 = calendarData.find(day => day.date.getDate() === 20 && day.date.getMonth() === 0);
      expect(day20?.hasPost).toBe(true);
      expect(day20?.postCount).toBe(1);

      // 投稿がない日をチェック
      const day1 = calendarData.find(day => day.date.getDate() === 1 && day.date.getMonth() === 0);
      expect(day1?.hasPost).toBe(false);
      expect(day1?.postCount).toBe(0);
    });

    it('無効な月が指定された場合はフォールバックデータを返す', async () => {
      // エラーハンドリングにより、フォールバックデータが返される
      const calendarData1 = await diaryService.getCalendarData(2024, 0);
      expect(Array.isArray(calendarData1)).toBe(true);
      expect(calendarData1.length).toBeGreaterThan(0);

      const calendarData2 = await diaryService.getCalendarData(2024, 13);
      expect(Array.isArray(calendarData2)).toBe(true);
      expect(calendarData2.length).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    it('統計情報を正しく計算できる', async () => {
      const posts: Post[] = [
        {
          id: '1',
          content: '今月の投稿1',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: '2',
          content: '今月の投稿2',
          createdAt: new Date('2024-01-16T10:00:00Z'),
          updatedAt: new Date('2024-01-16T10:00:00Z')
        },
        {
          id: '3',
          content: '先月の投稿',
          createdAt: new Date('2023-12-15T10:00:00Z'),
          updatedAt: new Date('2023-12-15T10:00:00Z')
        }
      ];
      mockDataService.setPosts(posts);

      // 現在の日付を2024年1月にモック
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-20T10:00:00Z'));

      const stats = await diaryService.getStats();

      expect(stats.totalPosts).toBe(3);
      expect(stats.totalDays).toBe(3); // 3つの異なる日
      expect(stats.thisMonthPosts).toBe(2); // 1月の投稿は2つ
      expect(stats.averagePostsPerDay).toBe(1); // 3投稿 / 3日 = 1

      vi.useRealTimers();
    });

    it('投稿がない場合は全て0を返す', async () => {
      const stats = await diaryService.getStats();

      expect(stats.totalPosts).toBe(0);
      expect(stats.totalDays).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(0);
      expect(stats.thisMonthPosts).toBe(0);
      expect(stats.averagePostsPerDay).toBe(0);
    });
  });

  describe('calculateStreak', () => {
    it('連続投稿日数を正しく計算できる', () => {
      // 現在の日付を2024年1月20日にモック
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-20T10:00:00Z'));

      const posts: Post[] = [
        {
          id: '1',
          content: '今日の投稿',
          createdAt: new Date('2024-01-20T10:00:00Z'),
          updatedAt: new Date('2024-01-20T10:00:00Z')
        },
        {
          id: '2',
          content: '昨日の投稿',
          createdAt: new Date('2024-01-19T10:00:00Z'),
          updatedAt: new Date('2024-01-19T10:00:00Z')
        },
        {
          id: '3',
          content: '一昨日の投稿',
          createdAt: new Date('2024-01-18T10:00:00Z'),
          updatedAt: new Date('2024-01-18T10:00:00Z')
        },
        {
          id: '4',
          content: '1週間前の投稿',
          createdAt: new Date('2024-01-10T10:00:00Z'),
          updatedAt: new Date('2024-01-10T10:00:00Z')
        }
      ];

      const { current, longest } = diaryService.calculateStreak(posts);

      expect(current).toBe(3); // 1/18, 1/19, 1/20の3日連続
      expect(longest).toBe(3); // 最長も3日

      vi.useRealTimers();
    });

    it('投稿がない場合は0を返す', () => {
      const { current, longest } = diaryService.calculateStreak([]);

      expect(current).toBe(0);
      expect(longest).toBe(0);
    });

    it('今日投稿がない場合は現在の継続日数は0', () => {
      // 現在の日付を2024年1月20日にモック
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-20T10:00:00Z'));

      const posts: Post[] = [
        {
          id: '1',
          content: '2日前の投稿',
          createdAt: new Date('2024-01-18T10:00:00Z'),
          updatedAt: new Date('2024-01-18T10:00:00Z')
        }
      ];

      const { current, longest } = diaryService.calculateStreak(posts);

      expect(current).toBe(0); // 今日投稿がないので0
      expect(longest).toBe(1); // 最長は1日

      vi.useRealTimers();
    });
  });
});