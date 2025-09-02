import {
  calculateTimeRange,
  generateTimelineMarkers,
  generateTimeLabels,
  isCurrentTimeInRange,
  getCurrentTimePosition,
  optimizeMarkerPositions
} from '../timelineUtils';
import type { Post } from '../../types';

// モックデータ
const mockPosts: Post[] = [
  {
    id: '1',
    content: 'テスト投稿1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: '2',
    content: 'テスト投稿2',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z'),
  },
  {
    id: '3',
    content: 'テスト投稿3',
    createdAt: new Date('2024-01-01T14:00:00Z'),
    updatedAt: new Date('2024-01-01T14:00:00Z'),
  },
];

describe('timelineUtils', () => {
  describe('calculateTimeRange', () => {
    test('投稿がない場合、過去24時間の範囲を返す', () => {
      const result = calculateTimeRange([]);
      const now = new Date();
      const expectedStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // 時間の差が1分以内であることを確認（実行時間の誤差を考慮）
      expect(Math.abs(result.end.getTime() - now.getTime())).toBeLessThan(60000);
      expect(Math.abs(result.start.getTime() - expectedStart.getTime())).toBeLessThan(60000);
    });

    test('投稿がある場合、最古から最新までの範囲を返す', () => {
      const result = calculateTimeRange(mockPosts);
      
      // 5%のパディングを考慮した範囲
      const minTime = new Date('2024-01-01T10:00:00Z').getTime();
      const maxTime = new Date('2024-01-01T14:00:00Z').getTime();
      const actualRange = maxTime - minTime;
      const padding = actualRange * 0.05;
      
      expect(result.start.getTime()).toBe(minTime - padding);
      expect(result.end.getTime()).toBe(maxTime + padding);
    });

    test('投稿の時間範囲が1時間未満の場合、最小1時間の範囲を返す', () => {
      const closePosts: Post[] = [
        {
          id: '1',
          content: 'テスト投稿1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          content: 'テスト投稿2',
          createdAt: new Date('2024-01-01T10:30:00Z'),
          updatedAt: new Date('2024-01-01T10:30:00Z'),
        },
      ];

      const result = calculateTimeRange(closePosts);
      const rangeInMs = result.end.getTime() - result.start.getTime();
      
      // 1時間（3600000ms）の範囲であることを確認
      expect(rangeInMs).toBe(60 * 60 * 1000);
    });
  });

  describe('generateTimelineMarkers', () => {
    test('投稿がない場合、空の配列を返す', () => {
      const timeRange = {
        start: new Date('2024-01-01T08:00:00Z'),
        end: new Date('2024-01-01T16:00:00Z'),
      };
      
      const result = generateTimelineMarkers([], timeRange);
      expect(result).toEqual([]);
    });

    test('投稿がある場合、適切なマーカーデータを生成する', () => {
      const timeRange = {
        start: new Date('2024-01-01T08:00:00Z'),
        end: new Date('2024-01-01T16:00:00Z'),
      };
      
      const result = generateTimelineMarkers(mockPosts, timeRange);
      
      expect(result).toHaveLength(3);
      expect(result[0].postIds).toEqual(['1']);
      expect(result[1].postIds).toEqual(['2']);
      expect(result[2].postIds).toEqual(['3']);
    });

    test('同じ時間帯の投稿をグループ化する', () => {
      const sameTimePosts: Post[] = [
        {
          id: '1',
          content: 'テスト投稿1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          content: 'テスト投稿2',
          createdAt: new Date('2024-01-01T10:02:00Z'), // 2分後（5分以内）
          updatedAt: new Date('2024-01-01T10:02:00Z'),
        },
      ];

      const timeRange = {
        start: new Date('2024-01-01T08:00:00Z'),
        end: new Date('2024-01-01T16:00:00Z'),
      };
      
      const result = generateTimelineMarkers(sameTimePosts, timeRange);
      
      // 2つの投稿が1つのマーカーにグループ化される
      expect(result).toHaveLength(1);
      expect(result[0].postIds).toEqual(['1', '2']);
    });

    test('時間窓を超える投稿は別々のマーカーになる', () => {
      const separateTimePosts: Post[] = [
        {
          id: '1',
          content: 'テスト投稿1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          content: 'テスト投稿2',
          createdAt: new Date('2024-01-01T10:10:00Z'), // 10分後（5分を超える）
          updatedAt: new Date('2024-01-01T10:10:00Z'),
        },
      ];

      const timeRange = {
        start: new Date('2024-01-01T08:00:00Z'),
        end: new Date('2024-01-01T16:00:00Z'),
      };
      
      const result = generateTimelineMarkers(separateTimePosts, timeRange);
      
      // 2つの投稿が別々のマーカーになる
      expect(result).toHaveLength(2);
      expect(result[0].postIds).toEqual(['1']);
      expect(result[1].postIds).toEqual(['2']);
    });

    test('投稿が時刻順にソートされる', () => {
      const unsortedPosts: Post[] = [
        {
          id: '3',
          content: 'テスト投稿3',
          createdAt: new Date('2024-01-01T14:00:00Z'),
          updatedAt: new Date('2024-01-01T14:00:00Z'),
        },
        {
          id: '1',
          content: 'テスト投稿1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          content: 'テスト投稿2',
          createdAt: new Date('2024-01-01T12:00:00Z'),
          updatedAt: new Date('2024-01-01T12:00:00Z'),
        },
      ];

      const timeRange = {
        start: new Date('2024-01-01T08:00:00Z'),
        end: new Date('2024-01-01T16:00:00Z'),
      };
      
      const result = generateTimelineMarkers(unsortedPosts, timeRange);
      
      // マーカーが時刻順に並んでいることを確認
      expect(result).toHaveLength(3);
      expect(result[0].timestamp.getTime()).toBeLessThan(result[1].timestamp.getTime());
      expect(result[1].timestamp.getTime()).toBeLessThan(result[2].timestamp.getTime());
    });

    test('位置が0-100%の範囲内に制限される', () => {
      const timeRange = {
        start: new Date('2024-01-01T08:00:00Z'),
        end: new Date('2024-01-01T16:00:00Z'),
      };
      
      const result = generateTimelineMarkers(mockPosts, timeRange);
      
      result.forEach(marker => {
        expect(marker.position).toBeGreaterThanOrEqual(0);
        expect(marker.position).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('generateTimeLabels', () => {
    test('短い時間範囲（1時間未満）で15分間隔のラベルを生成する', () => {
      const timeRange = {
        start: new Date('2024-01-01T10:00:00Z'),
        end: new Date('2024-01-01T11:00:00Z'),
      };
      
      const result = generateTimeLabels(timeRange);
      
      expect(result.length).toBeGreaterThan(0);
      // 時間形式のラベルが含まれることを確認
      expect(result[0].label).toMatch(/\d{2}:\d{2}/);
    });

    test('中程度の時間範囲（24時間未満）で1時間間隔のラベルを生成する', () => {
      const timeRange = {
        start: new Date('2024-01-01T08:00:00Z'),
        end: new Date('2024-01-01T16:00:00Z'),
      };
      
      const result = generateTimeLabels(timeRange);
      
      expect(result.length).toBeGreaterThan(0);
      // 時間形式のラベルが含まれることを確認
      expect(result[0].label).toMatch(/\d{2}:\d{2}/);
    });

    test('長い時間範囲（24時間以上）で1日間隔のラベルを生成する', () => {
      const timeRange = {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-05T00:00:00Z'),
      };
      
      const result = generateTimeLabels(timeRange);
      
      expect(result.length).toBeGreaterThan(0);
      // 日付形式のラベルが含まれることを確認
      expect(result[0].label).toMatch(/\d+月\d+日|\w+\d+/);
    });

    test('位置が0-100%の範囲内に制限される', () => {
      const timeRange = {
        start: new Date('2024-01-01T08:00:00Z'),
        end: new Date('2024-01-01T16:00:00Z'),
      };
      
      const result = generateTimeLabels(timeRange);
      
      result.forEach(label => {
        expect(label.position).toBeGreaterThanOrEqual(0);
        expect(label.position).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('isCurrentTimeInRange', () => {
    test('現在時刻が範囲内にある場合、trueを返す', () => {
      const now = new Date();
      const timeRange = {
        start: new Date(now.getTime() - 60 * 60 * 1000), // 1時間前
        end: new Date(now.getTime() + 60 * 60 * 1000),   // 1時間後
      };
      
      const result = isCurrentTimeInRange(timeRange);
      expect(result).toBe(true);
    });

    test('現在時刻が範囲外にある場合、falseを返す', () => {
      const timeRange = {
        start: new Date('2024-01-01T08:00:00Z'),
        end: new Date('2024-01-01T16:00:00Z'),
      };
      
      const result = isCurrentTimeInRange(timeRange);
      expect(result).toBe(false);
    });
  });

  describe('getCurrentTimePosition', () => {
    test('現在時刻の位置を正しく計算する', () => {
      const now = new Date();
      const timeRange = {
        start: new Date(now.getTime() - 60 * 60 * 1000), // 1時間前
        end: new Date(now.getTime() + 60 * 60 * 1000),   // 1時間後
      };
      
      const result = getCurrentTimePosition(timeRange);
      
      // 現在時刻は範囲の中央（50%）付近にあるはず
      expect(result).toBeCloseTo(50, 1);
    });

    test('位置が0-100%の範囲内に制限される', () => {
      const now = new Date();
      const timeRange = {
        start: new Date(now.getTime() + 60 * 60 * 1000), // 1時間後
        end: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2時間後
      };
      
      const result = getCurrentTimePosition(timeRange);
      
      // 現在時刻が範囲外でも0-100%に制限される
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('optimizeMarkerPositions', () => {
    test('マーカーが1つ以下の場合、そのまま返す', () => {
      const markers = [
        {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          postIds: ['1'],
          position: 50
        }
      ];
      
      const result = optimizeMarkerPositions(markers);
      expect(result).toEqual(markers);
    });

    test('重複する位置を最小距離で調整する', () => {
      const markers = [
        {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          postIds: ['1'],
          position: 50
        },
        {
          timestamp: new Date('2024-01-01T10:01:00Z'),
          postIds: ['2'],
          position: 50.5 // 最小距離（2%）未満
        }
      ];
      
      const result = optimizeMarkerPositions(markers, 2);
      
      expect(result[0].position).toBe(50);
      expect(result[1].position).toBe(52); // 50 + 2%
    });

    test('100%を超える場合の調整', () => {
      const markers = [
        {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          postIds: ['1'],
          position: 99
        },
        {
          timestamp: new Date('2024-01-01T10:01:00Z'),
          postIds: ['2'],
          position: 99.5
        }
      ];
      
      const result = optimizeMarkerPositions(markers, 2);
      
      expect(result[1].position).toBe(100);
      expect(result[0].position).toBe(98); // 100 - 2%
    });

    test('位置順にソートされる', () => {
      const markers = [
        {
          timestamp: new Date('2024-01-01T12:00:00Z'),
          postIds: ['2'],
          position: 70
        },
        {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          postIds: ['1'],
          position: 30
        }
      ];
      
      const result = optimizeMarkerPositions(markers);
      
      expect(result[0].position).toBeLessThan(result[1].position);
    });
  });
});