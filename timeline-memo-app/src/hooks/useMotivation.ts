import { useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { MotivationService } from '../services/MotivationService';
import { MotivationMessage } from '../types';

/**
 * 継続促進機能を管理するカスタムフック
 * 投稿のない日の検出、促進メッセージの表示、達成通知の管理を行う
 */
export function useMotivation() {
  const { state, dispatch } = useAppContext();
  const { posts, motivationMessages, lastPostDate, daysSinceLastPost, diaryStats } = state;

  /**
   * 最後の投稿からの経過日数を更新
   */
  const updateDaysSinceLastPost = useCallback(() => {
    const days = MotivationService.calculateDaysSinceLastPost(posts);
    const lastPost = MotivationService.getLastPostDate(posts);
    
    dispatch({ type: 'UPDATE_DAYS_SINCE_LAST_POST', payload: days });
    dispatch({ type: 'UPDATE_LAST_POST_DATE', payload: lastPost });
  }, [posts, dispatch]);

  /**
   * 促進メッセージを生成して追加
   */
  const generateEncouragementMessage = useCallback(() => {
    const message = MotivationService.generateEncouragementMessage(daysSinceLastPost);
    if (message) {
      // 同じタイプのメッセージが既に存在するかチェック
      const existingEncouragement = motivationMessages.find(m => m.type === 'encouragement');
      if (!existingEncouragement) {
        dispatch({ type: 'ADD_MOTIVATION_MESSAGE', payload: message });
      }
    }
  }, [daysSinceLastPost, motivationMessages, dispatch]);

  /**
   * 達成通知メッセージを生成して追加
   */
  const generateAchievementMessage = useCallback(() => {
    if (!diaryStats) return;

    const message = MotivationService.generateAchievementMessage(
      diaryStats.currentStreak,
      diaryStats.longestStreak
    );
    
    if (message) {
      // 同じ連続日数の達成通知が既に存在するかチェック
      const existingAchievement = motivationMessages.find(
        m => m.type === 'achievement' && m.streakCount === message.streakCount
      );
      if (!existingAchievement) {
        dispatch({ type: 'ADD_MOTIVATION_MESSAGE', payload: message });
      }
    }
  }, [diaryStats, motivationMessages, dispatch]);

  /**
   * 月末サマリーメッセージを生成して追加
   */
  const generateMonthlySummaryMessage = useCallback(() => {
    const today = new Date();
    
    // 月末かどうかをチェック
    if (!MotivationService.isEndOfMonth(today)) return;

    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    
    // 今月の統計を計算
    const monthlyStats = MotivationService.calculateMonthlyStats(posts, year, month);
    
    const message = MotivationService.generateMonthlySummaryMessage(
      year,
      month,
      monthlyStats.postCount,
      monthlyStats.activeDays
    );

    // 同じ月のサマリーが既に存在するかチェック
    const existingSummary = motivationMessages.find(
      m => m.type === 'reminder' && m.id.includes(`monthly-summary-${year}-${month}`)
    );
    
    if (!existingSummary) {
      dispatch({ type: 'ADD_MOTIVATION_MESSAGE', payload: message });
    }
  }, [posts, motivationMessages, dispatch]);

  /**
   * 期限切れのメッセージを削除
   */
  const cleanupExpiredMessages = useCallback(() => {
    const validMessages = MotivationService.filterValidMessages(motivationMessages);
    
    // 期限切れのメッセージがある場合、有効なメッセージのみを残す
    if (validMessages.length !== motivationMessages.length) {
      // 期限切れのメッセージを個別に削除
      motivationMessages.forEach(message => {
        if (!validMessages.find(valid => valid.id === message.id)) {
          dispatch({ type: 'REMOVE_MOTIVATION_MESSAGE', payload: message.id });
        }
      });
    }
  }, [motivationMessages, dispatch]);

  /**
   * 特定のメッセージを削除
   */
  const dismissMessage = useCallback((messageId: string) => {
    dispatch({ type: 'REMOVE_MOTIVATION_MESSAGE', payload: messageId });
  }, [dispatch]);

  /**
   * 全てのメッセージをクリア
   */
  const clearAllMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MOTIVATION_MESSAGES' });
  }, [dispatch]);

  /**
   * 継続促進機能の初期化と定期更新
   */
  useEffect(() => {
    // 投稿データが変更されたら経過日数を更新
    updateDaysSinceLastPost();
  }, [updateDaysSinceLastPost]);

  /**
   * 促進メッセージの生成（経過日数が変更されたとき）
   */
  useEffect(() => {
    if (daysSinceLastPost >= 3) {
      generateEncouragementMessage();
    }
  }, [daysSinceLastPost, generateEncouragementMessage]);

  /**
   * 達成通知の生成（統計が更新されたとき）
   */
  useEffect(() => {
    if (diaryStats && diaryStats.currentStreak > 0) {
      generateAchievementMessage();
    }
  }, [diaryStats, generateAchievementMessage]);

  /**
   * 月末サマリーの生成（日付が変わったときにチェック）
   */
  useEffect(() => {
    generateMonthlySummaryMessage();
    
    // 毎日午前0時にチェックするためのタイマー設定
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timer = setTimeout(() => {
      generateMonthlySummaryMessage();
      
      // その後は24時間ごとにチェック
      const dailyTimer = setInterval(generateMonthlySummaryMessage, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(dailyTimer);
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, [generateMonthlySummaryMessage]);

  /**
   * 期限切れメッセージの定期クリーンアップ
   */
  useEffect(() => {
    // 初回実行
    cleanupExpiredMessages();
    
    // 1時間ごとにクリーンアップを実行
    const cleanupTimer = setInterval(cleanupExpiredMessages, 60 * 60 * 1000);
    
    return () => clearInterval(cleanupTimer);
  }, [cleanupExpiredMessages]);

  return {
    // 状態
    motivationMessages,
    lastPostDate,
    daysSinceLastPost,
    
    // アクション
    dismissMessage,
    clearAllMessages,
    updateDaysSinceLastPost,
    
    // ユーティリティ
    isEndOfMonth: MotivationService.isEndOfMonth(),
    
    // 統計情報
    streakInfo: diaryStats ? {
      current: diaryStats.currentStreak,
      longest: diaryStats.longestStreak
    } : { current: 0, longest: 0 }
  };
}