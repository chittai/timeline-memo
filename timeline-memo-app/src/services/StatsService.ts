import type { Post } from '../types';

/**
 * 日記統計情報の型定義
 */
export interface DiaryStats {
  totalPosts: number;           // 総投稿数
  totalDays: number;            // 投稿した日数
  currentStreak: number;        // 現在の連続投稿日数
  longestStreak: number;        // 最長連続投稿日数
  thisMonthPosts: number;       // 今月の投稿数
  averagePostsPerDay: number;   // 1日あたりの平均投稿数
}

/**
 * 月間サマリー情報の型定義
 */
export interface MonthlySummary {
  year: number;
  month: number;
  postCount: number;
  activeDays: number;
  averagePostsPerDay: number;
  longestStreakInMonth: number;
}

/**
 * 継続日数計算結果の型定義
 */
export interface StreakResult {
  current: number;
  longest: number;
}

/**
 * 日記統計サービス
 * 投稿データから各種統計情報を計算する
 */
export class StatsService {
  /**
   * 投稿データから包括的な統計情報を計算
   * @param posts 投稿データの配列
   * @returns 統計情報
   */
  static calculateDiaryStats(posts: Post[]): DiaryStats {
    if (posts.length === 0) {
      return {
        totalPosts: 0,
        totalDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        thisMonthPosts: 0,
        averagePostsPerDay: 0
      };
    }

    // 投稿を日付でグループ化
    const postsByDate = this.groupPostsByDate(posts);
    const uniqueDates = Array.from(postsByDate.keys()).sort();
    
    // 基本統計
    const totalPosts = posts.length;
    const totalDays = uniqueDates.length;
    
    // 継続日数計算
    const streakResult = this.calculateStreak(uniqueDates);
    
    // 今月の投稿数計算
    const thisMonthPosts = this.calculateThisMonthPosts(posts);
    
    // 平均投稿数計算
    const averagePostsPerDay = totalDays > 0 ? totalPosts / totalDays : 0;

    return {
      totalPosts,
      totalDays,
      currentStreak: streakResult.current,
      longestStreak: streakResult.longest,
      thisMonthPosts,
      averagePostsPerDay: Math.round(averagePostsPerDay * 100) / 100 // 小数点以下2桁
    };
  }

