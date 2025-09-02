import type { Post, CreatePostInput, UpdatePostInput, ValidationResult } from '../types';
import { validateInput, sanitizeMarkdown } from './securityUtils';

/**
 * 投稿コンテンツのバリデーション
 * 要件1.1, 1.2に対応：文字数制限なし、空コンテンツの拒否
 * セキュリティ対策を含む
 */
export const validatePostContent = (content: string): string | null => {
  if (!content || content.trim().length === 0) {
    return 'コンテンツを入力してください';
  }
  
  // セキュリティバリデーション
  const securityValidation = validateInput(content);
  if (!securityValidation.isValid) {
    return securityValidation.errors[0];
  }
  
  // 実際には文字数制限なしだが、実用的な上限を設定（セキュリティ対策と統一）
  if (content.length > 10000) {
    return 'コンテンツが長すぎます（最大10,000文字）';
  }
  
  return null;
};

/**
 * 投稿作成データの包括的バリデーション
 */
export const validateCreatePostInput = (input: CreatePostInput): ValidationResult => {
  const errors: string[] = [];
  
  // コンテンツバリデーション
  const contentError = validatePostContent(input.content);
  if (contentError) {
    errors.push(contentError);
  }
  
  // タグバリデーション（将来拡張用）
  if (input.tags) {
    if (input.tags.length > 10) {
      errors.push('タグは10個以内で設定してください');
    }
    
    for (const tag of input.tags) {
      if (tag.trim().length === 0) {
        errors.push('空のタグは設定できません');
        break;
      }
      if (tag.length > 50) {
        errors.push('タグは50文字以内で設定してください');
        break;
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 投稿更新データのバリデーション
 */
export const validateUpdatePostInput = (input: UpdatePostInput): ValidationResult => {
  const errors: string[] = [];
  
  // コンテンツが提供されている場合のみバリデーション
  if (input.content !== undefined) {
    const contentError = validatePostContent(input.content);
    if (contentError) {
      errors.push(contentError);
    }
  }
  
  // タグバリデーション（将来拡張用）
  if (input.tags) {
    if (input.tags.length > 10) {
      errors.push('タグは10個以内で設定してください');
    }
    
    for (const tag of input.tags) {
      if (tag.trim().length === 0) {
        errors.push('空のタグは設定できません');
        break;
      }
      if (tag.length > 50) {
        errors.push('タグは50文字以内で設定してください');
        break;
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Postオブジェクトの整合性チェック
 */
export const validatePost = (post: Post): ValidationResult => {
  const errors: string[] = [];
  
  // ID検証
  if (!post.id || post.id.trim().length === 0) {
    errors.push('投稿IDが無効です');
  }
  
  // コンテンツ検証
  const contentError = validatePostContent(post.content);
  if (contentError) {
    errors.push(contentError);
  }
  
  // 日時検証
  if (!post.createdAt || isNaN(post.createdAt.getTime())) {
    errors.push('作成日時が無効です');
  }
  
  if (!post.updatedAt || isNaN(post.updatedAt.getTime())) {
    errors.push('更新日時が無効です');
  }
  
  if (post.createdAt && post.updatedAt && post.createdAt > post.updatedAt) {
    errors.push('作成日時が更新日時より後になっています');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * コンテンツのサニタイズ（基本的なクリーニング）
 * セキュリティサニタイズを含む
 */
export const sanitizeContent = (content: string): string => {
  const trimmed = content.trim();
  return sanitizeMarkdown(trimmed);
};

/**
 * タグのサニタイズ
 */
export const sanitizeTags = (tags: string[]): string[] => {
  return tags
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .slice(0, 10); // 最大10個まで
};

/**
 * UUIDの簡易バリデーション
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * 日付範囲のバリデーション
 */
export const validateDateRange = (start: Date, end: Date): ValidationResult => {
  const errors: string[] = [];
  
  if (isNaN(start.getTime())) {
    errors.push('開始日時が無効です');
  }
  
  if (isNaN(end.getTime())) {
    errors.push('終了日時が無効です');
  }
  
  if (start >= end) {
    errors.push('開始日時は終了日時より前である必要があります');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};