import {
  formatTime,
  formatDate,
  formatDateTime,
  isToday,
  getTimeRange
} from '../dateUtils';

// テスト用の固定日時
const testDate = new Date('2024-01-15T14:30:45.123Z');
const testDate2 = new Date('2024-01-16T09:15:30.456Z');

describe('dateUtils', () => {
  describe('formatTime', () => {
    it('時刻を正しい形式でフォーマットする', () => {
      // 日本時間での表示をテスト（UTC+9）
      const result = formatTime(testDate);
      expect(result).toMatch(/^\d{2}:\d{2}$/);
      expect(typeof result).toBe('string');
    });

    it('異なる時刻で正しくフォーマットする', () => {
      const morningTime = new Date('2024-01-15T00:05:00.000Z');
      const eveningTime = new Date('2024-01-15T23:59:00.000Z');
      
      const morningResult = formatTime(morningTime);
      const eveningResult = formatTime(eveningTime);
      
      expect(morningResult).toMatch(/^\d{2}:\d{2}$/);
      expect(eveningResult).toMatch(/^\d{2}:\d{2}$/);
    });

    it('無効な日付でエラーを投げない', () => {
      const invalidDate = new Date('invalid');
      expect(() => formatTime(invalidDate)).not.toThrow();
    });
  });

  describe('formatDate', () => {
    it('日付を正しい形式でフォーマットする', () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
      expect(typeof result).toBe('string');
    });

    it('異なる年月日で正しくフォーマットする', () => {
      const newYear = new Date('2024-01-01T12:00:00.000Z');
      const endYear = new Date('2024-12-31T12:00:00.000Z');
      
      const newYearResult = formatDate(newYear);
      const endYearResult = formatDate(endYear);
      
      expect(newYearResult).toMatch(/^2024\/01\/\d{2}$/);
      expect(endYearResult).toMatch(/^2024\/12\/\d{2}$/);
    });

    it('うるう年を正しく処理する', () => {
      const leapYear = new Date('2024-02-29T12:00:00.000Z');
      const result = formatDate(leapYear);
      expect(result).toMatch(/^2024\/02\/\d{2}$/);
    });
  });

  describe('formatDateTime', () => {
    it('日時を正しい形式でフォーマットする', () => {
      const result = formatDateTime(testDate);
      expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
      expect(typeof result).toBe('string');
    });

    it('日付と時刻の両方を含む', () => {
      const result = formatDateTime(testDate);
      expect(result).toContain('/'); // 日付区切り文字
      expect(result).toContain(':'); // 時刻区切り文字
      expect(result).toContain(' '); // 日付と時刻の区切り
    });

    it('formatDateとformatTimeの組み合わせと一致する', () => {
      const dateTimeResult = formatDateTime(testDate);
      const separateResult = `${formatDate(testDate)} ${formatTime(testDate)}`;
      expect(dateTimeResult).toBe(separateResult);
    });
  });

  describe('isToday', () => {
    it('今日の日付でtrueを返す', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('昨日の日付でfalseを返す', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('明日の日付でfalseを返す', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });

    it('同じ日の異なる時刻でtrueを返す', () => {
      const now = new Date();
      const sameDay = new Date(now);
      sameDay.setHours(0, 0, 0, 0); // 同じ日の00:00:00
      expect(isToday(sameDay)).toBe(true);
      
      sameDay.setHours(23, 59, 59, 999); // 同じ日の23:59:59
      expect(isToday(sameDay)).toBe(true);
    });

    it('タイムゾーンが異なっても正しく動作する', () => {
      const now = new Date();
      // 同じ日付文字列を持つ日付オブジェクトを作成
      const sameDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
      expect(isToday(sameDay)).toBe(true);
    });
  });

  describe('getTimeRange', () => {
    const mockPost1 = {
      id: '1',
      content: 'Post 1',
      createdAt: new Date('2024-01-15T10:00:00.000Z'),
      updatedAt: new Date('2024-01-15T10:00:00.000Z')
    };

    const mockPost2 = {
      id: '2',
      content: 'Post 2',
      createdAt: new Date('2024-01-15T14:30:00.000Z'),
      updatedAt: new Date('2024-01-15T14:30:00.000Z')
    };

    const mockPost3 = {
      id: '3',
      content: 'Post 3',
      createdAt: new Date('2024-01-16T08:15:00.000Z'),
      updatedAt: new Date('2024-01-16T08:15:00.000Z')
    };

    it('空の配列で24時間前から現在までの範囲を返す', () => {
      const result = getTimeRange([]);
      const now = new Date();
      const expectedStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      expect(result.start.getTime()).toBeCloseTo(expectedStart.getTime(), -3); // 3桁の精度で比較
      expect(result.end.getTime()).toBeCloseTo(now.getTime(), -3);
    });

    it('単一の投稿で正しい範囲を返す', () => {
      const result = getTimeRange([mockPost1]);
      
      expect(result.start).toEqual(mockPost1.createdAt);
      expect(result.end).toEqual(mockPost1.createdAt);
    });

    it('複数の投稿で最小から最大の範囲を返す', () => {
      const posts = [mockPost2, mockPost1, mockPost3]; // 順序をランダムに
      const result = getTimeRange(posts);
      
      expect(result.start).toEqual(mockPost1.createdAt); // 最も古い
      expect(result.end).toEqual(mockPost3.createdAt);   // 最も新しい
    });

    it('同じ時刻の投稿で正しい範囲を返す', () => {
      const sameTimePost1 = { ...mockPost1 };
      const sameTimePost2 = { ...mockPost1, id: '2' };
      
      const result = getTimeRange([sameTimePost1, sameTimePost2]);
      
      expect(result.start).toEqual(mockPost1.createdAt);
      expect(result.end).toEqual(mockPost1.createdAt);
    });

    it('大量の投稿でパフォーマンスが良い', () => {
      const manyPosts = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        content: `Post ${i}`,
        createdAt: new Date(Date.now() + i * 1000), // 1秒ずつ増加
        updatedAt: new Date(Date.now() + i * 1000)
      }));

      const startTime = performance.now();
      const result = getTimeRange(manyPosts);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
      expect(result.start).toEqual(manyPosts[0].createdAt);
      expect(result.end).toEqual(manyPosts[999].createdAt);
    });

    it('無効な日付を含む投稿を適切に処理する', () => {
      const invalidPost = {
        id: 'invalid',
        content: 'Invalid post',
        createdAt: new Date('invalid'),
        updatedAt: new Date('invalid')
      };

      const validPost = mockPost1;
      
      // 無効な日付は NaN になるため、Math.min/maxで適切に処理される
      expect(() => getTimeRange([invalidPost, validPost])).not.toThrow();
    });

    it('極端な日付範囲を正しく処理する', () => {
      const veryOldPost = {
        id: 'old',
        content: 'Old post',
        createdAt: new Date('1900-01-01T00:00:00.000Z'),
        updatedAt: new Date('1900-01-01T00:00:00.000Z')
      };

      const futurePost = {
        id: 'future',
        content: 'Future post',
        createdAt: new Date('2100-12-31T23:59:59.999Z'),
        updatedAt: new Date('2100-12-31T23:59:59.999Z')
      };

      const result = getTimeRange([futurePost, veryOldPost]);
      
      expect(result.start).toEqual(veryOldPost.createdAt);
      expect(result.end).toEqual(futurePost.createdAt);
    });
  });
});