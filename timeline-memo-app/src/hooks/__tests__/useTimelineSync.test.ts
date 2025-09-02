import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useTimelineSync } from '../useTimelineSync';
import { AppProvider } from '../../context/AppContext';
import type { ReactNode } from 'react';

// テスト用のWrapper
const wrapper = ({ children }: { children: ReactNode }) => (
  React.createElement(AppProvider, null, children)
);

describe('useTimelineSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // console.logをモック化
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('基本的な状態管理', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      expect(result.current.selectedPostId).toBeNull();
      expect(result.current.highlightedPostIds).toEqual([]);
      expect(result.current.isUserScrolling).toBe(false);
    });

    it('投稿選択が正しく動作する', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      act(() => {
        result.current.selectPost('post-1');
      });

      expect(result.current.selectedPostId).toBe('post-1');
    });

    it('ハイライト変更が正しく動作する', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      act(() => {
        result.current.highlightPosts(['post-1', 'post-2']);
      });

      expect(result.current.highlightedPostIds).toEqual(['post-1', 'post-2']);
    });
  });

  describe('マーカー連携機能', () => {
    it('マーカークリック時に投稿が選択される', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      act(() => {
        result.current.handleMarkerClick(['post-1', 'post-2']);
      });

      expect(result.current.selectedPostId).toBe('post-1');
    });

    it('空の投稿IDでマーカークリック時にnullが選択される', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      act(() => {
        result.current.handleMarkerClick([]);
      });

      expect(result.current.selectedPostId).toBeNull();
    });

    it('マーカーホバー時にハイライトが設定される', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      act(() => {
        result.current.handleMarkerHover(['post-1', 'post-2']);
      });

      expect(result.current.highlightedPostIds).toEqual(['post-1', 'post-2']);
    });

    it('マーカーホバー終了時にハイライトがクリアされる', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      // 最初にハイライトを設定
      act(() => {
        result.current.highlightPosts(['post-1', 'post-2']);
      });

      expect(result.current.highlightedPostIds).toEqual(['post-1', 'post-2']);

      // ホバー終了でクリア
      act(() => {
        result.current.handleMarkerHoverEnd();
      });

      expect(result.current.highlightedPostIds).toEqual([]);
    });
  });

  describe('リスト連携機能', () => {
    it('リストスクロール時にログが出力される', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });
      const consoleSpy = jest.spyOn(console, 'log');

      act(() => {
        result.current.handleListScroll(50);
      });

      expect(consoleSpy).toHaveBeenCalledWith('List scroll percentage:', 50);
    });

    it('可視投稿変更時にハイライトが更新される（非スクロール中）', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      act(() => {
        result.current.handleVisiblePostsChange(['post-3', 'post-4']);
      });

      expect(result.current.highlightedPostIds).toEqual(['post-3', 'post-4']);
    });

    it('スクロール中は可視投稿変更でハイライトが更新されない', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      // スクロール状態を設定
      act(() => {
        result.current.setUserScrolling(true);
      });

      // 初期ハイライトを設定
      act(() => {
        result.current.highlightPosts(['post-1']);
      });

      // 可視投稿を変更（スクロール中なので更新されない）
      act(() => {
        result.current.handleVisiblePostsChange(['post-3', 'post-4']);
      });

      expect(result.current.highlightedPostIds).toEqual(['post-1']);
    });
  });

  describe('スクロール制御', () => {
    it('scrollToPostで投稿が選択される', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      act(() => {
        result.current.scrollToPost('post-5');
      });

      expect(result.current.selectedPostId).toBe('post-5');
    });

    it('ユーザースクロール状態が正しく管理される', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      act(() => {
        result.current.setUserScrolling(true);
      });

      expect(result.current.isUserScrolling).toBe(true);
    });
  });

  describe('タイマー管理', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('スクロール終了後にユーザースクロール状態がfalseになる', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      act(() => {
        result.current.setUserScrolling(true);
      });

      expect(result.current.isUserScrolling).toBe(true);

      // 150ms経過
      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(result.current.isUserScrolling).toBe(false);
    });

    it('連続スクロール時にタイマーがリセットされる', () => {
      const { result } = renderHook(() => useTimelineSync(), { wrapper });

      // 最初のスクロール
      act(() => {
        result.current.setUserScrolling(true);
      });

      // 100ms経過
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // 再度スクロール（タイマーリセット）
      act(() => {
        result.current.setUserScrolling(true);
      });

      // さらに100ms経過（合計200ms、但しタイマーはリセットされている）
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.isUserScrolling).toBe(true);

      // さらに50ms経過（リセット後150ms）
      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(result.current.isUserScrolling).toBe(false);
    });
  });
});