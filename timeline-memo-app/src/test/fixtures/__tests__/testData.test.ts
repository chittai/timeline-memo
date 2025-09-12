import { describe, it, expect } from 'vitest';
import {
  createMockPost,
  createMockPosts,
  createMockPostsInDateRange,
  createMockDiaryEntry,
  createMockDiaryEntries,
  createMockCalendarDay,
  createMockCalendarMonth,
  createMockDiaryStats,
  createMockMotivationMessage,
  createMockToast,
  createMockLoadingState,
  createMockTimelineMarker,
  createMockAppState,
  createEmptyMockAppState,
  createErrorMockAppState,
  createLoadingMockAppState
} from '../testData';

describe('testData', () => {
  describe('createMockPost', () => {
    it('デフォルトのPostデータを生成する', () => {
      const post = createMockPost();
      
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('content');
      expect(post).toHaveProperty('createdAt');
      expect(post).toHaveProperty('updatedAt');
      expect(post).toHaveProperty('tags');
      expect(typeof post.id).toBe('string');
      expect(typeof post.content).toBe('string');
      expect(post.createdAt).toBeInstanceOf(Date);
      expect(post.updatedAt).toBeInstanceOf(Date);
      expect(Array.isArray(post.tags)).toBe(true);
    });

    it('オーバーライドされた値でPostデータを生成する', () => {
      const customContent = 'カスタム投稿内容';
      const post = createMockPost({ content: customContent });
      
      expect(post.content).toBe(customContent);
    });
  });

  describe('createMockPosts', () => {
    it('指定された数のPostデータを生成する', () => {
      const posts = createMockPosts(3);
      
      expect(posts).toHaveLength(3);
      posts.forEach((post, index) => {
        expect(post.content).toBe(`テスト投稿 ${index + 1}`);
      });
    });

    it('時系列順にPostデータを生成する', () => {
      const posts = createMockPosts(3);
      
      // 新しい投稿が先頭に来る（時間が新しい順）
      expect(posts[0].createdAt.getTime()).toBeGreaterThan(posts[1].createdAt.getTime());
      expect(posts[1].createdAt.getTime()).toBeGreaterThan(posts[2].createdAt.getTime());
    });
  });

  describe('createMockPostsInDateRange', () => {
    it('指定された日付範囲内のPostデータを生成する', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03');
      const posts = createMockPostsInDateRange(startDate, endDate, 2);
      
      expect(posts).toHaveLength(6); // 3日間 × 2投稿/日
      
      posts.forEach(post => {
        expect(post.createdAt.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(post.createdAt.getTime()).toBeLessThanOrEqual(endDate.getTime() + 24 * 60 * 60 * 1000);
      });
    });
  });

  describe('createMockDiaryEntry', () => {
    it('デフォルトのDiaryEntryデータを生成する', () => {
      const entry = createMockDiaryEntry();
      
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('posts');
      expect(entry).toHaveProperty('postCount');
      expect(typeof entry.date).toBe('string');
      expect(Array.isArray(entry.posts)).toBe(true);
      expect(entry.postCount).toBe(entry.posts.length);
    });
  });

  describe('createMockDiaryEntries', () => {
    it('指定された日数分のDiaryEntryデータを生成する', () => {
      const entries = createMockDiaryEntries(5);
      
      expect(entries).toHaveLength(5);
      entries.forEach(entry => {
        expect(entry.postCount).toBeGreaterThan(0);
        expect(entry.posts).toHaveLength(entry.postCount);
      });
    });
  });

  describe('createMockCalendarDay', () => {
    it('デフォルトのCalendarDayデータを生成する', () => {
      const calendarDay = createMockCalendarDay();
      
      expect(calendarDay).toHaveProperty('date');
      expect(calendarDay).toHaveProperty('hasPost');
      expect(calendarDay).toHaveProperty('postCount');
      expect(calendarDay).toHaveProperty('isToday');
      expect(calendarDay).toHaveProperty('isSelected');
      expect(calendarDay.date).toBeInstanceOf(Date);
      expect(typeof calendarDay.hasPost).toBe('boolean');
      expect(typeof calendarDay.postCount).toBe('number');
    });
  });

  describe('createMockCalendarMonth', () => {
    it('指定された月のカレンダーデータを生成する', () => {
      const calendarData = createMockCalendarMonth(2024, 1); // 2024年1月
      
      expect(calendarData).toHaveLength(31); // 1月は31日
      calendarData.forEach(day => {
        expect(day.date.getFullYear()).toBe(2024);
        expect(day.date.getMonth()).toBe(0); // 0-indexed
      });
    });
  });

  describe('createMockDiaryStats', () => {
    it('デフォルトのDiaryStatsデータを生成する', () => {
      const stats = createMockDiaryStats();
      
      expect(stats).toHaveProperty('totalPosts');
      expect(stats).toHaveProperty('totalDays');
      expect(stats).toHaveProperty('currentStreak');
      expect(stats).toHaveProperty('longestStreak');
      expect(stats).toHaveProperty('thisMonthPosts');
      expect(stats).toHaveProperty('averagePostsPerDay');
      expect(typeof stats.totalPosts).toBe('number');
      expect(typeof stats.averagePostsPerDay).toBe('number');
    });
  });

  describe('createMockAppState', () => {
    it('完全なAppStateデータを生成する', () => {
      const appState = createMockAppState();
      
      expect(appState).toHaveProperty('posts');
      expect(appState).toHaveProperty('selectedPostId');
      expect(appState).toHaveProperty('loading');
      expect(appState).toHaveProperty('error');
      expect(appState).toHaveProperty('viewMode');
      expect(appState).toHaveProperty('diaryEntries');
      expect(appState).toHaveProperty('calendarData');
      expect(appState).toHaveProperty('diaryStats');
      expect(Array.isArray(appState.posts)).toBe(true);
      expect(Array.isArray(appState.diaryEntries)).toBe(true);
      expect(Array.isArray(appState.calendarData)).toBe(true);
    });
  });

  describe('createEmptyMockAppState', () => {
    it('空状態のAppStateデータを生成する', () => {
      const appState = createEmptyMockAppState();
      
      expect(appState.posts).toHaveLength(0);
      expect(appState.diaryEntries).toHaveLength(0);
      expect(appState.calendarData).toHaveLength(0);
      expect(appState.diaryStats?.totalPosts).toBe(0);
    });
  });

  describe('createErrorMockAppState', () => {
    it('エラー状態のAppStateデータを生成する', () => {
      const errorMessage = 'テストエラー';
      const appState = createErrorMockAppState(errorMessage);
      
      expect(appState.error).toBe(errorMessage);
      expect(appState.loading.isLoading).toBe(false);
    });
  });

  describe('createLoadingMockAppState', () => {
    it('ローディング状態のAppStateデータを生成する', () => {
      const operation = 'データ読み込み中';
      const appState = createLoadingMockAppState(operation);
      
      expect(appState.loading.isLoading).toBe(true);
      expect(appState.loading.operation).toBe(operation);
    });
  });
});