import { 
  sanitizeHtml, 
  sanitizeMarkdown, 
  validateInput, 
  isUrlSafe, 
  generateCSRFToken 
} from '../securityUtils';

describe('securityUtils', () => {
  describe('sanitizeHtml', () => {
    it('基本的なHTMLタグを保持する', () => {
      const input = '<p>テスト<strong>太字</strong><em>斜体</em></p>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<p>テスト<strong>太字</strong><em>斜体</em></p>');
    });

    it('危険なscriptタグを除去する', () => {
      const input = '<p>安全なコンテンツ</p><script>alert("XSS")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>安全なコンテンツ</p>');
    });

    it('onイベントハンドラーを除去する', () => {
      const input = '<p onclick="alert(\'XSS\')">クリック</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
      expect(result).toContain('<p>クリック</p>');
    });

    it('危険な属性を除去する', () => {
      const input = '<p style="background: red;" onload="alert(\'XSS\')">テスト</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('style');
      expect(result).not.toContain('onload');
      expect(result).toContain('<p>テスト</p>');
    });

    it('許可されたリンクを保持する', () => {
      const input = '<a href="https://example.com" title="リンク">リンク</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('title="リンク"');
    });

    it('危険なフォーム要素を除去する', () => {
      const input = '<form><input type="text"><button>送信</button></form>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<form>');
      expect(result).not.toContain('<input>');
      expect(result).not.toContain('<button>');
    });
  });

  describe('sanitizeMarkdown', () => {
    it('通常のMarkdownテキストを保持する', () => {
      const input = '# タイトル\n\n**太字**テキスト\n\n- リスト項目';
      const result = sanitizeMarkdown(input);
      expect(result).toBe(input);
    });

    it('scriptタグを除去する', () => {
      const input = '# タイトル\n<script>alert("XSS")</script>\n通常のテキスト';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('# タイトル');
      expect(result).toContain('通常のテキスト');
    });

    it('JavaScriptプロトコルを除去する', () => {
      const input = '[リンク](javascript:alert("XSS"))';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('javascript:');
    });

    it('onイベントハンドラーを除去する', () => {
      const input = '<p onclick="alert(\'XSS\')">テキスト</p>';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('onclick');
    });

    it('iframeタグを除去する', () => {
      const input = 'テキスト<iframe src="evil.com"></iframe>続きのテキスト';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('<iframe>');
      expect(result).toContain('テキスト');
      expect(result).toContain('続きのテキスト');
    });

    it('データURIを除去する', () => {
      const input = '![画像](data:image/svg+xml;base64,PHN2Zz4=)';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('data:');
    });
  });

  describe('validateInput', () => {
    it('有効な入力を受け入れる', () => {
      const input = '有効なテキストコンテンツです。';
      const result = validateInput(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('空文字を拒否する', () => {
      const result1 = validateInput('');
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('コンテンツが空です');

      const result2 = validateInput('   ');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('コンテンツが空です');
    });

    it('長すぎる入力を拒否する', () => {
      const longInput = 'a'.repeat(10001);
      const result = validateInput(longInput);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('コンテンツが長すぎます（最大10,000文字）');
    });

    it('危険なパターンを検出する', () => {
      const dangerousInputs = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<iframe src="evil.com"></iframe>',
        '<p onclick="alert(\'XSS\')">テキスト</p>',
        'vbscript:msgbox("XSS")',
        '<object data="evil.swf"></object>',
        '<embed src="evil.swf">',
        '<form><input type="text"></form>'
      ];

      dangerousInputs.forEach(input => {
        const result = validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('不正なコンテンツが含まれています');
      });
    });

    it('安全なHTMLタグは許可する', () => {
      const safeInput = '<p>安全な<strong>テキスト</strong>です</p>';
      const result = validateInput(safeInput);
      // 基本的なHTMLタグは警告しない（サニタイズで処理される）
      expect(result.isValid).toBe(true);
    });
  });

  describe('isUrlSafe', () => {
    it('安全なHTTPS URLを許可する', () => {
      expect(isUrlSafe('https://example.com')).toBe(true);
      expect(isUrlSafe('https://www.google.com/search?q=test')).toBe(true);
    });

    it('安全なHTTP URLを許可する', () => {
      expect(isUrlSafe('http://example.com')).toBe(true);
    });

    it('危険なプロトコルを拒否する', () => {
      expect(isUrlSafe('javascript:alert("XSS")')).toBe(false);
      expect(isUrlSafe('data:text/html,<script>alert("XSS")</script>')).toBe(false);
      expect(isUrlSafe('file:///etc/passwd')).toBe(false);
      expect(isUrlSafe('ftp://example.com')).toBe(false);
    });

    it('ローカルホストを拒否する', () => {
      expect(isUrlSafe('http://localhost:3000')).toBe(false);
      expect(isUrlSafe('http://127.0.0.1:8080')).toBe(false);
    });

    it('内部IPアドレスを拒否する', () => {
      expect(isUrlSafe('http://192.168.1.1')).toBe(false);
      expect(isUrlSafe('http://10.0.0.1')).toBe(false);
      expect(isUrlSafe('http://172.16.0.1')).toBe(false);
    });

    it('不正なURLを拒否する', () => {
      expect(isUrlSafe('not-a-url')).toBe(false);
      expect(isUrlSafe('')).toBe(false);
      expect(isUrlSafe('http://')).toBe(false);
    });
  });

  describe('generateCSRFToken', () => {
    it('CSRFトークンを生成する', () => {
      const token = generateCSRFToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32バイト * 2文字/バイト
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('毎回異なるトークンを生成する', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });
});