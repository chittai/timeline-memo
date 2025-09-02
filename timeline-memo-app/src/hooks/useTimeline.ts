import { useMemo } from 'react';
import type { Post, TimelineData, TimelineMarkerData } from '../types';

/**
 * 時間軸関連の計算とデータ処理のためのカスタムフック
 */
export function useTimeline(posts: Post[]) {
  
  // 時間軸データの計算
  const timelineData = useMemo((): TimelineData => {
    if (posts.length === 0) {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return {
        posts: [],
        timeRange: {
          start: oneDayAgo,
          end: now
        }
      };
    }

    // 投稿を日時順にソート（古い順）
    const sortedPosts = [...posts].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const start = new Date(sortedPosts[0].createdAt);
    const end = new Date(sortedPosts[sortedPosts.length - 1].createdAt);
    
    // 最小表示範囲を1時間に設定
    const minRange = 60 * 60 * 1000; // 1時間（ミリ秒）
    const currentRange = end.getTime() - start.getTime();
    
    if (currentRange < minRange) {
      const center = start.getTime() + currentRange / 2;
      const adjustedStart = new Date(center - minRange / 2);
      const adjustedEnd = new Date(center + minRange / 2);
      
      return {
        posts: sortedPosts,
        timeRange: {
          start: adjustedStart,
          end: adjustedEnd
        }
      };
    }

    return {
      posts: sortedPosts,
      timeRange: { start, end }
    };
  }, [posts]);

  // 時間軸マーカーデータの計算
  const timelineMarkers = useMemo((): TimelineMarkerData[] => {
    const { timeRange } = timelineData;
    const totalRange = timeRange.end.getTime() - timeRange.start.getTime();
    
    if (totalRange === 0) return [];

    // 同じ時間帯（±5分）の投稿をグループ化
    const groupedPosts = new Map<number, string[]>();
    const timeThreshold = 5 * 60 * 1000; // 5分（ミリ秒）

    posts.forEach(post => {
      const postTime = new Date(post.createdAt).getTime();
      let foundGroup = false;

      // 既存のグループに近い時間があるかチェック
      for (const [groupTime, postIds] of groupedPosts) {
        if (Math.abs(postTime - groupTime) <= timeThreshold) {
          postIds.push(post.id);
          foundGroup = true;
          break;
        }
      }

      // 新しいグループを作成
      if (!foundGroup) {
        groupedPosts.set(postTime, [post.id]);
      }
    });

    // マーカーデータを生成
    const markers: TimelineMarkerData[] = [];
    
    groupedPosts.forEach((postIds, timestamp) => {
      const position = ((timestamp - timeRange.start.getTime()) / totalRange) * 100;
      
      markers.push({
        timestamp: new Date(timestamp),
        postIds,
        position: Math.max(0, Math.min(100, position)) // 0-100%の範囲に制限
      });
    });

    // 位置順にソート
    return markers.sort((a, b) => a.position - b.position);
  }, [posts, timelineData]);

  // 指定した投稿IDのマーカー位置を取得
  const getMarkerPositionForPost = (postId: string): number | null => {
    const marker = timelineMarkers.find(m => m.postIds.includes(postId));
    return marker ? marker.position : null;
  };

  // 指定した位置（%）に最も近いマーカーを取得
  const getNearestMarker = (position: number): TimelineMarkerData | null => {
    if (timelineMarkers.length === 0) return null;

    return timelineMarkers.reduce((nearest, current) => {
      const nearestDistance = Math.abs(nearest.position - position);
      const currentDistance = Math.abs(current.position - position);
      return currentDistance < nearestDistance ? current : nearest;
    });
  };

  // 時間軸の表示用ラベルを生成
  const getTimeLabels = (labelCount: number = 5): Array<{ position: number; label: string }> => {
    const { timeRange } = timelineData;
    const labels: Array<{ position: number; label: string }> = [];
    
    for (let i = 0; i <= labelCount; i++) {
      const position = (i / labelCount) * 100;
      const timestamp = timeRange.start.getTime() + 
        (timeRange.end.getTime() - timeRange.start.getTime()) * (i / labelCount);
      
      const date = new Date(timestamp);
      const label = date.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      labels.push({ position, label });
    }
    
    return labels;
  };

  return {
    timelineData,
    timelineMarkers,
    getMarkerPositionForPost,
    getNearestMarker,
    getTimeLabels
  };
}