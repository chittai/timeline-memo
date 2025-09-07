import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MotivationService } from '../MotivationService';
import { Post } from '../../types';

describe('MotivationService', () => {
  let mockPosts: Post[];

  beforeEach(() => {
    // モックの日付を固定（2024年1月15日）
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

    mockPosts = [
      {
        id: '1',
        content: '今日の投稿',
        createdAt: new Date('2024-01-15T09:00:00Z'), // 今日
        updatedAt: new Date('2024-01-15T09:00:00Z'),
      },
      {
        id: '2',
        content: '昨日の投稿',
        createdAt: new Date('2024-01-14T09:00:00Z'), // 昨日
        updatedAt: new Date('2024-01-14T09:00:00Z'),
      },
      {
        id: '3',
        content: '一昨日の投稿',
        createdAt: new Date('2024-01-13T09:00:00Z'), // 一昨日
        updatedAt: new Date('2024-01-13T09:00:00Z'),
      },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateDaysSinceLastPost', () => {
    it('投稿がない場合は0を返す', () => {
      const result = MotivationService.calculateDaysSinceLastPost([]);
      expect(result).toBe(0);
    });

    it('今日投稿がある場合は0を返す', () => {
      const result = MotivationService.calculateDaysSinceLastPost(mockPosts);
      expect(result).toBe(0);
    });

    it('昨日が最後の投稿の場合は1を返す', () => {
      const postsWithoutToday = mockPosts.slice(1); // 今日の投稿を除外
      const result = MotivationService.calculateDaysSinceLastPost(postsWithoutToday);
      expect(result).toBe(1);
    });

    it('3日前が最後の投稿の場合は3を返す', () => {
      const oldPosts: Post[] = [
        {
          id: '1',
          content: '3日前の投稿',
          createdAt: new Date('2024-01-12T09:00:00Z'),
          updatedAt: new Date('2024-01-12T09:00:00Z'),
        },
      ];
      const result = MotivationService.calculateDaysSinceLastPost(oldPosts);
      expect(result).toBe(3);
    });
  });

  describe('getLastPostDate', () => {
    it('投稿がない場合はnullを返す', () => {
      const result = MotivationService.getLastPostDate([]);
      expect(result).toBeNull();
    });

    it('最新の投稿日を返す', () => {
      const result = MotivationService.getLastPostDate(mockPosts);
      expect(result).toEqual(new Date('2024-01-15T09:00:00Z'));
    });

    it('投稿が順不同でも最新の投稿日を返す', () => {
      const shuffledPosts = [mockPosts[1], mockPosts[2], mockPosts[0]]; // 順序を変更
      const result = MotivationService.getLastPostDate(shuffledPosts);
      expect(result).toEqual(new Date('2024-01-15T09:00:00Z'));
    });
  });

  describe('generateEncouragementMessage', () => {
    it('3日未満の場合はnullを返す', () => {
      const result = MotivationService.generateEncouragementMessage(2);
      expect(result).toBeNull();
    });

    it('3日以上の場合は促進メッセージを返す', () => {
      const result = MotivationService.generateEncouragementMessage(3);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('encouragement');
      expect(result!.daysSinceLastPost).toBe(3);
      expect(result!.message).toContain('3日間投稿がありません');
    });

    it('7日以上の場合は異なるメッセージを返す', () => {
      const result = MotivationService.generateEncouragementMessage(7);
      expect(result).not.toBeNull();
      expect(result!.message).toContain('7日ぶりの投稿');
    });

    it('14日以上の場合は再開メッセージを返す', () => {
      const result = MotivationService.generateEncouragementMessage(14);
      expect(result).not.toBeNull();
      expect(result!.message).toContain('新しいスタート');
    });

    it('生成されたメッセージには適切な期限が設定される', () => {
      const result = MotivationService.generateEncouragementMessage(5);
      expect(result).not.toBeNull();
      expect(result!.expiresAt).toBeDefined();
      
      const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(result!.expiresAt!.getTime()).toBeCloseTo(expectedExpiry.getTime(), -1000);
    });
  });

  describe('generateAchievementMessage', () => {
    it('新記録でない場合はnullを返す', () => {
      const result = MotivationService.generateAchievementMessage(5, 10);
      expect(result).toBeNull();
    });

    it('3日未満の場合はnullを返す', () => {
      const result = MotivationService.generateAchievementMessage(2, 1);
      expect(result).toBeNull();
    });

    it('3日連続の新記録の場合は達成メッセージを返す', () => {
      const result = MotivationService.generateAchievementMessage(3, 2);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('achievement');
      expect(result!.title).toBe('3日連続達成！');
      expect(result!.streakCount).toBe(3);
    });

    it('7日連続の場合は1週間達成メッセージを返す', () => {
      const result = MotivationService.generateAchievementMessage(7, 5);
      expect(result).not.toBeNull();
      expect(result!.title).toBe('1週間連続達成！');
    });

    it('30日連続の場合は1ヶ月達成メッセージを返す', () => {
      const result = MotivationService.generateAchievementMessage(30, 20);
      expect(result).not.toBeNull();
      expect(result!.title).toBe('1ヶ月連続達成！');
    });

    it('10の倍数の場合は汎用達成メッセージを返す', () => {
      const result = MotivationService.generateAchievementMessage(20, 15);
      expect(result).not.toBeNull();
      expect(result!.title).toBe('20日連続達成！');
    });

    it('特別な節目でない場合はnullを返す', () => {
      const result = MotivationService.generateAchievementMessage(5, 4);
      expect(result).toBeNull();
    });
  });

  describe('generateMonthlySummaryMessage', () => {
    it('投稿がない月のサマリーメッセージを生成', () => {
      const result = MotivationService.generateMonthlySummaryMessage(2024, 1, 0, 0);
      expect(result.type).toBe('reminder');
      expect(result.title).toBe('2024年1月のサマリー');
      expect(result.message).toContain('投稿がありませんでした');
    });

    it('1日だけ投稿がある月のサマリーメッセージを生成', () => {
      const result = MotivationService.generateMonthlySummaryMessage(2024, 1, 3, 1);
      expect(result.message).toContain('3件の投稿がありました');
      expect(result.message).toContain('もう少し頻繁に');
    });

    it('複数日投稿がある月のサマリーメッセージを生成', () => {
      const result = MotivationService.generateMonthlySummaryMessage(2024, 1, 15, 10);
      expect(result.message).toContain('10日間で15件');
      expect(result.message).toContain('1日平均1.5件');
      expect(result.message).toContain('素晴らしい記録');
    });
  });

  describe('filterValidMessages', () => {
    it('期限切れでないメッセージのみを返す', () => {
      const now = new Date();
      const validMessage = {
        id: '1',
        type: 'encouragement' as const,
        title: '有効なメッセージ',
        message: 'テスト',
        isVisible: true,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 60000) // 1分後に期限切れ
      };
      
      const expiredMessage = {
        id: '2',
        type: 'encouragement' as const,
        title: '期限切れメッセージ',
        message: 'テスト',
        isVisible: true,
        createdAt: now,
        expiresAt: new Date(now.getTime() - 60000) // 1分前に期限切れ
      };

      const result = MotivationService.filterValidMessages([validMessage, expiredMessage]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('期限が設定されていないメッセージは常に有効', () => {
      const now = new Date();
      const messageWithoutExpiry = {
        id: '1',
        type: 'encouragement' as const,
        title: '期限なしメッセージ',
        message: 'テスト',
        isVisible: true,
        createdAt: now
      };

      const result = MotivationService.filterValidMessages([messageWithoutExpiry]);
      expect(result).toHaveLength(1);
    });
  });

  describe('calculateStreakInfo', () => {
    it('投稿がない場合は0を返す', () => {
      const result = MotivationService.calculateStreakInfo([]);
      expect(result).toEqual({ current: 0, longest: 0 });
    });

    it('今日投稿がある場合の連続記録を計算', () => {
      const result = MotivationService.calculateStreakInfo(mockPosts);
      expect(result.current).toBe(3); // 3日連続
      expect(result.longest).toBe(3);
    });

    it('昨日が最後の投稿の場合も連続記録に含む', () => {
      const postsWithoutToday = mockPosts.slice(1);
      const result = MotivationService.calculateStreakInfo(postsWithoutToday);
      expect(result.current).toBe(2); // 昨日から2日連続
    });

    it('連続でない投稿の場合は現在の連続記録は0', () => {
      const nonConsecutivePosts: Post[] = [
        {
          id: '1',
          content: '古い投稿',
          createdAt: new Date('2024-01-10T09:00:00Z'), // 5日前
          updatedAt: new Date('2024-01-10T09:00:00Z'),
        },
      ];
      const result = MotivationService.calculateStreakInfo(nonConsecutivePosts);
      expect(result.current).toBe(0);
    });

    it('最長記録を正しく計算', () => {
      const postsWithGap: Post[] = [
        // 最初の連続期間（3日）
        {
          id: '1',
          content: '投稿1',
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T09:00:00Z'),
        },
        {
          id: '2',
          content: '投稿2',
          createdAt: new Date('2024-01-02T09:00:00Z'),
          updatedAt: new Date('2024-01-02T09:00:00Z'),
        },
        {
          id: '3',
          content: '投稿3',
          createdAt: new Date('2024-01-03T09:00:00Z'),
          updatedAt: new Date('2024-01-03T09:00:00Z'),
        },
        // ギャップ
        // 2回目の連続期間（2日）
        {
          id: '4',
          content: '投稿4',
          createdAt: new Date('2024-01-10T09:00:00Z'),
          updatedAt: new Date('2024-01-10T09:00:00Z'),
        },
        {
          id: '5',
          content: '投稿5',
          createdAt: new Date('2024-01-11T09:00:00Z'),
          updatedAt: new Date('2024-01-11T09:00:00Z'),
        },
      ];

      const result = MotivationService.calculateStreakInfo(postsWithGap);
      expect(result.longest).toBe(3); // 最初の3日連続が最長
    });
  });

  describe('isEndOfMonth', () => {
    it('月末の場合はtrueを返す', () => {
      const endOfMonth = new Date('2024-01-31T10:00:00Z');
      const result = MotivationService.isEndOfMonth(endOfMonth);
      expect(result).toBe(true);
    });

    it('月末でない場合はfalseを返す', () => {
      const middleOfMonth = new Date('2024-01-15T10:00:00Z');
      const result = MotivationService.isEndOfMonth(middleOfMonth);
      expect(result).toBe(false);
    });

    it('2月末（うるう年）の場合はtrueを返す', () => {
      const leapYearFeb = new Date('2024-02-29T10:00:00Z');
      const result = MotivationService.isEndOfMonth(leapYearFeb);
      expect(result).toBe(true);
    });
  });

  describe('calculateMonthlyStats', () => {
    it('指定月の統計を正しく計算', () => {
      const monthlyPosts: Post[] = [
        {
          id: '1',
          content: '1月1日の投稿',
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T09:00:00Z'),
        },
        {
          id: '2',
          content: '1月1日の2つ目の投稿',
          createdAt: new Date('2024-01-01T15:00:00Z'),
          updatedAt: new Date('2024-01-01T15:00:00Z'),
        },
        {
          id: '3',
          content: '1月2日の投稿',
          createdAt: new Date('2024-01-02T09:00:00Z'),
          updatedAt: new Date('2024-01-02T09:00:00Z'),
        },
        {
          id: '4',
          content: '2月の投稿（除外される）',
          createdAt: new Date('2024-02-01T09:00:00Z'),
          updatedAt: new Date('2024-02-01T09:00:00Z'),
        },
      ];

      const result = MotivationService.calculateMonthlyStats(monthlyPosts, 2024, 1);
      expect(result.postCount).toBe(3); // 1月の投稿は3件
      expect(result.activeDays).toBe(2); // 投稿日は2日（1日と2日）
    });

    it('投稿がない月の統計を計算', () => {
      const result = MotivationService.calculateMonthlyStats([], 2024, 1);
      expect(result.postCount).toBe(0);
      expect(result.activeDays).toBe(0);
    });
  });
});