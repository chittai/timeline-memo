import type { Post, TimelineMarkerData } from '../types';
import { 
  getCachedTimeRange, 
  setCachedTimeRange, 
  getCachedTimelineMarkers, 
  setCachedTimelineMarkers 
} from './performanceCache';

/**
 * 時間軸の表示範囲を計算する（キャッシュ機能付き）
 * 要件5.1に対応
 */
export function calculateTimeRange(posts: Post[]): { start: Date; end: Date } {
  // キャッシュから取得を試行
  const cached = getCachedTimeRange(posts);
  if (cached) {
    return cached;
  }

  let result: { start: Date; end: Date };

  if (posts.length === 0) {
    // 投稿がない場合は過去24時間をデフォルト表示
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    result = { start, end: now };
  } else {
    // 投稿がある場合は最古から最新まで
    const timestamps = posts.map(post => new Date(post.createdAt).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    // 最小表示範囲を1時間に設定
    const minRange = 60 * 60 * 1000; // 1時間
    const actualRange = maxTime - minTime;
    
    if (actualRange < minRange) {
      // 範囲が1時間未満の場合は中央を基準に1時間の範囲を設定
      const center = (minTime + maxTime) / 2;
      const halfRange = minRange / 2;
      result = {
        start: new Date(center - halfRange),
        end: new Date(center + halfRange)
      };
    } else {
      // 少し余裕を持たせて表示範囲を設定
      const padding = actualRange * 0.05; // 5%のパディング
      result = {
        start: new Date(minTime - padding),
        end: new Date(maxTime + padding)
      };
    }
  }

  // 結果をキャッシュに保存
  setCachedTimeRange(posts, result);
  return result;
}

/**
 * 時間軸マーカーデータを生成する（キャッシュ機能付き）
 * 同じ時間帯（±5分）の投稿をグループ化
 * 要件5.2, 5.4に対応
 */
export function generateTimelineMarkers(
  posts: Post[], 
  timeRange: { start: Date; end: Date }
): TimelineMarkerData[] {
  // キャッシュから取得を試行
  const cached = getCachedTimelineMarkers(posts, timeRange);
  if (cached) {
    return cached;
  }

  if (posts.length === 0) return [];

  const { start, end } = timeRange;
  const totalRange = end.getTime() - start.getTime();

  // 投稿を時刻順にソート
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // 同じ時間帯（±5分）の投稿をグループ化
  const groupedPosts = groupPostsByTimeWindow(sortedPosts, 5 * 60 * 1000);

  // マーカーデータを生成
  const result = groupedPosts.map(group => {
    const position = ((group.timestamp - start.getTime()) / totalRange) * 100;
    return {
      timestamp: new Date(group.timestamp),
      postIds: group.postIds,
      position: Math.max(0, Math.min(100, position)) // 0-100%の範囲に制限
    };
  });

  // 結果をキャッシュに保存
  setCachedTimelineMarkers(posts, timeRange, result);
  return result;
}

/**
 * 投稿を時間窓でグループ化する
 * 同じ時間帯の投稿を効率的にグループ化
 */
function groupPostsByTimeWindow(
  posts: Post[], 
  timeWindow: number
): Array<{ timestamp: number; postIds: string[] }> {
  const groups: Array<{ timestamp: number; postIds: string[] }> = [];

  posts.forEach(post => {
    const postTime = new Date(post.createdAt).getTime();
    
    // 既存のグループに近い時間があるかチェック
    let foundGroup = false;
    for (const group of groups) {
      if (Math.abs(postTime - group.timestamp) <= timeWindow) {
        group.postIds.push(post.id);
        // グループの代表時刻を平均値で更新
        const totalPosts = group.postIds.length;
        group.timestamp = (group.timestamp * (totalPosts - 1) + postTime) / totalPosts;
        foundGroup = true;
        break;
      }
    }
    
    // 新しいグループを作成
    if (!foundGroup) {
      groups.push({
        timestamp: postTime,
        postIds: [post.id]
      });
    }
  });

  return groups;
}

/**
 * マーカーの配置を最適化する
 * 重複を避けて視覚的に分かりやすい配置にする
 */
export function optimizeMarkerPositions(
  markers: TimelineMarkerData[],
  minDistance: number = 2 // 最小距離（%）
): TimelineMarkerData[] {
  if (markers.length <= 1) return markers;

  const optimizedMarkers = [...markers].sort((a, b) => a.position - b.position);
  
  // 重複する位置を調整
  for (let i = 1; i < optimizedMarkers.length; i++) {
    const current = optimizedMarkers[i];
    const previous = optimizedMarkers[i - 1];
    
    if (current.position - previous.position < minDistance) {
      current.position = previous.position + minDistance;
      
      // 100%を超えないように調整
      if (current.position > 100) {
        current.position = 100;
        // 前のマーカーを下に移動
        if (i > 0) {
          optimizedMarkers[i - 1].position = Math.max(0, 100 - minDistance);
        }
      }
    }
  }

  return optimizedMarkers;
}

/**
 * 時間ラベルを生成する
 * 表示範囲に応じて適切な間隔と形式を決定
 */
export function generateTimeLabels(timeRange: { start: Date; end: Date }): Array<{
  time: Date;
  position: number;
  label: string;
  shortLabel?: string;
}> {
  const { start, end } = timeRange;
  const totalRange = end.getTime() - start.getTime();
  
  // 表示する時間ラベルの数を決定（最大10個）
  const maxLabels = 10;
  const minInterval = totalRange / maxLabels;
  
  // 適切な時間間隔を決定
  let interval: number;
  let formatType: 'hour' | 'day' | 'minute';
  
  if (minInterval < 60 * 60 * 1000) { // 1時間未満
    // 15分間隔
    interval = 15 * 60 * 1000;
    formatType = 'minute';
  } else if (minInterval < 24 * 60 * 60 * 1000) { // 24時間未満
    // 1時間間隔
    interval = 60 * 60 * 1000;
    formatType = 'hour';
  } else {
    // 1日間隔
    interval = 24 * 60 * 60 * 1000;
    formatType = 'day';
  }
  
  // ラベルを生成
  const labels: Array<{ time: Date; position: number; label: string; shortLabel?: string }> = [];
  
  // 開始時刻を間隔に合わせて調整
  const startTime = Math.ceil(start.getTime() / interval) * interval;
  
  for (let time = startTime; time <= end.getTime(); time += interval) {
    const date = new Date(time);
    const position = ((time - start.getTime()) / totalRange) * 100;
    
    let label: string;
    let shortLabel: string;
    
    switch (formatType) {
      case 'minute':
        label = date.toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        shortLabel = date.toLocaleTimeString('ja-JP', { 
          hour: 'numeric', 
          minute: '2-digit' 
        });
        break;
      case 'hour':
        label = date.toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        shortLabel = date.toLocaleTimeString('ja-JP', { 
          hour: 'numeric'
        }) + '時';
        break;
      case 'day':
        label = date.toLocaleDateString('ja-JP', { 
          month: 'short', 
          day: 'numeric' 
        });
        shortLabel = date.toLocaleDateString('ja-JP', { 
          month: 'numeric', 
          day: 'numeric' 
        });
        break;
    }
    
    if (position >= 0 && position <= 100) {
      labels.push({ time: date, position, label, shortLabel });
    }
  }
  
  return labels;
}

/**
 * 現在時刻が指定された時間範囲内にあるかチェック
 */
export function isCurrentTimeInRange(timeRange: { start: Date; end: Date }): boolean {
  const now = new Date();
  return now >= timeRange.start && now <= timeRange.end;
}

/**
 * 現在時刻の時間軸上での位置を計算（パーセンテージ）
 */
export function getCurrentTimePosition(timeRange: { start: Date; end: Date }): number {
  const now = new Date();
  const { start, end } = timeRange;
  const totalRange = end.getTime() - start.getTime();
  const position = ((now.getTime() - start.getTime()) / totalRange) * 100;
  return Math.max(0, Math.min(100, position));
}