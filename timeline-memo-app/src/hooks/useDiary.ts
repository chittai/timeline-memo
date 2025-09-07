import { useCallback, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useErrorHandler } from './useErrorHandler';
import type { DiaryEntry, DateRange } from '../types';
import type { DataService } from '../services/DataService';
import { DiaryService } from '../services/DiaryService';
import { IndexedDBService } from '../services/IndexedDBService';

// データサービスとDiaryServiceのインスタンス
const dataService: DataService = new IndexedDBService();
const diaryService = new DiaryService(dataService);

/**
 * 日記機能のためのカスタムフック
 * 日記エントリーの状態管理、日付選択とフィルタリング機能、DiaryServiceとの連携を提供
 */
export function useDiary() {
  const { state, dispatch } = useAppContext();
  const { executeAsync } = useErrorHandler();

  // 日記エントリーの読み込み（全期間）
  const loadDiaryEntries = useCallback(async () => {
    const entries = await executeAsync(
      async () => {
        // 全投稿を取得して日付でグループ化
        const posts = await dataService.getAllPosts();
        if (posts.length === 0) {
          return [];
        }
        
        // 最古と最新の投稿日を取得
        const sortedPosts = [...posts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const startDate = new Date(sortedPosts[0].createdAt);
        const endDate = new Date(sortedPosts[sortedPosts.length - 1].createdAt);
        
        // 日付範囲で日記エントリーを取得
        return await diaryService.getEntriesByDateRange(startDate, endDate);
      },
      {
        loadingMessage: '日記エントリーを読み込んでいます...',
        errorTitle: '日記エントリーの読み込みに失敗しました',
        context: 'loadDiaryEntries'
      }
    );
    
    if (entries) {
      dispatch({ type: 'LOAD_DIARY_ENTRIES', payload: entries });
    }
  }, [dispatch, executeAsync]);

  // 指定した日付範囲の日記エントリーを読み込み
  const loadDiaryEntriesByDateRange = useCallback(async (dateRange: DateRange) => {
    const entries = await executeAsync(
      () => diaryService.getEntriesByDateRange(dateRange.start, dateRange.end),
      {
        loadingMessage: '指定期間の日記エントリーを読み込んでいます...',
        errorTitle: '日記エントリーの読み込みに失敗しました',
        context: 'loadDiaryEntriesByDateRange'
      }
    );
    
    if (entries) {
      dispatch({ type: 'LOAD_DIARY_ENTRIES', payload: entries });
    }
  }, [dispatch, executeAsync]);

  // 特定の日付の日記エントリーを取得
  const getEntryByDate = useCallback(async (date: Date): Promise<DiaryEntry | null> => {
    return await executeAsync(
      () => diaryService.getEntryByDate(date),
      {
        loadingMessage: '指定日の日記エントリーを取得しています...',
        errorTitle: '日記エントリーの取得に失敗しました',
        context: 'getEntryByDate'
      }
    );
  }, [executeAsync]);

  // 日記統計の読み込み
  const loadDiaryStats = useCallback(async () => {
    const stats = await executeAsync(
      () => diaryService.getStats(),
      {
        loadingMessage: '日記統計を計算しています...',
        errorTitle: '日記統計の取得に失敗しました',
        context: 'loadDiaryStats'
      }
    );
    
    if (stats) {
      dispatch({ type: 'LOAD_DIARY_STATS', payload: stats });
    }
  }, [dispatch, executeAsync]);

  // 日付の選択
  const selectDate = useCallback((date: Date | null) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  }, [dispatch]);

  // フィルターのクリア（全期間の日記エントリーを再読み込み）
  const clearFilter = useCallback(async () => {
    selectDate(null);
    await loadDiaryEntries();
  }, [selectDate, loadDiaryEntries]);

  // 日付範囲でのフィルタリング
  const filterByDateRange = useCallback(async (start: Date, end: Date) => {
    await loadDiaryEntriesByDateRange({ start, end });
  }, [loadDiaryEntriesByDateRange]);

  // 日付範囲フィルターの適用
  const applyDateRangeFilter = useCallback(async (dateRange: DateRange | null) => {
    if (dateRange) {
      await loadDiaryEntriesByDateRange(dateRange);
    } else {
      await clearFilter();
    }
  }, [loadDiaryEntriesByDateRange, clearFilter]);

  // 特定の日付でのフィルタリング
  const filterByDate = useCallback(async (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    await filterByDateRange(startOfDay, endOfDay);
    selectDate(date);
  }, [filterByDateRange, selectDate]);

  // 今日の日記エントリーを取得
  const getTodayEntry = useCallback(async (): Promise<DiaryEntry | null> => {
    const today = new Date();
    return await getEntryByDate(today);
  }, [getEntryByDate]);

  // 今週の日記エントリーを取得
  const getThisWeekEntries = useCallback(async () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // 日曜日を週の開始とする
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    await filterByDateRange(startOfWeek, endOfWeek);
  }, [filterByDateRange]);

  // 今月の日記エントリーを取得
  const getThisMonthEntries = useCallback(async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    await filterByDateRange(startOfMonth, endOfMonth);
  }, [filterByDateRange]);

  // 選択された日付の日記エントリーを取得（メモ化）
  const selectedDateEntry = useMemo(() => {
    if (!state.selectedDate) {
      return null;
    }
    
    const selectedDateKey = state.selectedDate.toISOString().split('T')[0];
    return state.diaryEntries.find(entry => entry.date === selectedDateKey) || null;
  }, [state.selectedDate, state.diaryEntries]);

  // フィルタリングされているかどうかの判定
  const isFiltered = useMemo(() => {
    return state.selectedDate !== null;
  }, [state.selectedDate]);

  // 投稿が更新された際に日記データを再読み込み
  useEffect(() => {
    // 投稿データが変更された場合、日記エントリーと統計を再計算
    if (state.posts.length > 0 && state.diaryEntries.length === 0) {
      loadDiaryEntries();
      loadDiaryStats();
    }
  }, [state.posts, state.diaryEntries.length, loadDiaryEntries, loadDiaryStats]);

  return {
    // 状態
    diaryEntries: state.diaryEntries,
    selectedDate: state.selectedDate,
    selectedDateEntry,
    diaryStats: state.diaryStats,
    isLoading: state.loading.isLoading,
    error: state.error,
    isFiltered,
    
    // アクション
    loadDiaryEntries,
    loadDiaryEntriesByDateRange,
    loadDiaryStats,
    getEntryByDate,
    selectDate,
    filterByDateRange,
    filterByDate,
    clearFilter,
    applyDateRangeFilter,
    getTodayEntry,
    getThisWeekEntries,
    getThisMonthEntries
  };
}