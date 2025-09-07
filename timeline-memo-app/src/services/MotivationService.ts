import type { Post, MotivationMessage } from '../types';

/**
 * 継続促進機能を提供するサービス
 * 投稿のない日の検出、促進メッセージの生成、達成通知の管理を行う
 */
export class MotivationService {
  /**
   * 最後の投稿からの経過日数を計算
   * @param posts 全投稿データ
   * @returns 最後の投稿からの経過日数
   */
  static calculateDaysSinceLastPost(posts: Post[]): number {
    if (posts.length === 0) return 0;

    // 投稿を日付順にソート（最新が先頭）
    const sortedPosts = [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const lastPost = sortedPosts[0];
    
    const today = new Date();
    const lastPostDate = new Date(lastPost.createdAt);
    
    // 日付のみで比較（時間は無視）
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastPostDateOnly = new Date(lastPostDate.getFullYear(), lastPostDate.getMonth(), lastPostDate.getDate());
    
    const diffTime = todayDateOnly.getTime() - lastPostDateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * 最後の投稿日を取得
   * @param posts 全投稿データ
   * @returns 最後の投稿日（投稿がない場合はnull）
   */
  static getLastPostDate(posts: Post[]): Date | null {
    if (posts.length === 0) return null;

    const sortedPosts = [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return sortedPosts[0].createdAt;
  }

  /**
   * 投稿促進メッセージを生成
   * @param daysSinceLastPost 最後の投稿からの経過日数
   * @returns 促進メッセージ（表示が必要な場合のみ）
   */
  static generateEncouragementMessage(daysSinceLastPost: number): MotivationMessage | null {
    // 3日以上投稿がない場合のみメッセージを表示
    if (daysSinceLastPost < 3) return null;

    const messages = [
      {
        title: '投稿をお待ちしています',
        message: `${daysSinceLastPost}日間投稿がありません。今日の出来事を記録してみませんか？`
      },
      {
        title: '記録を続けましょう',
        message: `${daysSinceLastPost}日ぶりの投稿はいかがですか？小さなことでも記録する価値があります。`
      },
      {
        title: '日記を再開しませんか',
        message: `${daysSinceLastPost}日間お疲れさまでした。今日から新しいスタートを切りましょう！`
      }
    ];

    // 経過日数に応じてメッセージを選択
    let messageIndex = 0;
    if (daysSinceLastPost >= 7) messageIndex = 1;
    if (daysSinceLastPost >= 14) messageIndex = 2;

    const selectedMessage = messages[messageIndex];
    const now = new Date();

    return {
      id: `encouragement-${now.getTime()}`,
      type: 'encouragement',
      title: selectedMessage.title,
      message: selectedMessage.message,
      daysSinceLastPost,
      isVisible: true,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24時間後に期限切れ
    };
  }

  /**
   * 連続投稿記録の達成通知を生成
   * @param currentStreak 現在の連続投稿日数
   * @param previousStreak 前回の最長記録
   * @returns 達成通知メッセージ（新記録の場合のみ）
   */
  static generateAchievementMessage(currentStreak: number, previousStreak: number): MotivationMessage | null {
    // 新記録でない場合、または連続日数が3日未満の場合は通知しない
    if (currentStreak <= previousStreak || currentStreak < 3) return null;

    const now = new Date();
    let title = '';
    let message = '';

    if (currentStreak === 3) {
      title = '3日連続達成！';
      message = '素晴らしい！3日連続で投稿を続けています。この調子で頑張りましょう！';
    } else if (currentStreak === 7) {
      title = '1週間連続達成！';
      message = '驚異的です！1週間連続で投稿を続けています。継続は力なりですね！';
    } else if (currentStreak === 30) {
      title = '1ヶ月連続達成！';
      message = '信じられません！1ヶ月間毎日投稿を続けています。あなたの継続力は素晴らしいです！';
    } else if (currentStreak % 10 === 0) {
      title = `${currentStreak}日連続達成！`;
      message = `${currentStreak}日間連続で投稿を続けています。あなたの継続力に感動しています！`;
    } else {
      // 特別な節目でない場合は通知しない
      return null;
    }

    return {
      id: `achievement-${now.getTime()}`,
      type: 'achievement',
      title,
      message,
      streakCount: currentStreak,
      isVisible: true,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7日後に期限切れ
    };
  }

  /**
   * 月末サマリーメッセージを生成
   * @param year 年
   * @param month 月（1-12）
   * @param monthlyPostCount その月の投稿数
   * @param monthlyActiveDays その月の投稿日数
   * @returns 月末サマリーメッセージ
   */
  static generateMonthlySummaryMessage(
    year: number, 
    month: number, 
    monthlyPostCount: number, 
    monthlyActiveDays: number
  ): MotivationMessage {
    const now = new Date();
    const monthName = `${year}年${month}月`;
    
    let title = `${monthName}のサマリー`;
    let message = '';

    if (monthlyPostCount === 0) {
      message = `${monthName}は投稿がありませんでした。来月は新しいスタートを切りましょう！`;
    } else if (monthlyActiveDays === 1) {
      message = `${monthName}は${monthlyPostCount}件の投稿がありました。来月はもう少し頻繁に記録してみませんか？`;
    } else {
      const averagePerDay = (monthlyPostCount / monthlyActiveDays).toFixed(1);
      message = `${monthName}は${monthlyActiveDays}日間で${monthlyPostCount}件の投稿がありました（1日平均${averagePerDay}件）。素晴らしい記録です！`;
    }

    return {
      id: `monthly-summary-${year}-${month}-${now.getTime()}`,
      type: 'reminder',
      title,
      message,
      isVisible: true,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7日後に期限切れ
    };
  }

  /**
   * 期限切れのメッセージをフィルタリング
   * @param messages 全メッセージ
   * @returns 有効なメッセージのみ
   */
  static filterValidMessages(messages: MotivationMessage[]): MotivationMessage[] {
    const now = new Date();
    return messages.filter(message => {
      if (!message.expiresAt) return true;
      return message.expiresAt.getTime() > now.getTime();
    });
  }

  /**
   * 連続投稿記録を計算
   * @param posts 全投稿データ
   * @returns 現在の連続日数と最長記録
   */
  static calculateStreakInfo(posts: Post[]): { current: number; longest: number } {
    if (posts.length === 0) return { current: 0, longest: 0 };

    // 投稿を日付でグループ化
    const postsByDate = new Map<string, Post[]>();
    posts.forEach(post => {
      const dateKey = post.createdAt.toISOString().split('T')[0];
      if (!postsByDate.has(dateKey)) {
        postsByDate.set(dateKey, []);
      }
      postsByDate.get(dateKey)!.push(post);
    });

    // 投稿がある日付を取得してソート
    const postDates = Array.from(postsByDate.keys()).sort();
    
    if (postDates.length === 0) return { current: 0, longest: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // 今日の日付
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // 昨日の日付
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 現在の連続記録を計算
    const latestDate = postDates[postDates.length - 1];
    if (latestDate === todayStr || latestDate === yesterdayStr) {
      currentStreak = 1;
      
      // 過去に遡って連続日数を計算
      for (let i = postDates.length - 2; i >= 0; i--) {
        const currentDate = new Date(postDates[i + 1]);
        const prevDate = new Date(postDates[i]);
        
        // 1日の差があるかチェック
        const diffTime = currentDate.getTime() - prevDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // 最長記録を計算
    for (let i = 1; i < postDates.length; i++) {
      const currentDate = new Date(postDates[i]);
      const prevDate = new Date(postDates[i - 1]);
      
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  }

  /**
   * 月末かどうかをチェック
   * @param date チェックする日付
   * @returns 月末の場合true
   */
  static isEndOfMonth(date: Date = new Date()): boolean {
    const tomorrow = new Date(date);
    tomorrow.setDate(date.getDate() + 1);
    return tomorrow.getMonth() !== date.getMonth();
  }

  /**
   * 投稿データから月間統計を計算
   * @param posts 全投稿データ
   * @param year 年
   * @param month 月（1-12）
   * @returns 月間統計
   */
  static calculateMonthlyStats(posts: Post[], year: number, month: number): { postCount: number; activeDays: number } {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    
    const monthlyPosts = posts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= monthStart && postDate <= monthEnd;
    });

    // 投稿がある日付を重複なしで取得
    const activeDates = new Set<string>();
    monthlyPosts.forEach(post => {
      const dateKey = post.createdAt.toISOString().split('T')[0];
      activeDates.add(dateKey);
    });

    return {
      postCount: monthlyPosts.length,
      activeDays: activeDates.size
    };
  }
}