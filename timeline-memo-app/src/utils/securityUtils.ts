import DOMPurify from 'dompurify';

/**
 * セキュリティ関連のユーティリティ関数
 */

/**
 * HTMLコンテンツをサニタイズしてXSS攻撃を防ぐ
 * @param html サニタイズするHTMLコンテンツ
 * @returns サニタイズされたHTMLコンテンツ
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    // 許可するタグを制限
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote',
      'a', 'img'
    ],
    // 許可する属性を制限
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    // リンクのターゲットを制限
    ADD_ATTR: ['target'],
    // 外部リンクは新しいタブで開く
    FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror'],
    // スクリプトタグを完全に除去
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    // データURIを制限
    FORBID_CONTENTS: ['script'],
    // 空の要素を除去
    ALLOW_DATA_ATTR: false
  });
};

/**
 * Markdownコンテンツをサニタイズ
 * @param markdown サニタイズするMarkdownコンテンツ
 * @returns サニタイズされたMarkdownコンテンツ
 */
export const sanitizeMarkdown = (markdown: string): string => {
  // 基本的な文字列サニタイズ
  const sanitized = markdown
    // HTMLタグをエスケープ（Markdownとして許可されていないもの）
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    // JavaScriptプロトコルを除去
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    // onイベントハンドラーを除去
    .replace(/on\w+\s*=/gi, '');

  return sanitized;
};

/**
 * 入力値の基本的なバリデーション
 * @param input 検証する入力値
 * @returns バリデーション結果
 */
export const validateInput = (input: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 空文字チェック
  if (!input || input.trim().length === 0) {
    errors.push('コンテンツが空です');
  }

  // 最大長チェック（10,000文字）
  if (input.length > 10000) {
    errors.push('コンテンツが長すぎます（最大10,000文字）');
  }

  // 危険なパターンをチェック
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      errors.push('不正なコンテンツが含まれています');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * URLの安全性をチェック
 * @param url チェックするURL
 * @returns URLが安全かどうか
 */
export const isUrlSafe = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    
    // HTTPSまたはHTTPのみ許可
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // ローカルホストや内部IPアドレスを制限
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * CSRFトークンを生成（将来のAPI連携用）
 * @returns CSRFトークン
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};