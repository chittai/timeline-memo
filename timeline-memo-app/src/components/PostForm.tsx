import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { usePosts } from '../hooks/usePosts';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { validatePostContent } from '../utils/validationUtils';
import { sanitizeMarkdown, validateInput } from '../utils/securityUtils';
import type { Post } from '../types';

interface PostFormProps {
  /** 編集対象の投稿（新規作成の場合はundefined） */
  editingPost?: Post;
  /** 送信成功時のコールバック */
  onSubmitSuccess?: () => void;
  /** 編集キャンセル時のコールバック */
  onCancel?: () => void;
  /** CSSクラス名 */
  className?: string;
}

/**
 * 投稿フォームコンポーネント
 * 要件1.1, 1.2, 1.3, 1.4, 7.1, 7.2に対応
 * - Markdown入力サポート
 * - プレビュー機能
 * - フォームバリデーション
 * - 新規投稿作成機能
 * - 投稿編集機能
 */
export function PostForm({ editingPost, onSubmitSuccess, onCancel, className = '' }: PostFormProps) {
  const [content, setContent] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createPost, updatePost, isLoading } = usePosts();
  const { showSuccess, showError } = useErrorHandler();
  
  // 編集モードかどうかを判定
  const isEditMode = !!editingPost;

  // コンテンツ変更時のハンドラー
  const handleContentChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawContent = event.target.value;
    
    // セキュリティチェック
    const securityValidation = validateInput(rawContent);
    if (!securityValidation.isValid) {
      setValidationError(securityValidation.errors[0]);
      return;
    }
    
    // Markdownサニタイズ
    const sanitizedContent = sanitizeMarkdown(rawContent);
    setContent(sanitizedContent);
    
    // リアルタイムバリデーション
    if (validationError) {
      const error = validatePostContent(sanitizedContent);
      setValidationError(error);
    }
  }, [validationError]);

  // 編集対象の投稿が変更された時にフォームを初期化
  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content);
      setIsPreviewMode(false);
      setValidationError(null);
    } else {
      setContent('');
      setIsPreviewMode(false);
      setValidationError(null);
    }
  }, [editingPost]);

  // フォーム送信ハンドラー
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    // セキュリティバリデーション
    const securityValidation = validateInput(content);
    if (!securityValidation.isValid) {
      setValidationError(securityValidation.errors[0]);
      return;
    }
    
    // 基本バリデーション
    const error = validatePostContent(content);
    if (error) {
      setValidationError(error);
      return;
    }
    
    setValidationError(null);
    setIsSubmitting(true);
    
    try {
      // 最終的なサニタイズ処理
      const finalContent = sanitizeMarkdown(content);
      let result: Post | null = null;
      
      if (isEditMode && editingPost) {
        // 編集モード：既存投稿を更新
        result = await updatePost(editingPost.id, finalContent);
      } else {
        // 新規作成モード
        result = await createPost(finalContent);
      }
      
      if (result) {
        // 成功時の処理
        showSuccess(
          isEditMode ? '投稿を更新しました' : '投稿を作成しました',
          isEditMode ? undefined : '新しいメモがタイムラインに追加されました'
        );
        
        if (!isEditMode) {
          // 新規作成の場合のみフォームをリセット
          setContent('');
          setIsPreviewMode(false);
        }
        onSubmitSuccess?.();
      }
    } catch (error) {
      // エラー表示
      showError(
        error,
        isEditMode ? '投稿の更新に失敗しました' : '投稿の作成に失敗しました'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [content, createPost, updatePost, editingPost, isEditMode, onSubmitSuccess]);

  // キャンセルハンドラー
  const handleCancel = useCallback(() => {
    if (isEditMode) {
      // 編集モードの場合は元の内容に戻す
      setContent(editingPost?.content || '');
      setValidationError(null);
      setIsPreviewMode(false);
      onCancel?.();
    } else {
      // 新規作成モードの場合はリセット
      handleReset();
    }
  }, [isEditMode, editingPost, onCancel]);

  // プレビューモード切り替え
  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode(prev => !prev);
  }, []);

  // フォームリセット
  const handleReset = useCallback(() => {
    setContent('');
    setValidationError(null);
    setIsPreviewMode(false);
  }, []);

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditMode ? '投稿を編集' : '新規投稿'}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={togglePreviewMode}
            disabled={isFormDisabled}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              isPreviewMode
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPreviewMode ? '編集' : 'プレビュー'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        {/* コンテンツ入力エリア */}
        <div className="mb-4">
          {isPreviewMode ? (
            // プレビューモード
            <div className="min-h-[200px] p-3 border border-gray-300 rounded-md bg-gray-50">
              {content.trim() ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-500 italic">プレビューするコンテンツがありません</p>
              )}
            </div>
          ) : (
            // 編集モード
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="ここにメモや感情を記録してください...&#10;&#10;Markdown記法が使用できます：&#10;**太字** *斜体* `コード` [リンク](URL)&#10;- リスト項目&#10;> 引用"
              disabled={isFormDisabled}
              className={`w-full min-h-[200px] p-3 border rounded-md resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                validationError ? 'border-red-300' : 'border-gray-300'
              }`}
              rows={8}
            />
          )}
        </div>

        {/* バリデーションエラー表示 */}
        {validationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{validationError}</p>
          </div>
        )}

        {/* Markdownヘルプ */}
        {!isPreviewMode && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700 mb-2">Markdown記法のヒント:</p>
            <div className="text-xs text-blue-600 space-y-1">
              <div><code>**太字**</code> → <strong>太字</strong></div>
              <div><code>*斜体*</code> → <em>斜体</em></div>
              <div><code>`コード`</code> → <code>コード</code></div>
              <div><code># 見出し</code> → 見出し</div>
              <div><code>- リスト</code> → リスト項目</div>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex items-center justify-between">
          {!isEditMode && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isFormDisabled || !content.trim()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              リセット
            </button>
          )}
          
          <div className={`flex items-center space-x-2 ${isEditMode ? 'w-full justify-end' : ''}`}>
            <span className="text-xs text-gray-500">
              {content.length.toLocaleString()} 文字
            </span>
            {isEditMode && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isFormDisabled}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
            )}
            <button
              type="submit"
              disabled={isFormDisabled || !content.trim() || !!validationError}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{isEditMode ? '更新中...' : '投稿中...'}</span>
                </>
              ) : (
                <span>{isEditMode ? '更新する' : '投稿する'}</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}