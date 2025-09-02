import {
  getCachedTimeRange,
  setCachedTimeRange,
  getCachedTimelineMarkers,
  setCachedTimelineMarkers,
  clearCache,
  getCacheStats
} from '../performanceCache';
import type { Post, TimelineMarkerData } from '../../types';

// テスト用のモックデータ
const mockPosts: Post[] = [
  {
    id: '1',
    content: 'テスト投稿1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: '2',
    content: 'テスト投稿2',
    createdAt: new Date('2024-01-01T11:00:00Z'),
    updatedAt: new Date('2024-01-01T11:00:00Z')
  }
];

const mockTimeRange = {
  start: new Date('2024-01-01T09:00:00Z'),
  end: new Date('2024-01-01T12:00:00Z')
};

const mockMarkers: TimelineMarkerData[] = [
  {
    timestamp: new Date('2024-01-01T10:00:00Z'),
    postIds: ['1'],
    position: 25
  },
  {
    timestamp: new Date('2024-01-01T11:00:00Z'),
    postIds: ['2'],
    position: 75
  }
];

describe('performanceCache', () => {
  beforeEach(() => {
    // 各テスト前にキャッシュをクリア
    clearCache();
  });

  describe('時間軸範囲のキャッシュ', () => {
    it('時間軸範囲をキャッシュに保存・取得できる', () => {
      // キャッシュに保存
      setCachedTimeRange(mockPosts, mockTimeRange);
      
      // キャッシュから取得
      const cached = getCachedTimeRange(mockPosts);
      
      expect(cached).not.toBeNull();
      expect(cached!.start.getTime()).toBe(mockTimeRange.start.getTime());
      expect(cached!.end.getTime()).toBe(mockTimeRange.end.getTime());
    });

    it('異なる投稿データでは異なるキャッシュキーが生成される', () => {
      const posts1 = [mockPosts[0]];
      const posts2 = [mockPosts[1]];
      
      // 異なる投稿データでキャッシュに保存
      setCachedTimeRange(posts1, mockTimeRange);
      setCachedTimeRange(posts2, { 
        start: new Date('2024-01-02T09:00:00Z'),
        end: new Date('2024-01-02T12:00:00Z')
      });
      
      // それぞれ正しい値が取得される
      const cached1 = getCachedTimeRange(posts1);
      const cached2 = getCachedTimeRange(posts2);
      
      expect(cached1!.start.getTime()).toBe(mockTimeRange.start.getTime());
      expect(cached2!.start.getTime()).toBe(new Date('2024-01-02T09:00:00Z').getTime());
    });

    it('存在しないキャッシュキーではnullが返される', () => {
      const nonExistentPosts: Post[] = [{
        id: 'non-existent',
        content: '存在しない投稿',
        createdAt: new Date(),
        updatedAt: new Date()
      }];
      
      const cached = getCachedTimeRange(nonExistentPosts);
      expect(cached).toBeNull();
    });
  });

  describe('時間軸マーカーのキャッシュ', () => {
    it('時間軸マーカーをキャッシュに保存・取得できる', () => {
      // キャッシュに保存
      setCachedTimelineMarkers(mockPosts, mockTimeRange, mockMarkers);
      
      // キャッシュから取得
      const cached = getCachedTimelineMarkers(mockPosts, mockTimeRange);
      
      expect(cached).not.toBeNull();
      expect(cached).toHaveLength(2);
      expect(cached![0].postIds).toEqual(['1']);
      expect(cached![0].position).toBe(25);
      expect(cached![1].postIds).toEqual(['2']);
      expect(cached![1].position).toBe(75);
    });

    it('異なる時間範囲では異なるキャッシュキーが生成される', () => {
      const timeRange1 = mockTimeRange;
      const timeRange2 = {
        start: new Date('2024-01-02T09:00:00Z'),
        end: new Date('2024-01-02T12:00:00Z')
      };
      
      const markers1 = mockMarkers;
      const markers2: TimelineMarkerData[] = [{
        timestamp: new Date('2024-01-02T10:00:00Z'),
        postIds: ['3'],
        position: 50
      }];
      
      // 異なる時間範囲でキャッシュに保存
      setCachedTimelineMarkers(mockPosts, timeRange1, markers1);
      setCachedTimelineMarkers(mockPosts, timeRange2, markers2);
      
      // それぞれ正しい値が取得される
      const cached1 = getCachedTimelineMarkers(mockPosts, timeRange1);
      const cached2 = getCachedTimelineMarkers(mockPosts, timeRange2);
      
      expect(cached1).toHaveLength(2);
      expect(cached2).toHaveLength(1);
      expect(cached2![0].postIds).toEqual(['3']);
    });
  });

  describe('キャッシュ管理', () => {
    it('キャッシュをクリアできる', () => {
      // キャッシュに保存
      setCachedTimeRange(mockPosts, mockTimeRange);
      setCachedTimelineMarkers(mockPosts, mockTimeRange, mockMarkers);
      
      // キャッシュをクリア
      clearCache();
      
      // キャッシュが空になっている
      const cachedTimeRange = getCachedTimeRange(mockPosts);
      const cachedMarkers = getCachedTimelineMarkers(mockPosts, mockTimeRange);
      
      expect(cachedTimeRange).toBeNull();
      expect(cachedMarkers).toBeNull();
    });

    it('キャッシュ統計情報を取得できる', () => {
      // キャッシュに保存
      setCachedTimeRange(mockPosts, mockTimeRange);
      setCachedTimelineMarkers(mockPosts, mockTimeRange, mockMarkers);
      
      // 統計情報を取得
      const stats = getCacheStats();
      
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.maxSize).toBe(100);
      expect(stats.entries).toBeInstanceOf(Array);
      expect(stats.entries.length).toBeGreaterThan(0);
    });
  });

  describe('TTL（有効期限）', () => {
    it('期限切れのキャッシュは取得できない', async () => {
      // モックタイマーを使用
      jest.useFakeTimers();
      
      // キャッシュに保存
      setCachedTimeRange(mockPosts, mockTimeRange);
      
      // 6分経過（TTLは5分）
      jest.advanceTimersByTime(6 * 60 * 1000);
      
      // 期限切れでnullが返される
      const cached = getCachedTimeRange(mockPosts);
      expect(cached).toBeNull();
      
      jest.useRealTimers();
    });
  });

  describe('空の投稿配列', () => {
    it('空の投稿配列でもキャッシュが機能する', () => {
      const emptyPosts: Post[] = [];
      
      setCachedTimeRange(emptyPosts, mockTimeRange);
      const cached = getCachedTimeRange(emptyPosts);
      
      expect(cached).not.toBeNull();
      expect(cached!.start.getTime()).toBe(mockTimeRange.start.getTime());
    });
  });
});