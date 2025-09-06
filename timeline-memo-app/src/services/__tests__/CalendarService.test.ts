import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CalendarService } from '../CalendarService';
import type { DataService } from '../DataService';
import type { Post } from '../../types';

// モックのDataService
const mockDataService: DataService = {
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  getPost: vi.fn(),
  getAllPosts: vi.fn(),
  getPostsByDateRange: vi.fn(),
};

describe('CalendarService', () => {
  let calendarService: CalendarService;
  let mockPosts: Post[];

  beforeEach(() => {
    calendarService = new CalendarService(mockDataService);
    vi.clearAllMocks();

    // テスト用の投稿データを準備
    mockPosts = [
      {
        id: '1',
        content: '2024年1月1日の投稿',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: '2',
        content: '2024年1月1日の2つ目の投稿',
        createdAt: new Date('2024-01-01T15:00:00Z'),
        updatedAt: new Date('2024-01-01T15:00:00Z'),
      },
      {
        id: '3',
        content: '2024年1月15日の投稿',
        createdAt: new Date('2024-01-15T12:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
      },
    ];
  });

  describe('generateMonthlyCalendarData', () => {
    it('正常な年月でカレンダーデータを生成できる', async () => {
      // モックの設定
      vi.mocked(mockDataService.getPostsByDateRange).mockResolvedValue(mockPosts);

      // テスト実行
      const result = await calendarService.generateMonthlyCalendarData(2024, 1);

      // 検証
      expect(result).toHaveLength(31); // 2024年1月は31日
      expect(result[0].date.getDate()).toBe(1);
      expect(result[30].date.getDate()).toBe(31);
      
      // 1月1日は投稿があるのでhasPostがtrue
      expect(result[0].hasPost).toBe(true);
      expect(result[0].postCount).toBe(2);
      
      // 1月15日も投稿があるのでhasPostがtrue
      expect(result[14].hasPost).toBe(true);
      expect(result[14].postCount).toBe(1);
      
      // 投稿がない日はhasPostがfalse
      expect(result[1].hasPost).toBe(false);
      expect(result[1].postCount).toBe(0);
    });

    it('無効な月でエラーが発生する', async () => {
      await expect(calendarService.generateMonthlyCalendarData(2024, 0))
        .rejects.toThrow('月は1から12の間で指定してください');
      
      await expect(calendarService.generateMonthlyCalendarData(2024, 13))
        .rejects.toThrow('月は1から12の間で指定してください');
    });

    it('DataServiceでエラーが発生した場合、適切にエラーを処理する', async () => {
      // モックでエラーを発生させる
      vi.mocked(mockDataService.getPostsByDateRange).mockRejectedValue(new Error('データベースエラー'));

      await expect(calendarService.generateMonthlyCalendarData(2024, 1))
        .rejects.toThrow('月別カレンダーデータの生成に失敗しました');
    });
  });

  describe('calculatePostHighlights', () => {
    it('カレンダーデータのハイライト計算を実行する', () => {
      const calendarDays = [
        {
          date: new Date('2024-01-01'),
          hasPost: true,
          postCount: 2,
          isToday: false,
          isSelected: false,
        },
        {
          date: new Date('2024-01-02'),
          hasPost: false,
          postCount: 0,
          isToday: false,
          isSelected: false,
        },
      ];

      const result = calendarService.calculatePostHighlights(calendarDays);

      // 現在の実装では元のデータをそのまま返す
      expect(result).toEqual(calendarDays);
    });
  });

  describe('updateDateSelection', () => {
    it('指定した日付を選択状態に更新する', () => {
      const calendarDays = [
        {
          date: new Date('2024-01-01'),
          hasPost: true,
          postCount: 2,
          isToday: false,
          isSelected: false,
        },
        {
          date: new Date('2024-01-02'),
          hasPost: false,
          postCount: 0,
          isToday: false,
          isSelected: false,
        },
      ];

      const selectedDate = new Date('2024-01-01');
      const result = calendarService.updateDateSelection(calendarDays, selectedDate);

      expect(result[0].isSelected).toBe(true);
      expect(result[1].isSelected).toBe(false);
    });

    it('nullを指定した場合、全ての日付を非選択状態にする', () => {
      const calendarDays = [
        {
          date: new Date('2024-01-01'),
          hasPost: true,
          postCount: 2,
          isToday: false,
          isSelected: true,
        },
        {
          date: new Date('2024-01-02'),
          hasPost: false,
          postCount: 0,
          isToday: false,
          isSelected: true,
        },
      ];

      const result = calendarService.updateDateSelection(calendarDays, null);

      expect(result[0].isSelected).toBe(false);
      expect(result[1].isSelected).toBe(false);
    });
  });

  describe('getPreviousMonth', () => {
    it('通常の月の前月を取得する', () => {
      const result = calendarService.getPreviousMonth(2024, 6);
      expect(result).toEqual({ year: 2024, month: 5 });
    });

    it('1月の前月（前年の12月）を取得する', () => {
      const result = calendarService.getPreviousMonth(2024, 1);
      expect(result).toEqual({ year: 2023, month: 12 });
    });
  });

  describe('getNextMonth', () => {
    it('通常の月の次月を取得する', () => {
      const result = calendarService.getNextMonth(2024, 6);
      expect(result).toEqual({ year: 2024, month: 7 });
    });

    it('12月の次月（翌年の1月）を取得する', () => {
      const result = calendarService.getNextMonth(2024, 12);
      expect(result).toEqual({ year: 2025, month: 1 });
    });
  });

  describe('getPostsForDate', () => {
    it('指定した日付の投稿を取得する', async () => {
      const targetDate = new Date('2024-01-01');
      // 2024年1月1日の投稿を直接指定
      const expectedPosts = [
        {
          id: '1',
          content: '2024年1月1日の投稿',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          content: '2024年1月1日の2つ目の投稿',
          createdAt: new Date('2024-01-01T15:00:00Z'),
          updatedAt: new Date('2024-01-01T15:00:00Z'),
        },
      ];

      vi.mocked(mockDataService.getPostsByDateRange).mockResolvedValue(expectedPosts);

      const result = await calendarService.getPostsForDate(targetDate);

      expect(result).toHaveLength(2);
      expect(result[0].createdAt.getTime()).toBeGreaterThan(result[1].createdAt.getTime()); // 降順ソート確認
    });

    it('投稿がない日付で空配列を返す', async () => {
      const targetDate = new Date('2024-01-02');
      vi.mocked(mockDataService.getPostsByDateRange).mockResolvedValue([]);

      const result = await calendarService.getPostsForDate(targetDate);

      expect(result).toEqual([]);
    });

    it('DataServiceでエラーが発生した場合、適切にエラーを処理する', async () => {
      const targetDate = new Date('2024-01-01');
      vi.mocked(mockDataService.getPostsByDateRange).mockRejectedValue(new Error('データベースエラー'));

      await expect(calendarService.getPostsForDate(targetDate))
        .rejects.toThrow('指定日の投稿取得に失敗しました');
    });
  });

  describe('validateDateRange', () => {
    it('有効な年月でバリデーションが成功する', () => {
      const result = calendarService.validateDateRange(2024, 6);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('無効な年でバリデーションが失敗する', () => {
      const result1 = calendarService.validateDateRange(1899, 6);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('年は1900年から2100年の間で指定してください');

      const result2 = calendarService.validateDateRange(2101, 6);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('年は1900年から2100年の間で指定してください');
    });

    it('無効な月でバリデーションが失敗する', () => {
      const result1 = calendarService.validateDateRange(2024, 0);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('月は1から12の間で指定してください');

      const result2 = calendarService.validateDateRange(2024, 13);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('月は1から12の間で指定してください');
    });
  });

  describe('getWeekStartDate', () => {
    it('月の最初の週の日曜日を取得する', () => {
      // 2024年1月1日は月曜日なので、週の開始は2023年12月31日（日曜日）
      const result = calendarService.getWeekStartDate(2024, 1);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11); // 12月（0ベース）
      expect(result.getDate()).toBe(31);
      expect(result.getDay()).toBe(0); // 日曜日
    });
  });

  describe('getWeekEndDate', () => {
    it('月の最後の週の土曜日を取得する', () => {
      // 2024年1月31日は水曜日なので、週の終了は2024年2月3日（土曜日）
      const result = calendarService.getWeekEndDate(2024, 1);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // 2月（0ベース）
      expect(result.getDate()).toBe(3);
      expect(result.getDay()).toBe(6); // 土曜日
    });
  });
});