import type { Post } from '../types';

/**
 * データ整合性チェック用のユーティリティ関数
 */

/**
 * 投稿データの妥当性を検証
 */
export function validatePost(post: any): post is Post {
  if (!post || typeof post !== 'object') {
    return false;
  }

  // 必須フィールドの存在確認
  if (!post.id || typeof post.id !== 'string') {
    return false;
  }

  if (!post.content || typeof post.content !== 'string') {
    return false;
  }

  // 日付フィールドの確認
  if (!post.createdAt) {
    return false;
  }

  if (!post.updatedAt) {
    return false;
  }

  // 日付オブジェクトまたは有効な日付文字列かチェック
  const createdAt = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt);
  const updatedAt = post.updatedAt instanceof Date ? post.updatedAt : new Date(post.updatedAt);

  if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
    return false;
  }

  // 更新日時が作成日時より前でないことを確認
  if (updatedAt < createdAt) {
    return false;
  }

  return true;
}

/**
 * 投稿配列の妥当性を検証（ソートは行わない）
 */
export function validatePosts(posts: any[]): Post[] {
  if (!Array.isArray(posts)) {
    console.warn('[データ整合性] 投稿データが配列ではありません:', typeof posts);
    return [];
  }

  const validPosts: Post[] = [];
  const invalidPosts: any[] = [];

  posts.forEach((post, index) => {
    if (validatePost(post)) {
      // 日付オブジェクトに正規化
      validPosts.push({
        ...post,
        createdAt: post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt),
        updatedAt: post.updatedAt instanceof Date ? post.updatedAt : new Date(post.updatedAt)
      });
    } else {
      invalidPosts.push({ index, post });
    }
  });

  if (invalidPosts.length > 0) {
    console.warn('[データ整合性] 無効な投稿データが検出されました:', invalidPosts);
  }

  console.log(`[データ整合性] ${validPosts.length}/${posts.length}件の投稿が有効です`);
  return validPosts;
}

/**
 * 重複投稿の検出と除去
 */
export function removeDuplicatePosts(posts: Post[]): Post[] {
  const seenIds = new Set<string>();
  const uniquePosts: Post[] = [];
  const duplicates: Post[] = [];

  posts.forEach(post => {
    if (seenIds.has(post.id)) {
      duplicates.push(post);
    } else {
      seenIds.add(post.id);
      uniquePosts.push(post);
    }
  });

  if (duplicates.length > 0) {
    console.warn('[データ整合性] 重複投稿が検出されました:', duplicates.map(p => p.id));
  }

  return uniquePosts;
}

/**
 * 投稿の時系列順序を検証
 */
export function validatePostsOrder(posts: Post[]): boolean {
  if (posts.length <= 1) {
    return true;
  }

  for (let i = 0; i < posts.length - 1; i++) {
    const current = posts[i];
    const next = posts[i + 1];

    // 新しい順（降順）になっているかチェック
    if (current.createdAt < next.createdAt) {
      console.warn('[データ整合性] 投稿の順序が正しくありません:', {
        currentIndex: i,
        currentId: current.id,
        currentDate: current.createdAt,
        nextIndex: i + 1,
        nextId: next.id,
        nextDate: next.createdAt
      });
      return false;
    }
  }

  return true;
}

/**
 * 投稿を正しい順序（新しい順）でソート
 */
export function sortPostsByDate(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * データ整合性の包括的チェック
 */
export function performDataIntegrityCheck(posts: any[]): {
  isValid: boolean;
  validPosts: Post[];
  issues: string[];
} {
  const issues: string[] = [];

  // 1. 基本的な妥当性検証
  const validatedPosts = validatePosts(posts);
  if (validatedPosts.length !== posts.length) {
    issues.push(`${posts.length - validatedPosts.length}件の無効な投稿が除外されました`);
  }

  // 2. 重複チェック
  const uniquePosts = removeDuplicatePosts(validatedPosts);
  if (uniquePosts.length !== validatedPosts.length) {
    issues.push(`${validatedPosts.length - uniquePosts.length}件の重複投稿が除外されました`);
  }

  // 3. 順序チェック
  const isOrderValid = validatePostsOrder(uniquePosts);
  let finalPosts = uniquePosts;
  if (!isOrderValid) {
    issues.push('投稿の順序が修正されました');
    finalPosts = sortPostsByDate(uniquePosts);
  }

  const isValid = issues.length === 0;

  if (!isValid) {
    console.warn('[データ整合性チェック] 問題が検出されました:', issues);
  } else {
    console.log('[データ整合性チェック] データは正常です');
  }

  return {
    isValid,
    validPosts: finalPosts,
    issues
  };
}

/**
 * ローカルストレージのクォータ使用量を確認
 */
export async function checkStorageQuota(): Promise<{
  used: number;
  available: number;
  percentage: number;
  isNearLimit: boolean;
}> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const available = estimate.quota || 0;
      const percentage = available > 0 ? (used / available) * 100 : 0;
      const isNearLimit = percentage > 80; // 80%を超えたら警告

      console.log('[ストレージ使用量]', {
        used: `${(used / 1024 / 1024).toFixed(2)}MB`,
        available: `${(available / 1024 / 1024).toFixed(2)}MB`,
        percentage: `${percentage.toFixed(1)}%`
      });

      if (isNearLimit) {
        console.warn('[ストレージ警告] ストレージ使用量が80%を超えています');
      }

      return { used, available, percentage, isNearLimit };
    } else {
      console.warn('[ストレージ] Storage API がサポートされていません');
      return { used: 0, available: 0, percentage: 0, isNearLimit: false };
    }
  } catch (error) {
    console.error('[ストレージエラー] 使用量の取得に失敗しました:', error);
    return { used: 0, available: 0, percentage: 0, isNearLimit: false };
  }
}

/**
 * データベースの健全性チェック
 */
export function checkDatabaseHealth(stats: {
  totalPosts: number;
  oldestPost?: Date;
  newestPost?: Date;
}): {
  isHealthy: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // 投稿数の妥当性チェック
  if (stats.totalPosts < 0) {
    warnings.push('投稿数が負の値です');
  }

  // 日付の妥当性チェック
  if (stats.totalPosts > 0) {
    if (!stats.oldestPost || !stats.newestPost) {
      warnings.push('投稿が存在するのに日付情報が不正です');
    } else if (stats.oldestPost > stats.newestPost) {
      warnings.push('最古の投稿日時が最新の投稿日時より新しいです');
    }

    // 未来の日付チェック
    const now = new Date();
    if (stats.newestPost && stats.newestPost > now) {
      warnings.push('未来の日付の投稿が存在します');
    }
  }

  const isHealthy = warnings.length === 0;

  if (!isHealthy) {
    console.warn('[データベース健全性] 問題が検出されました:', warnings);
  }

  return { isHealthy, warnings };
}