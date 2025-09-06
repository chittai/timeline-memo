import { describe, it, expect, beforeEach } from 'vitest';
import { StatsService, DiaryStats, MonthlySummary } from '../StatsService';
import { Post } from '../../types';

describe('StatsService', () => {
  let mockPosts: Post[];

  beforeEach(() => {
    // テスト用のモックデータを準備
    mockPosts = [
      {
        id: '1',
        content: '今日は良い天気でした',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: '2',
        content: '昨日の続きです',
        createdAt: new Date('2024-01-02T11:00:00Z'),
        updatedAt: new Date('2024-01-02T11:00:00Z')
      },
      {
        id: '3',
        content: '連続3日目',
        createdAt: new Date('2024-01-03T12:00:00Z'),
        updatedAt: new Date('2024-01-03T12:00:00Z')
      },
      {
        id: '4',
        content: '同じ日の2つ目の投稿',
        createdAt: new Date('2024-01-03T15:00:00Z'),
        updatedAt: new Date('2024-01-03T15:00:00Z')
      },
      {
        id: '5',
        content: '1日空けて投稿',
        createdAt: new Date('2024-01-05T09:00:00Z'),
        updatedAt: new Date('2024-01-05T09:00:00Z')
      }
    ];
  });

  describe('calculateDiaryStats', () => {
    it('空の投稿配列に対して正しい統計を返す', () => {
      const stats = StatsService.calculateDiaryStats([]);
      
      expect(stats).toEqual({
        totalPosts: 0,
        totalDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        thisMonthPosts: 0,
        averagePostsPerDay: 0
      });
    });

    it('基本的な統計情報を正しく計算する', () => {
      const stats = StatsService.calculateDiaryStats(mockPosts);
      
      expect(stats.totalPosts).toBe(5);
      expect(stats.totalDays).toBe(4); // 1/1, 1/2, 1/3, 1/5の4日
      expect(stats.averagePostsPerDay).toBe(1.25); // 5投稿 / 4日
    });

    it('今月の投稿数を正しく計算する', () => {
      // 現在の月の投稿を作成
      const currentDate = new Date();
      const thisMonthPosts: Post[] = [
        {
          id: 'current1',
          content: '今月の投稿1',
          createdAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
          updatedAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        },
        {
          id: 'current2',
          content: '今月の投稿2',
          createdAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
          updatedAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15)
        }
      ];

      const stats = StatsService.calculateDiaryStats([...mockPosts, ...thisMonthPosts]);
      expect(stats.thisMonthPosts).toBe(2);
    });
  });

  describe('calculateStreak', () => {
    it('空の配列に対して0を返す', () => {
      const result = StatsService.calculateStreak([]);
      expect(result).toEqual({ current: 0, longest: 0 });
    });

    it('連続する日付の継続日数を正しく計算する', () => {
      const dates = ['2024-01-01', '2024-01-02', '2024-01-03'];
      const result = StatsService.calculateStreak(dates);
      
      expect(result.longest).toBe(3);
    });

    it('途切れた継続日数を正しく計算する', () => {
      const dates = ['2024-01-01', '2024-01-02', '2024-01-04', '2024-01-05', '2024-01-06'];
      const result = StatsService.calculateStreak(dates);
      
      expect(result.longest).toBe(3); // 1/4, 1/5, 1/6の3日が最長
    });

    it('単一の日付に対して1を返す', () => {
      const dates = ['2024-01-01'];
      const result = StatsService.calculateStreak(dates);
      
      expect(result.longest).toBe(1);
    });

    it('現在の継続日数を正しく計算する（今日投稿がある場合）', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const dayBeforeYesterday = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      
      const dates = [
        dayBeforeYesterday.toISOString().split('T')[0],
        yesterday.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      ].sort();
      
      const result = StatsService.calculateStreak(dates);
      expect(result.current).toBe(3);
    });

    it('現在の継続日数を正しく計算する（昨日投稿がある場合）', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const dayBeforeYesterday = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      
      const dates = [
        dayBeforeYesterday.toISOString().split('T')[0],
        yesterday.toISOString().split('T')[0]
      ].sort();
      
      const result = StatsService.calculateStreak(dates);
      expect(result.current).toBe(2);
    });
  });

  describe('calculateThisMonthPosts', () => {
    it('今月の投稿数を正しく計算する', () => {
      const currentDate = new Date();
      const thisMonthPosts: Post[] = [
        {
          id: '1',
          content: '今月の投稿1',
          createdAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
          updatedAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        },
        {
          id: '2',
          content: '今月の投稿2',
          createdAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
          updatedAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15)
        },
        {
          id: '3',
          content: '先月の投稿',
          createdAt: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15),
          updatedAt: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15)
        }
      ];

      const count = StatsService.calculateThisMonthPosts(thisMonthPosts);
      expect(count).toBe(2);
    });

    it('投稿がない場合は0を返す', () => {
      const count = StatsService.calculateThisMonthPosts([]);
      expect(count).toBe(0);
    });
  });

  describe('generateMonthlySummary', () => {
    it('指定月の月間サマリーを正しく生成する', () => {
      const summary = StatsService.generateMonthlySummary(mockPosts, 2024, 1);
      
      expect(summary.year).toBe(2024);
      expect(summary.month).toBe(1);
      expect(summary.postCount).toBe(5);
      expect(summary.activeDays).toBe(4);
      expect(summary.averagePostsPerDay).toBe(1.25);
      expect(summary.longestStreakInMonth).toBe(3); // 1/1, 1/2, 1/3
    });

    it('投稿がない月のサマリーを正しく生成する', () => {
      const summary = StatsService.generateMonthlySummary(mockPosts, 2024, 2);
      
      expect(summary).toEqual({
        year: 2024,
        month: 2,
        postCount: 0,
        activeDays: 0,
        averagePostsPerDay: 0,
        longestStreakInMonth: 0
      });
    });

    it('月をまたがる投稿を正しく分離する', () => {
      const crossMonthPosts: Post[] = [
        {
          id: '1',
          content: '1月の投稿',
          createdAt: new Date(2024, 0, 31, 12, 0, 0), // 2024年1月31日 12:00
          updatedAt: new Date(2024, 0, 31, 12, 0, 0)
        },
        {
          id: '2',
          content: '2月の投稿',
          createdAt: new Date(2024, 1, 1, 12, 0, 0), // 2024年2月1日 12:00
          updatedAt: new Date(2024, 1, 1, 12, 0, 0)
        }
      ];

      const januarySummary = StatsService.generateMonthlySummary(crossMonthPosts, 2024, 1);
      const februarySummary = StatsService.generateMonthlySummary(crossMonthPosts, 2024, 2);
      
      expect(januarySummary.postCount).toBe(1);
      expect(februarySummary.postCount).toBe(1);
    });
  });

  describe('generateMotivationMessage', () => {
    it('継続が途切れた場合に促進メッセージを返す', () => {
      const stats: DiaryStats = {
        totalPosts: 10,
        totalDays: 5,
        currentStreak: 0,
        longestStreak: 5,
        thisMonthPosts: 3,
        averagePostsPerDay: 2
      };

      const message = StatsService.generateMotivationMessage(stats);
      expect(message).toBe('投稿が途切れています。今日も何か記録してみませんか？');
    });

    it('7日連続達成時に祝福メッセージを返す', () => {
      const stats: DiaryStats = {
        totalPosts: 7,
        totalDays: 7,
        currentStreak: 7,
        longestStreak: 7,
        thisMonthPosts: 7,
        averagePostsPerDay: 1
      };

      const message = StatsService.generateMotivationMessage(stats);
      expect(message).toBe('🎉 1週間連続投稿達成！素晴らしい継続力です！');
    });

    it('30日連続達成時に祝福メッセージを返す', () => {
      const stats: DiaryStats = {
        totalPosts: 30,
        totalDays: 30,
        currentStreak: 30,
        longestStreak: 30,
        thisMonthPosts: 30,
        averagePostsPerDay: 1
      };

      const message = StatsService.generateMotivationMessage(stats);
      expect(message).toBe('🎉 1ヶ月連続投稿達成！習慣化できていますね！');
    });

    it('100日連続達成時に祝福メッセージを返す', () => {
      const stats: DiaryStats = {
        totalPosts: 100,
        totalDays: 100,
        currentStreak: 100,
        longestStreak: 100,
        thisMonthPosts: 30,
        averagePostsPerDay: 1
      };

      const message = StatsService.generateMotivationMessage(stats);
      expect(message).toBe('🎉 100日連続投稿達成！驚異的な継続力です！');
    });

    it('50の倍数達成時に祝福メッセージを返す', () => {
      const stats: DiaryStats = {
        totalPosts: 150,
        totalDays: 150,
        currentStreak: 150,
        longestStreak: 150,
        thisMonthPosts: 30,
        averagePostsPerDay: 1
      };

      const message = StatsService.generateMotivationMessage(stats);
      expect(message).toBe('🎉 150日連続投稿達成！継続は力なりですね！');
    });

    it('特別な条件に該当しない場合はnullを返す', () => {
      const stats: DiaryStats = {
        totalPosts: 5,
        totalDays: 5,
        currentStreak: 3,
        longestStreak: 5,
        thisMonthPosts: 3,
        averagePostsPerDay: 1
      };

      const message = StatsService.generateMotivationMessage(stats);
      expect(message).toBeNull();
    });

    it('初回投稿の場合はnullを返す', () => {
      const stats: DiaryStats = {
        totalPosts: 0,
        totalDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        thisMonthPosts: 0,
        averagePostsPerDay: 0
      };

      const message = StatsService.generateMotivationMessage(stats);
      expect(message).toBeNull();
    });
  });
});