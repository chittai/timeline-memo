// Jest環境でのテスト
import {
  validatePostContent,
  validateCreatePostInput,
  sanitizeContent,
  isValidUUID,
  validateDateRange
} from '../validationUtils';
import type { CreatePostInput } from '../../types';

describe('validationUtils', () => {
  describe('validatePostContent', () => {
    it('空のコンテンツでエラーを返す', () => {
      expect(validatePostContent('')).toBe('コンテンツを入力してください');
      expect(validatePostContent('   ')).toBe('コンテンツを入力してください');
      expect(validatePostContent('\n\t  \n')).toBe('コンテンツを入力してください');
    });

    it('有効なコンテンツでnullを返す', () => {
      expect(validatePostContent('Valid content')).toBeNull();
      expect(validatePostContent('# Markdown content')).toBeNull();
      expect(validatePostContent('日本語のコンテンツ')).toBeNull();
      expect(validatePostContent('1')).toBeNull(); // 最小有効長
    });

    it('非常に長いコンテンツでエラーを返す', () => {
      const longContent = 'a'.repeat(10001);
      expect(validatePostContent(longContent)).toBe('コンテンツが長すぎます（最大10,000文字）');
    });

    it('境界値のテスト', () => {
      const maxValidContent = 'a'.repeat(10000);
      expect(validatePostContent(maxValidContent)).toBeNull();
      
      const justOverLimit = 'a'.repeat(10001);
      expect(validatePostContent(justOverLimit)).toBe('コンテンツが長すぎます（最大10,000文字）');
    });

    it('特殊文字を含むコンテンツを正しく処理する', () => {
      expect(validatePostContent('Hello\nWorld')).toBeNull();
      expect(validatePostContent('Hello\tWorld')).toBeNull();
      expect(validatePostContent('Hello 🌟 World')).toBeNull();
      expect(validatePostContent('<script>alert("test")</script>')).toBeNull();
    });

    it('nullやundefinedを適切に処理する', () => {
      expect(validatePostContent(null as any)).toBe('コンテンツを入力してください');
      expect(validatePostContent(undefined as any)).toBe('コンテンツを入力してください');
    });
  });

  describe('validateCreatePostInput', () => {
    it('有効な入力を検証する', () => {
      const input: CreatePostInput = {
        content: 'Valid content'
      };
      const result = validateCreatePostInput(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('無効な入力でエラーを返す', () => {
      const input: CreatePostInput = {
        content: '',
        tags: ['', 'valid-tag']
      };
      const result = validateCreatePostInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('コンテンツを入力してください');
    });

    it('タグの検証を行う', () => {
      const inputWithValidTags: CreatePostInput = {
        content: 'Valid content',
        tags: ['tag1', 'tag2', 'tag3']
      };
      const result1 = validateCreatePostInput(inputWithValidTags);
      expect(result1.isValid).toBe(true);

      const inputWithInvalidTags: CreatePostInput = {
        content: 'Valid content',
        tags: ['', '   ', 'valid-tag']
      };
      const result2 = validateCreatePostInput(inputWithInvalidTags);
      expect(result2.isValid).toBe(false);
      expect(result2.errors.some(error => error.includes('タグ'))).toBe(true);
    });

    it('nullやundefinedの入力を適切に処理する', () => {
      const result1 = validateCreatePostInput(null as any);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('入力データが無効です');

      const result2 = validateCreatePostInput(undefined as any);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('入力データが無効です');
    });

    it('複数のエラーを正しく収集する', () => {
      const input: CreatePostInput = {
        content: '',
        tags: ['', 'a'.repeat(101)] // 空のタグと長すぎるタグ
      };
      const result = validateCreatePostInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('sanitizeContent', () => {
    it('前後の空白を削除する', () => {
      expect(sanitizeContent('  content  ')).toBe('content');
      expect(sanitizeContent('\n\tcontent\n\t')).toBe('content');
    });

    it('内部の空白は保持する', () => {
      expect(sanitizeContent('hello world')).toBe('hello world');
      expect(sanitizeContent('line1\nline2')).toBe('line1\nline2');
    });

    it('空文字列を適切に処理する', () => {
      expect(sanitizeContent('')).toBe('');
      expect(sanitizeContent('   ')).toBe('');
    });

    it('nullやundefinedを適切に処理する', () => {
      expect(sanitizeContent(null as any)).toBe('');
      expect(sanitizeContent(undefined as any)).toBe('');
    });

    it('特殊文字を保持する', () => {
      expect(sanitizeContent('  Hello 🌟 World  ')).toBe('Hello 🌟 World');
      expect(sanitizeContent('  <tag>content</tag>  ')).toBe('<tag>content</tag>');
    });
  });

  describe('isValidUUID', () => {
    it('正しいUUID形式を検証する', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('無効なUUID形式を拒否する', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000-extra')).toBe(false);
      expect(isValidUUID('123e4567e89b12d3a456426614174000')).toBe(false); // ハイフンなし
    });

    it('空文字列やnullを適切に処理する', () => {
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID(null as any)).toBe(false);
      expect(isValidUUID(undefined as any)).toBe(false);
    });

    it('大文字小文字を適切に処理する', () => {
      expect(isValidUUID('123E4567-E89B-12D3-A456-426614174000')).toBe(true);
      expect(isValidUUID('123e4567-E89B-12d3-A456-426614174000')).toBe(true);
    });
  });

  describe('validateDateRange', () => {
    it('正しい日付範囲を検証する', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-02');
      const result = validateDateRange(start, end);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('無効な日付範囲でエラーを返す', () => {
      const start = new Date('2024-01-02');
      const end = new Date('2024-01-01');
      const result = validateDateRange(start, end);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('開始日時は終了日時より前である必要があります');
    });

    it('同じ日付を適切に処理する', () => {
      const date = new Date('2024-01-01');
      const result = validateDateRange(date, date);
      expect(result.isValid).toBe(true);
    });

    it('無効な日付オブジェクトを適切に処理する', () => {
      const invalidDate = new Date('invalid');
      const validDate = new Date('2024-01-01');
      
      const result1 = validateDateRange(invalidDate, validDate);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('無効な日付が指定されました');

      const result2 = validateDateRange(validDate, invalidDate);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('無効な日付が指定されました');
    });

    it('nullやundefinedを適切に処理する', () => {
      const validDate = new Date('2024-01-01');
      
      const result1 = validateDateRange(null as any, validDate);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('開始日時と終了日時が必要です');

      const result2 = validateDateRange(validDate, null as any);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('開始日時と終了日時が必要です');

      const result3 = validateDateRange(undefined as any, undefined as any);
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('開始日時と終了日時が必要です');
    });

    it('極端な日付範囲を適切に処理する', () => {
      const veryOldDate = new Date('1900-01-01');
      const futureDate = new Date('2100-01-01');
      
      const result = validateDateRange(veryOldDate, futureDate);
      expect(result.isValid).toBe(true);
    });
  });
});