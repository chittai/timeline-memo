import { lazy } from 'react';

/**
 * 遅延読み込み用のコンポーネント定義
 * バンドルサイズの最適化とパフォーマンス向上のため
 */

// 削除確認ダイアログ（使用頻度が低いため遅延読み込み）
export const LazyDeleteConfirmDialog = lazy(() => import('./DeleteConfirmDialog'));

// 投稿プレビュー（ホバー時のみ使用のため遅延読み込み）
export const LazyPostPreview = lazy(() => import('./PostPreview'));

// トースト通知（エラー時のみ使用のため遅延読み込み）
export const LazyToast = lazy(() => import('./Toast').then(module => ({ default: module.Toast })));

// トーストコンテナ（エラー時のみ使用のため遅延読み込み）
export const LazyToastContainer = lazy(() => import('./ToastContainer').then(module => ({ default: module.ToastContainer })));