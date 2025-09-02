import { renderHook } from '@testing-library/react';
import { useTimeline } from '../useTimeline';
import type { Post } from '../../types';

// テスト用のモックデータ
const mockPosts: Post[] = [
  {
    id: 'post-1',
    content: '最初の投稿',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: 'post-2',
    content: '2番目の投稿',
    createdAt: new Date('2024-01-01T10:30:00Z'),
    updatedAt: new Date('2024-01-01T10:30:00Z')
  },
  {
    id: 'post-3',
    content: '3番目の投稿',
    createdAt: new Date('2024-01-01T11:00:00Z'),
    updatedAt: new Date('2024-01-01T11:00:00Z')
  }
];

describe('useTimeline', () => {
  test('投稿がない場合、デフォルトの24時間範囲を返す', () => {
    const { result } = renderHook(() => useTimeline([]));
    
    const { timelineData } = result.current;
    
    expect(timelineData.posts).toEqual([]);
    expect(timelineData.timeRange.end.getTime() - timelineData.timeRange.start.getTime())
      .toBe(24 * 60 * 60 * 1000); // 24時間
  });

  test('投稿がある場合、適切な時間範囲を計算する', () => {
    const { result } = renderHook(() => useTimeline(mockPosts));
    
    const { timelineData } = result.current;
    
    expect(timelineData.posts).toHaveLength(3);
    expect(timelineData.timeRange.start).toEqual(new Date('2024-01-01T10:00:00Z'));
    expect(timelineData.timeRange.end).toEqual(new Date('2024-01-01T11:00:00Z'));
  });

  test('投稿の時間範囲が1時間未満の場合、最小1時間の範囲に調整される', () => {
    const shortRangePosts: Post[] = [
      {
        id: 'post-1',
        content: '投稿1',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: 'post-2',
        content: '投稿2',
        createdAt: new Date('2024-01-01T10:10:00Z'), // 10分後
        updatedAt: new Date('2024-01-01T10:10:00Z')
      }
    ];

    const { result } = renderHook(() => useTimeline(shortRangePosts));
    
    const { timelineData } = result.current;
    const range = timelineData.timeRange.end.getTime() - timelineData.timeRange.start.getTime();
    
    expect(range).toBe(60 * 60 * 1000); // 1時間
  });

  test('時間軸マーカーが正しく生成される', () => {
    const { result } = renderHook(() => useTimeline(mockPosts));
    
    const { timelineMarkers } = result.current;
    
    expect(timelineMarkers).toHaveLength(3);
    expect(timelineMarkers[0].postIds).toEqual(['post-1']);
    expect(timelineMarkers[1].postIds).toEqual(['post-2']);
    expect(timelineMarkers[2].postIds).toEqual(['post-3']);
    
    // 位置が0-100%の範囲内であることを確認
    timelineMarkers.forEach(marker => {
      expect(marker.position).toBeGreaterThanOrEqual(0);
      expect(marker.position).toBeLessThanOrEqual(100);
    });
  });

  test('同じ時間帯の投稿がグループ化される', () => {
    const samePeriodPosts: Post[] = [
      {
        id: 'post-1',
        content: '投稿1',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: 'post-2',
        content: '投稿2',
        createdAt: new Date('2024-01-01T10:02:00Z'), // 2分後（5分以内）
        updatedAt: new Date('2024-01-01T10:02:00Z')
      },
      {
        id: 'post-3',
        content: '投稿3',
        createdAt: new Date('2024-01-01T10:10:00Z'), // 10分後（別グループ）
        updatedAt: new Date('2024-01-01T10:10:00Z')
      }
    ];

    const { result } = renderHook(() => useTimeline(samePeriodPosts));
    
    const { timelineMarkers } = result.current;
    
    expect(timelineMarkers).toHaveLength(2);
    expect(timelineMarkers[0].postIds).toEqual(['post-1', 'post-2']);
    expect(timelineMarkers[1].postIds).toEqual(['post-3']);
  });

  test('getMarkerPositionForPost が正しい位置を返す', () => {
    const { result } = renderHook(() => useTimeline(mockPosts));
    
    const { getMarkerPositionForPost } = result.current;
    
    const position1 = getMarkerPositionForPost('post-1');
    const position2 = getMarkerPositionForPost('post-2');
    const position3 = getMarkerPositionForPost('post-3');
    const positionNotFound = getMarkerPositionForPost('non-existent');
    
    expect(position1).toBe(0); // 最初の投稿は0%
    expect(position2).toBe(50); // 中間の投稿は50%
    expect(position3).toBe(100); // 最後の投稿は100%
    expect(positionNotFound).toBeNull();
  });

  test('getNearestMarker が最も近いマーカーを返す', () => {
    const { result } = renderHook(() => useTimeline(mockPosts));
    
    const { getNearestMarker } = result.current;
    
    const nearestTo25 = getNearestMarker(25);
    const nearestTo75 = getNearestMarker(75);
    
    expect(nearestTo25?.postIds).toEqual(['post-1']); // 0%に最も近い
    expect(nearestTo75?.postIds).toEqual(['post-2']); // 50%に最も近い（75%は50%と100%の中間で、50%の方が近い）
  });

  test('getTimeLabels が適切な時間ラベルを生成する', () => {
    const { result } = renderHook(() => useTimeline(mockPosts));
    
    const { getTimeLabels } = result.current;
    
    const labels = getTimeLabels(4); // 5つのラベル（0, 25, 50, 75, 100%）
    
    expect(labels).toHaveLength(5);
    expect(labels[0].position).toBe(0);
    expect(labels[4].position).toBe(100);
    
    // ラベルが時間形式であることを確認
    labels.forEach(label => {
      expect(label.label).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});