import type { Post, TimelineMarkerData } from '../types';

/**
 * パフォーマンス最適化のためのキャッシュユーティリティ
 * 時間軸計算結果やその他の重い計算結果をキャッシュ
 */

// キャッシュエントリの型定義
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  key: string;
}

// キャッシュの設定
const CACHE_CONFIG = {
  // キャッシュの有効期限（ミリ秒）
  TTL: 5 * 60 * 1000, // 5分
  // 最大キャッシュサイズ
  MAX_SIZE: 100,
  // 時間軸計算のキャッシュキー生成用
  TIMELINE_CACHE_PREFIX: 'timeline_',
  MARKER_CACHE_PREFIX: 'marker_'
} as const;

// グローバルキャッシュストレージ
const cache = new Map<string, CacheEntry<any>>();

/**
 * 投稿データからキャッシュキーを生成
 */
function generatePostsKey(posts: Post[]): string {
  if (posts.length === 0) return 'empty';
  
  // 投稿のID、作成日時、更新日時からハッシュを生成
  const keyData = posts
    .map(post => `${post.id}-${post.createdAt}-${post.updatedAt || post.createdAt}`)
    .sort() // 順序に依存しないようにソート
    .join('|');
  
  // 簡単なハッシュ関数
  let hash = 0;
  for (let i = 0; i < keyData.length; i++) {
    const char = keyData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * キャッシュから値を取得
 */
function getCacheValue<T>(key: string): T | null {
  const entry = cache.get(key);
  
  if (!entry) return null;
  
  // TTLチェック
  const now = Date.now();
  if (now - entry.timestamp > CACHE_CONFIG.TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.value;
}

/**
 * キャッシュに値を保存
 */
function setCacheValue<T>(key: string, value: T): void {
  // キャッシュサイズの制限チェック
  if (cache.size >= CACHE_CONFIG.MAX_SIZE) {
    // 最も古いエントリを削除（LRU的な動作）
    const oldestKey = Array.from(cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0]?.[0];
    
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
  
  cache.set(key, {
    value,
    timestamp: Date.now(),
    key
  });
}

/**
 * 時間軸の表示範囲計算結果をキャッシュ
 */
export function getCachedTimeRange(posts: Post[]): { start: Date; end: Date } | null {
  const postsKey = generatePostsKey(posts);
  const cacheKey = `${CACHE_CONFIG.TIMELINE_CACHE_PREFIX}${postsKey}`;
  
  const cached = getCacheValue<{ start: string; end: string }>(cacheKey);
  if (cached) {
    return {
      start: new Date(cached.start),
      end: new Date(cached.end)
    };
  }
  
  return null;
}

/**
 * 時間軸の表示範囲計算結果をキャッシュに保存
 */
export function setCachedTimeRange(posts: Post[], timeRange: { start: Date; end: Date }): void {
  const postsKey = generatePostsKey(posts);
  const cacheKey = `${CACHE_CONFIG.TIMELINE_CACHE_PREFIX}${postsKey}`;
  
  setCacheValue(cacheKey, {
    start: timeRange.start.toISOString(),
    end: timeRange.end.toISOString()
  });
}

/**
 * 時間軸マーカーデータをキャッシュから取得
 */
export function getCachedTimelineMarkers(
  posts: Post[], 
  timeRange: { start: Date; end: Date }
): TimelineMarkerData[] | null {
  const postsKey = generatePostsKey(posts);
  const timeRangeKey = `${timeRange.start.getTime()}-${timeRange.end.getTime()}`;
  const cacheKey = `${CACHE_CONFIG.MARKER_CACHE_PREFIX}${postsKey}_${timeRangeKey}`;
  
  const cached = getCacheValue<Array<{
    timestamp: string;
    postIds: string[];
    position: number;
  }>>(cacheKey);
  
  if (cached) {
    return cached.map(marker => ({
      timestamp: new Date(marker.timestamp),
      postIds: marker.postIds,
      position: marker.position
    }));
  }
  
  return null;
}

/**
 * 時間軸マーカーデータをキャッシュに保存
 */
export function setCachedTimelineMarkers(
  posts: Post[], 
  timeRange: { start: Date; end: Date },
  markers: TimelineMarkerData[]
): void {
  const postsKey = generatePostsKey(posts);
  const timeRangeKey = `${timeRange.start.getTime()}-${timeRange.end.getTime()}`;
  const cacheKey = `${CACHE_CONFIG.MARKER_CACHE_PREFIX}${postsKey}_${timeRangeKey}`;
  
  const cacheData = markers.map(marker => ({
    timestamp: marker.timestamp.toISOString(),
    postIds: marker.postIds,
    position: marker.position
  }));
  
  setCacheValue(cacheKey, cacheData);
}

/**
 * キャッシュをクリア
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * 期限切れのキャッシュエントリを削除
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_CONFIG.TTL) {
      cache.delete(key);
    }
  }
}

/**
 * キャッシュの統計情報を取得（デバッグ用）
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  hitRate?: number;
  entries: Array<{ key: string; age: number }>;
} {
  const now = Date.now();
  
  return {
    size: cache.size,
    maxSize: CACHE_CONFIG.MAX_SIZE,
    entries: Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp
    }))
  };
}

// 定期的なキャッシュクリーンアップ（5分ごと）
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredCache, 5 * 60 * 1000);
}