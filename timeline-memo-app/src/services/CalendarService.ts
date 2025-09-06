import type { Post, CalendarDay } from '../types';
import type { DataService } from './DataService';

/**
 * カレンダー機能を提供するサービスクラス
 * 月別カレンダーデータの生成、投稿ハイライト計算、日付選択機能を提供します
 */
export class CalendarService {
  private dataService: DataService;

  constructor(dataService: DataService) {
    this.dataService = dataService;
  }

  /**
   * 日付をYYYY-MM-DD形式の文字列に変換
   * @param date 変換する日付
   * @returns YYYY-MM-DD形式の文字列
   */
  private formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 2つの日付が同じ日かどうかを判定
   * @param date1 比較する日付1
   * @param date2 比較する日付2
   * @returns 同じ日の場合true
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return this.formatDateKey(date1) === this.formatDateKey(date2);
  }

  /**
   * 指定した年月の月別カレンダーデータを生成
   * @param year 年
   * @param month 月（1-12）
   * @returns カレンダーデータの配列
   */
  async generateMonthlyCalendarData(year: number, month: number): Promise<CalendarDay[]> {
    try {
      // 月の範囲のバリデーション
      if (month < 1 || month > 12) {
        throw new Error('月は1から12の間で指定してください');
      }

      // 指定月の開始日と終了日を設定
      const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      // 指定月の投稿を取得
      const posts = await this.dataService.getPostsByDateRange(startOfMonth, endOfMonth);
      
      // 投稿を日付でグループ化
      const postsByDate = this.groupPostsByDate(posts);

      // カレンダーデータを生成
      return this.generateCalendarDays(year, month, postsByDate);
    } catch (error) {
      console.error('月別カレンダーデータの生成に失敗しました:', error);
      throw new Error(`月別カレンダーデータの生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * 投稿を日付でグループ化
   * @param posts 投稿の配列
   * @returns 日付をキーとした投稿のマップ
   */
  private groupPostsByDate(posts: Post[]): Map<string, Post[]> {
    const grouped = new Map<string, Post[]>();
    
    posts.forEach(post => {
      const dateKey = this.formatDateKey(post.createdAt);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(post);
    });
    
    return grouped;
  }

  /**
   * 指定月のカレンダー日データを生成
   * @param year 年
   * @param month 月
   * @param postsByDate 日付別の投稿マップ
   * @returns カレンダー日データの配列
   */
  private generateCalendarDays(year: number, month: number, postsByDate: Map<string, Post[]>): CalendarDay[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const calendarDays: CalendarDay[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day, 12, 0, 0, 0); // 正午に設定してタイムゾーンの影響を軽減
      const dateKey = this.formatDateKey(date);
      const postsForDay = postsByDate.get(dateKey) || [];

      calendarDays.push({
        date,
        hasPost: postsForDay.length > 0,
        postCount: postsForDay.length,
        isToday: this.isSameDay(date, today),
        isSelected: false // 初期状態では選択されていない
      });
    }

    return calendarDays;
  }

  /**
   * 投稿がある日のハイライト計算を実行
   * @param calendarDays カレンダーデータ
   * @returns ハイライト情報を含むカレンダーデータ
   */
  calculatePostHighlights(calendarDays: CalendarDay[]): CalendarDay[] {
    return calendarDays.map(day => ({
      ...day,
      // 投稿がある日は既にhasPostとpostCountが設定されているので、
      // 追加のハイライト計算は不要（将来的に強度レベルなどを追加する場合に使用）
    }));
  }

  /**
   * 日付選択状態を更新
   * @param calendarDays 現在のカレンダーデータ
   * @param selectedDate 選択する日付（nullの場合は全て非選択）
   * @returns 選択状態が更新されたカレンダーデータ
   */
  updateDateSelection(calendarDays: CalendarDay[], selectedDate: Date | null): CalendarDay[] {
    return calendarDays.map(day => ({
      ...day,
      isSelected: selectedDate ? this.isSameDay(day.date, selectedDate) : false
    }));
  }

  /**
   * 月のナビゲーション機能：前月の年月を取得
   * @param year 現在の年
   * @param month 現在の月
   * @returns 前月の年月
   */
  getPreviousMonth(year: number, month: number): { year: number; month: number } {
    if (month === 1) {
      return { year: year - 1, month: 12 };
    }
    return { year, month: month - 1 };
  }

  /**
   * 月のナビゲーション機能：次月の年月を取得
   * @param year 現在の年
   * @param month 現在の月
   * @returns 次月の年月
   */
  getNextMonth(year: number, month: number): { year: number; month: number } {
    if (month === 12) {
      return { year: year + 1, month: 1 };
    }
    return { year, month: month + 1 };
  }

  /**
   * 指定した日付の投稿を取得
   * @param date 取得する日付
   * @returns 指定日の投稿配列
   */
  async getPostsForDate(date: Date): Promise<Post[]> {
    try {
      // 指定日の開始時刻と終了時刻を設定
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // 指定日の投稿を取得
      const posts = await this.dataService.getPostsByDateRange(startOfDay, endOfDay);
      
      // 作成日時の降順でソート
      return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('指定日の投稿取得に失敗しました:', error);
      throw new Error(`指定日の投稿取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * 日付範囲のバリデーション
   * @param year 年
   * @param month 月
   * @returns バリデーション結果
   */
  validateDateRange(year: number, month: number): { isValid: boolean; error?: string } {
    // 年の範囲チェック（1900年から2100年まで）
    if (year < 1900 || year > 2100) {
      return { isValid: false, error: '年は1900年から2100年の間で指定してください' };
    }

    // 月の範囲チェック
    if (month < 1 || month > 12) {
      return { isValid: false, error: '月は1から12の間で指定してください' };
    }

    return { isValid: true };
  }

  /**
   * カレンダーの週の開始日を取得（日曜日開始）
   * @param year 年
   * @param month 月
   * @returns 週の開始日（日曜日）の日付
   */
  getWeekStartDate(year: number, month: number): Date {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0: 日曜日, 1: 月曜日, ...
    
    // 月の最初の日が含まれる週の日曜日を計算
    const weekStartDate = new Date(firstDayOfMonth);
    weekStartDate.setDate(firstDayOfMonth.getDate() - dayOfWeek);
    
    return weekStartDate;
  }

  /**
   * カレンダーの週の終了日を取得（土曜日終了）
   * @param year 年
   * @param month 月
   * @returns 週の終了日（土曜日）の日付
   */
  getWeekEndDate(year: number, month: number): Date {
    const lastDayOfMonth = new Date(year, month, 0); // 月の最後の日
    const dayOfWeek = lastDayOfMonth.getDay(); // 0: 日曜日, 1: 月曜日, ...
    
    // 月の最後の日が含まれる週の土曜日を計算
    const weekEndDate = new Date(lastDayOfMonth);
    weekEndDate.setDate(lastDayOfMonth.getDate() + (6 - dayOfWeek));
    
    return weekEndDate;
  }
}