  /**
   * 継続日数を計算するアルゴリズム
   * @param sortedDates ソート済みの日付文字列配列（YYYY-MM-DD形式）
   * @returns 現在の継続日数と最長継続日数
   */
  static calculateStreak(sortedDates: string[]): StreakResult {
    if (sortedDates.length === 0) {
      return { current: 0, longest: 0 };
    }

    const today = new Date();
    const todayStr = this.formatDateToString(today);
    const yesterdayStr = this.formatDateToString(new Date(today.getTime() - 24 * 60 * 60 * 1000));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // 現在の継続日数を計算
    // 今日または昨日に投稿があるかチェック
    const hasPostToday = sortedDates.includes(todayStr);
    const hasPostYesterday = sortedDates.includes(yesterdayStr);
    
    if (hasPostToday || hasPostYesterday) {
      // 最新の投稿日から遡って継続日数を計算
      const startDate = hasPostToday ? todayStr : yesterdayStr;
      currentStreak = this.calculateStreakFromDate(sortedDates, startDate);
    }

    // 最長継続日数を計算
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currentDate = new Date(sortedDates[i]);
      const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));

      if (dayDiff === 1) {
        // 連続している場合
        tempStreak++;
      } else {
        // 連続が途切れた場合
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    // 最後のストリークもチェック
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  }

  /**
   * 指定した日付から遡って継続日数を計算
   * @param sortedDates ソート済みの日付配列
   * @param startDate 開始日（YYYY-MM-DD形式）
   * @returns 継続日数
   */
  private static calculateStreakFromDate(sortedDates: string[], startDate: string): number {
    let streak = 0;
    let currentDate = new Date(startDate);

    while (true) {
      const dateStr = this.formatDateToString(currentDate);
      if (sortedDates.includes(dateStr)) {
        streak++;
        // 前日に移動
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 今月の投稿数を計算
   * @param posts 投稿データの配列
   * @returns 今月の投稿数
   */
  static calculateThisMonthPosts(posts: Post[]): number {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return posts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= thisMonthStart && postDate < nextMonthStart;
    }).length;
  }

  /**
   * 指定した年月の月間サマリーを生成
   * @param posts 投稿データの配列
   * @param year 年
   * @param month 月（1-12）
   * @returns 月間サマリー
   */
  static generateMonthlySummary(posts: Post[], year: number, month: number): MonthlySummary {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    // 指定月の投稿をフィルタリング
    const monthPosts = posts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= monthStart && postDate < monthEnd;
    });

    if (monthPosts.length === 0) {
      return {
        year,
        month,
        postCount: 0,
        activeDays: 0,
        averagePostsPerDay: 0,
        longestStreakInMonth: 0
      };
    }

    // 月内の投稿を日付でグループ化
    const postsByDate = this.groupPostsByDate(monthPosts);
    const uniqueDates = Array.from(postsByDate.keys()).sort();
    
    const postCount = monthPosts.length;
    const activeDays = uniqueDates.length;
    const averagePostsPerDay = activeDays > 0 ? postCount / activeDays : 0;
    
    // 月内での最長継続日数を計算
    const longestStreakInMonth = this.calculateLongestStreakInPeriod(uniqueDates);

    return {
      year,
      month,
      postCount,
      activeDays,
      averagePostsPerDay: Math.round(averagePostsPerDay * 100) / 100,
      longestStreakInMonth
    };
  }

  /**
   * 指定期間内での最長継続日数を計算
   * @param sortedDates ソート済みの日付配列
   * @returns 最長継続日数
   */
  private static calculateLongestStreakInPeriod(sortedDates: string[]): number {
    if (sortedDates.length === 0) return 0;
    if (sortedDates.length === 1) return 1;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currentDate = new Date(sortedDates[i]);
      const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));

      if (dayDiff === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }

    return Math.max(longestStreak, currentStreak);
  }

  /**
   * 投稿を日付でグループ化
   * @param posts 投稿データの配列
   * @returns 日付をキーとした投稿のマップ
   */
  private static groupPostsByDate(posts: Post[]): Map<string, Post[]> {
    const grouped = new Map<string, Post[]>();

    posts.forEach(post => {
      const dateKey = this.formatDateToString(new Date(post.createdAt));
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(post);
    });

    return grouped;
  }

  /**
   * 日付をYYYY-MM-DD形式の文字列に変換
   * @param date 日付オブジェクト
   * @returns YYYY-MM-DD形式の文字列
   */
  private static formatDateToString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 投稿促進メッセージを生成
   * @param stats 統計情報
   * @returns 促進メッセージ（必要な場合のみ）
   */
  static generateMotivationMessage(stats: DiaryStats): string | null {
    
    // 現在の継続日数が0で、かつ総投稿数が0でない場合は投稿を促す
    if (stats.currentStreak === 0 && stats.totalPosts > 0) {
      return '投稿が途切れています。今日も何か記録してみませんか？';
    }
    
    // 継続日数が特定の節目に達した場合の祝福メッセージ
    if (stats.currentStreak > 0) {
      if (stats.currentStreak === 7) {
        return '🎉 1週間連続投稿達成！素晴らしい継続力です！';
      } else if (stats.currentStreak === 30) {
        return '🎉 1ヶ月連続投稿達成！習慣化できていますね！';
      } else if (stats.currentStreak === 100) {
        return '🎉 100日連続投稿達成！驚異的な継続力です！';
      } else if (stats.currentStreak % 50 === 0 && stats.currentStreak > 0) {
        return `🎉 ${stats.currentStreak}日連続投稿達成！継続は力なりですね！`;
      }
    }

    return null;
  }
}