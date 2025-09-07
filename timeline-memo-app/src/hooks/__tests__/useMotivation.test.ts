import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMotivation } from '../useMotivation';
import { Post, DiaryStats } from '../../types';
import { ReactNode } from 'react';

// AppContextのモック
const mockDispatch = vi.fn();
const mockState = {
  posts: [] as Post[],
  selectedPostId: null,
  highlightedPostIds: [],
  loading: { isLoading: false },
  error: null,
  toasts: [],
  viewMode: 'timeline' as const,
  selectedDate: null,
  diaryEntries: [],
  calendarData: [],
  diaryStats: null as DiaryStats | null,
  motivationMessages: [],
  lastPostDate: null,
  daysSinceLastPost: 0
};

vi.mock('../../context/AppContext', () => ({
  useAppContext: () => ({
    state: mockState,
    dispatch: mockDispatch
  })
}));

describe('useMotivation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    
    // モック状態をリセット
    Object.assign(mockState, {
      posts: [],
      motivationMessages: [],
      lastPostDate: null,
      daysSinceLastPost: 0,
      diaryStats: null
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: ReactNode }) => children as any;

  describe('基本機能', () => {
    it('フックが正常に初期化される', () => {
      const { result } = renderHook(() => useMotivation(), { wrapper });
      
      expect(result.current.motivationMessages).toEqual([]);
      expect(result.current.lastPostDate).toBeNull();
      expect(result.current.daysSinceLastPost).toBe(0);
      expect(result.current.streakInfo).toEqual({ current: 0, longest: 0 });
    });

    it('dismissMessage関数が正常に動作する', () => {
      const { result } = renderHook(() => useMotivation(), { wrapper });
      
      act(() => {
        result.current.dismissMessage('test-message-id');
      });
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'REMOVE_MOTIVATION_MESSAGE',
        payload: 'test-message-id'
      });
    });

    it('clearAllMessages関数が正常に動作する', () => {
      const { result } = renderHook(() => useMotivation(), { wrapper });
      
      act(() => {
        result.current.clearAllMessages();
      });
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'CLEAR_MOTIVATION_MESSAGES'
      });
    });
  });

  describe('投稿データの変更時の動作', () => {
    it('投稿データが変更されると経過日数が更新される', () => {
      const mockPosts: Post[] = [
        {
          id: '1',
          content: '3日前の投稿',
          createdAt: new Date('2024-01-12T09:00:00Z'),
          updatedAt: new Date('2024-01-12T09:00:00Z'),
        }
      ];

      // 投稿データを設定
      Object.assign(mockState, { posts: mockPosts });

      renderHook(() => useMotivation(), { wrapper });
      
      // 経過日数の更新が呼ばれることを確認
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_DAYS_SINCE_LAST_POST',
        payload: 3
      });
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_LAST_POST_DATE',
        payload: mockPosts[0].createdAt
      });
    });
  });

  describe('促進メッセージの生成', () => {
    it('3日以上投稿がない場合に促進メッセージが生成される', () => {
      // 3日経過した状態を設定
      Object.assign(mockState, { daysSinceLastPost: 3 });

      renderHook(() => useMotivation(), { wrapper });
      
      // 促進メッセージの追加が呼ばれることを確認
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ADD_MOTIVATION_MESSAGE',
          payload: expect.objectContaining({
            type: 'encouragement',
            daysSinceLastPost: 3
          })
        })
      );
    });

    it('3日未満の場合は促進メッセージが生成されない', () => {
      // 2日経過した状態を設定
      Object.assign(mockState, { daysSinceLastPost: 2 });

      renderHook(() => useMotivation(), { wrapper });
      
      // 促進メッセージの追加が呼ばれないことを確認
      const encouragementCalls = mockDispatch.mock.calls.filter(call => 
        call[0].type === 'ADD_MOTIVATION_MESSAGE' && 
        call[0].payload?.type === 'encouragement'
      );
      expect(encouragementCalls).toHaveLength(0);
    });

    it('既に促進メッセージが存在する場合は重複して生成されない', () => {
      // 既存の促進メッセージを設定
      Object.assign(mockState, {
        daysSinceLastPost: 3,
        motivationMessages: [{
          id: 'existing-encouragement',
          type: 'encouragement',
          title: '既存のメッセージ',
          message: 'テスト',
          isVisible: true,
          createdAt: new Date()
        }]
      });

      renderHook(() => useMotivation(), { wrapper });
      
      // 新しい促進メッセージが追加されないことを確認
      const encouragementCalls = mockDispatch.mock.calls.filter(call => 
        call[0].type === 'ADD_MOTIVATION_MESSAGE' && 
        call[0].payload?.type === 'encouragement'
      );
      expect(encouragementCalls).toHaveLength(0);
    });
  });

  describe('達成通知の生成', () => {
    it('新記録の連続投稿がある場合に達成通知が生成される', () => {
      const mockStats: DiaryStats = {
        totalPosts: 10,
        totalDays: 5,
        currentStreak: 3,
        longestStreak: 2, // 現在の記録が新記録
        thisMonthPosts: 5,
        averagePostsPerDay: 2
      };

      Object.assign(mockState, { diaryStats: mockStats });

      renderHook(() => useMotivation(), { wrapper });
      
      // 達成通知の追加が呼ばれることを確認
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ADD_MOTIVATION_MESSAGE',
          payload: expect.objectContaining({
            type: 'achievement',
            streakCount: 3
          })
        })
      );
    });

    it('新記録でない場合は達成通知が生成されない', () => {
      const mockStats: DiaryStats = {
        totalPosts: 10,
        totalDays: 5,
        currentStreak: 2,
        longestStreak: 5, // 現在の記録は新記録ではない
        thisMonthPosts: 5,
        averagePostsPerDay: 2
      };

      Object.assign(mockState, { diaryStats: mockStats });

      renderHook(() => useMotivation(), { wrapper });
      
      // 達成通知の追加が呼ばれないことを確認
      const achievementCalls = mockDispatch.mock.calls.filter(call => 
        call[0].type === 'ADD_MOTIVATION_MESSAGE' && 
        call[0].payload?.type === 'achievement'
      );
      expect(achievementCalls).toHaveLength(0);
    });
  });

  describe('月末サマリーの生成', () => {
    it('月末の場合にサマリーメッセージが生成される', () => {
      // 月末の日付に設定（1月31日）
      vi.setSystemTime(new Date('2024-01-31T10:00:00Z'));

      const mockPosts: Post[] = [
        {
          id: '1',
          content: '1月の投稿',
          createdAt: new Date('2024-01-15T09:00:00Z'),
          updatedAt: new Date('2024-01-15T09:00:00Z'),
        }
      ];

      Object.assign(mockState, { posts: mockPosts });

      renderHook(() => useMotivation(), { wrapper });
      
      // 月末サマリーの追加が呼ばれることを確認
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ADD_MOTIVATION_MESSAGE',
          payload: expect.objectContaining({
            type: 'reminder',
            title: '2024年1月のサマリー'
          })
        })
      );
    });

    it('月末でない場合はサマリーメッセージが生成されない', () => {
      // 月の途中の日付に設定（1月15日）
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      renderHook(() => useMotivation(), { wrapper });
      
      // 月末サマリーの追加が呼ばれないことを確認
      const summaryCalls = mockDispatch.mock.calls.filter(call => 
        call[0].type === 'ADD_MOTIVATION_MESSAGE' && 
        call[0].payload?.type === 'reminder'
      );
      expect(summaryCalls).toHaveLength(0);
    });
  });

  describe('期限切れメッセージのクリーンアップ', () => {
    it('期限切れのメッセージが削除される', () => {
      const now = new Date();
      const expiredMessage = {
        id: 'expired-message',
        type: 'encouragement' as const,
        title: '期限切れメッセージ',
        message: 'テスト',
        isVisible: true,
        createdAt: now,
        expiresAt: new Date(now.getTime() - 60000) // 1分前に期限切れ
      };

      Object.assign(mockState, { motivationMessages: [expiredMessage] });

      renderHook(() => useMotivation(), { wrapper });
      
      // 期限切れメッセージの削除が呼ばれることを確認
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'REMOVE_MOTIVATION_MESSAGE',
        payload: 'expired-message'
      });
    });

    it('有効なメッセージは削除されない', () => {
      const now = new Date();
      const validMessage = {
        id: 'valid-message',
        type: 'encouragement' as const,
        title: '有効なメッセージ',
        message: 'テスト',
        isVisible: true,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 60000) // 1分後に期限切れ
      };

      Object.assign(mockState, { motivationMessages: [validMessage] });

      renderHook(() => useMotivation(), { wrapper });
      
      // 有効なメッセージの削除が呼ばれないことを確認
      const removeCalls = mockDispatch.mock.calls.filter(call => 
        call[0].type === 'REMOVE_MOTIVATION_MESSAGE' && 
        call[0].payload === 'valid-message'
      );
      expect(removeCalls).toHaveLength(0);
    });
  });

  describe('ユーティリティ機能', () => {
    it('isEndOfMonthが正しく動作する', () => {
      // 月末の日付に設定
      vi.setSystemTime(new Date('2024-01-31T10:00:00Z'));
      
      const { result } = renderHook(() => useMotivation(), { wrapper });
      
      expect(result.current.isEndOfMonth).toBe(true);
    });

    it('streakInfoが正しく返される', () => {
      const mockStats: DiaryStats = {
        totalPosts: 10,
        totalDays: 5,
        currentStreak: 3,
        longestStreak: 5,
        thisMonthPosts: 5,
        averagePostsPerDay: 2
      };

      Object.assign(mockState, { diaryStats: mockStats });

      const { result } = renderHook(() => useMotivation(), { wrapper });
      
      expect(result.current.streakInfo).toEqual({
        current: 3,
        longest: 5
      });
    });
  });
});