import { useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { StatsService } from '../services/StatsService';
import type { Post, DiaryStats, MonthlySummary } from '../types';

/**
 * useStatsフックの戻り値の型定義
 */
export interface UseStatsReturn {
  // 統計データ
  stats: DiaryStats | null;
  
  // 月間サマリー
  monthlySummary: MonthlySummary | null;
  
  // 促進メッセージ
  motivationMessage: string | null;
  
  // 状態
  isLoading: boolean;
  error: string | null;
  
  // アクション
  refreshStats: () => Promise<void>;
  getMonthlySummary: (year: number, month: number) => Promise<MonthlySummary>;
  
  // 計算済みの統計値（メモ化）
  computedStats: {
    hasRecentActivity: boolean;      // 最近の活動があるか
    isOnStreak: boolean;             // 継続中かどうか
    streakPercentage: number;        // 継続率（最長に対する現在の割合）
    monthlyProgress: number;         // 今月の進捗（日数ベース）
    averageQuality: 'low' | 'medium' | 'high'; // 投稿品質の評価
  };
}

/**
 * useStatsオプションの型定義
 */
export interface UseStatsOptions {
  autoRefresh?: boolean;           // 投稿変更時の自動更新（デフォルト: true）
  refreshInterval?: number;        // 自動更新間隔（ミリ秒、デフォルト: なし）
  includeMotivation?: boolean;     // 促進メッセージの生成（デフォルト: true）
}

/**
 * 日記統計管理用のカスタムフック
 * 
 * 機能:
 * - 統計データの状態管理
 * - 投稿データ変更時の自動更新
 * - 月間サマリーの取得
 * - 促進メッセージの生成
 * - 計算済み統計値の提供
 * 
 * @param options 設定オプション
 * @returns 統計データと操作関数
 */
export function useStats(options: UseStatsOptions = {}): UseStatsReturn {
  const {
    autoRefresh = true,
    refreshInterval,
    includeMotivation = true
  } = options;

  const { state, dispatch } = useAppContext();
  const { posts, diaryStats, loading, error } = state;

  /**
   * 統計データを計算して状態を更新
   */
  const calculateAndUpdateStats = useCallback(async (postsData: Post[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: true, operation: 'stats' } });
      
      // StatsServiceを使用して統計を計算
      const calculatedStats = StatsService.calculateDiaryStats(postsData);
      
      // 状態を更新
      dispatch({ type: 'LOAD_DIARY_STATS', payload: calculatedStats });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '統計の計算中にエラーが発生しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [dispatch]);

  /**
   * 統計データを手動で更新
   */
  const refreshStats = useCallback(async (): Promise<void> => {
    await calculateAndUpdateStats(posts);
  }, [posts, calculateAndUpdateStats]);

  /**
   * 指定した年月の月間サマリーを取得
   */
  const getMonthlySummary = useCallback(async (year: number, month: number): Promise<MonthlySummary> => {
    try {
      return StatsService.generateMonthlySummary(posts, year, month);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '月間サマリーの生成中にエラーが発生しました';
      throw new Error(errorMessage);
    }
  }, [posts]);

  /**
   * 現在の月間サマリーを計算（メモ化）
   */
  const monthlySummary = useMemo(() => {
    if (posts.length === 0) return null;
    
    const now = new Date();
    try {
      return StatsService.generateMonthlySummary(posts, now.getFullYear(), now.getMonth() + 1);
    } catch {
      return null;
    }
  }, [posts]);

  /**
   * 促進メッセージを生成（メモ化）
   */
  const motivationMessage = useMemo(() => {
    if (!includeMotivation || !diaryStats) return null;
    
    try {
      return StatsService.generateMotivationMessage(diaryStats);
    } catch {
      return null;
    }
  }, [diaryStats, includeMotivation]);

  /**
   * 計算済みの統計値（メモ化）
   */
  const computedStats = useMemo(() => {
    if (!diaryStats) {
      return {
        hasRecentActivity: false,
        isOnStreak: false,
        streakPercentage: 0,
        monthlyProgress: 0,
        averageQuality: 'low' as const
      };
    }

    // 最近の活動があるか（現在の継続日数が1以上）
    const hasRecentActivity = diaryStats.currentStreak > 0;
    
    // 継続中かどうか（現在の継続日数が1以上）
    const isOnStreak = diaryStats.currentStreak > 0;
    
    // 継続率（最長継続日数に対する現在の継続日数の割合）
    const streakPercentage = diaryStats.longestStreak > 0 
      ? Math.round((diaryStats.currentStreak / diaryStats.longestStreak) * 100)
      : 0;
    
    // 今月の進捗（今月の日数に対する投稿日数の割合）
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthlyProgress = Math.round((diaryStats.thisMonthPosts / daysInMonth) * 100);
    
    // 投稿品質の評価（1日あたりの平均投稿数に基づく）
    let averageQuality: 'low' | 'medium' | 'high' = 'low';
    if (diaryStats.averagePostsPerDay >= 2) {
      averageQuality = 'high';
    } else if (diaryStats.averagePostsPerDay >= 1) {
      averageQuality = 'medium';
    }

    return {
      hasRecentActivity,
      isOnStreak,
      streakPercentage,
      monthlyProgress,
      averageQuality
    };
  }, [diaryStats]);

  /**
   * 投稿データが変更された時の自動更新
   */
  useEffect(() => {
    if (autoRefresh && posts.length > 0) {
      calculateAndUpdateStats(posts);
    }
  }, [posts, autoRefresh, calculateAndUpdateStats]);

  /**
   * 定期的な自動更新（オプション）
   */
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      if (posts.length > 0) {
        calculateAndUpdateStats(posts);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, posts, calculateAndUpdateStats]);

  /**
   * 初期化時の統計計算
   */
  useEffect(() => {
    // 統計データがない場合のみ初期計算を実行（autoRefreshが有効な場合のみ）
    if (autoRefresh && !diaryStats && posts.length > 0) {
      calculateAndUpdateStats(posts);
    }
  }, [autoRefresh, diaryStats, posts, calculateAndUpdateStats]);

  return {
    // 統計データ
    stats: diaryStats,
    monthlySummary,
    motivationMessage,
    
    // 状態
    isLoading: loading.isLoading && loading.operation === 'stats',
    error: error,
    
    // アクション
    refreshStats,
    getMonthlySummary,
    
    // 計算済みの統計値
    computedStats
  };
}

/**
 * 統計データの比較用ヘルパー関数
 */
export function compareStats(prev: DiaryStats | null, current: DiaryStats | null): {
  hasChanged: boolean;
  changes: {
    totalPosts?: number;
    currentStreak?: number;
    thisMonthPosts?: number;
  };
} {
  if (!prev || !current) {
    return { hasChanged: !!current, changes: {} };
  }

  const changes: any = {};
  let hasChanged = false;

  // 総投稿数の変化
  if (prev.totalPosts !== current.totalPosts) {
    changes.totalPosts = current.totalPosts - prev.totalPosts;
    hasChanged = true;
  }

  // 継続日数の変化
  if (prev.currentStreak !== current.currentStreak) {
    changes.currentStreak = current.currentStreak - prev.currentStreak;
    hasChanged = true;
  }

  // 今月の投稿数の変化
  if (prev.thisMonthPosts !== current.thisMonthPosts) {
    changes.thisMonthPosts = current.thisMonthPosts - prev.thisMonthPosts;
    hasChanged = true;
  }

  return { hasChanged, changes };
}