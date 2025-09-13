import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CalendarDay, Post } from '../types';
import { CalendarService } from '../services/CalendarService';
import { IndexedDBService } from '../services/IndexedDBService';
import { useAppReducer } from './useAppReducer';

/**
 * useCalendarフックの戻り値の型定義
 */
export interface UseCalendarReturn {
  // カレンダーデータ
  calendarData: CalendarDay[];
  
  // 現在の年月
  currentYear: number;
  currentMonth: number;
  
  // 選択された日付
  selectedDate: Date | null;
  
  // 選択された日付の投稿
  selectedDatePosts: Post[];
  
  // ローディング状態
  isLoading: boolean;
  
  // エラー状態
  error: string | null;
  
  // アクション関数
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToMonth: (year: number, month: number) => void;
  selectDate: (date: Date | null) => void;
  refreshCalendar: () => Promise<void>;
}

/**
 * カレンダー機能を提供するカスタムフック
 * 
 * 機能:
 * - カレンダーデータの状態管理
 * - 月の切り替え機能
 * - 日付選択機能
 * - CalendarServiceとの連携
 * - 選択された日付の投稿取得
 * 
 * @returns UseCalendarReturn カレンダー関連の状態とアクション
 */
export function useCalendar(): UseCalendarReturn {
  const { state, dispatch } = useAppReducer();
  
  // カレンダーサービスのインスタンス化（メモ化）
  const calendarService = useMemo(() => {
    // IndexedDBServiceを使用
    const dataService = new IndexedDBService();
    return new CalendarService(dataService);
  }, []);
  
  // 現在の年月の状態管理
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  
  // 選択された日付の投稿を管理
  const [selectedDatePosts, setSelectedDatePosts] = useState<Post[]>([]);
  
  // ローディング状態とエラー状態
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // グローバル状態からカレンダーデータと選択された日付を取得
  const { calendarData, selectedDate } = state;
  
  /**
   * カレンダーデータを読み込む
   */
  const loadCalendarData = useCallback(async (year: number, month: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 日付範囲のバリデーション
      const validation = calendarService.validateDateRange(year, month);
      if (!validation.isValid) {
        throw new Error(validation.error || '無効な日付範囲です');
      }
      
      // カレンダーデータを生成
      const data = await calendarService.generateMonthlyCalendarData(year, month);
      
      // 投稿ハイライトを計算
      const highlightedData = calendarService.calculatePostHighlights(data);
      
      // 選択状態を更新（既存の選択日付がある場合）
      const updatedData = calendarService.updateDateSelection(highlightedData, selectedDate);
      
      // グローバル状態を更新
      dispatch({ type: 'LOAD_CALENDAR_DATA', payload: updatedData });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'カレンダーデータの読み込みに失敗しました';
      setError(errorMessage);
      console.error('カレンダーデータの読み込みエラー:', err);
    } finally {
      setIsLoading(false);
    }
  }, [calendarService, selectedDate, dispatch]);
  
  /**
   * 選択された日付の投稿を読み込む
   */
  const loadSelectedDatePosts = useCallback(async (date: Date) => {
    try {
      setIsLoading(true);
      const posts = await calendarService.getPostsForDate(date);
      setSelectedDatePosts(posts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '投稿の読み込みに失敗しました';
      setError(errorMessage);
      console.error('選択日の投稿読み込みエラー:', err);
    } finally {
      setIsLoading(false);
    }
  }, [calendarService]);
  
  /**
   * 前月に移動
   */
  const goToPreviousMonth = useCallback(() => {
    const { year, month } = calendarService.getPreviousMonth(currentYear, currentMonth);
    setCurrentYear(year);
    setCurrentMonth(month);
  }, [calendarService, currentYear, currentMonth]);
  
  /**
   * 次月に移動
   */
  const goToNextMonth = useCallback(() => {
    const { year, month } = calendarService.getNextMonth(currentYear, currentMonth);
    setCurrentYear(year);
    setCurrentMonth(month);
  }, [calendarService, currentYear, currentMonth]);
  
  /**
   * 指定した年月に移動
   */
  const goToMonth = useCallback((year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  }, []);
  
  /**
   * 日付を選択
   */
  const selectDate = useCallback((date: Date | null) => {
    // グローバル状態を更新
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
    
    // カレンダーデータの選択状態を更新
    if (calendarData.length > 0) {
      const updatedData = calendarService.updateDateSelection(calendarData, date);
      dispatch({ type: 'LOAD_CALENDAR_DATA', payload: updatedData });
    }
    
    // 選択された日付の投稿を読み込み
    if (date) {
      loadSelectedDatePosts(date);
    } else {
      setSelectedDatePosts([]);
    }
  }, [dispatch, calendarData, calendarService, loadSelectedDatePosts]);
  
  /**
   * カレンダーを手動で更新
   */
  const refreshCalendar = useCallback(async () => {
    await loadCalendarData(currentYear, currentMonth);
  }, [loadCalendarData, currentYear, currentMonth]);
  
  // 年月が変更されたときにカレンダーデータを読み込み
  useEffect(() => {
    loadCalendarData(currentYear, currentMonth);
  }, [currentYear, currentMonth, loadCalendarData]);
  
  // 投稿データが変更されたときにカレンダーを更新
  useEffect(() => {
    if (state.posts.length > 0) {
      loadCalendarData(currentYear, currentMonth);
    }
  }, [state.posts, currentYear, currentMonth, loadCalendarData]);
  
  // 選択された日付が変更されたときに投稿を読み込み
  useEffect(() => {
    if (selectedDate) {
      loadSelectedDatePosts(selectedDate);
    } else {
      setSelectedDatePosts([]);
    }
  }, [selectedDate, loadSelectedDatePosts]);
  
  return {
    // カレンダーデータ
    calendarData,
    
    // 現在の年月
    currentYear,
    currentMonth,
    
    // 選択された日付
    selectedDate,
    
    // 選択された日付の投稿
    selectedDatePosts,
    
    // ローディング状態
    isLoading,
    
    // エラー状態
    error,
    
    // アクション関数
    goToPreviousMonth,
    goToNextMonth,
    goToMonth,
    selectDate,
    refreshCalendar
  };
}