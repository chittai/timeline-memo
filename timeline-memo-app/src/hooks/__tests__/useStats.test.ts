import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement, createContext, useContext, useReducer } from 'react';
import { useStats, compareStats } from '../useStats';
import { StatsService } from '../../services/StatsService';
import { Post, DiaryStats, AppState, AppAction } from '../../types';
import { ReactNode } from 'react';

// StatsServiceのモック
import { vi } from 'vitest';

vi.mock('../../services/StatsService');
const mockStatsService = StatsService as any;

// テスト用のContext
interface TestAppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const TestAppContext = createContext<TestAppContextType | undefined>(undefined);

// テスト用のReducer（簡略版）
function testAppReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_DIARY_STATS':
      return { ...state, diaryStats: action.payload, loading: { isLoading: false } };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: { isLoading: false } };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// テスト用のProvider
function TestAppProvider({ children, initialState }: { children: ReactNode; initialState: AppState }) {
  const [state, dispatch] = useReducer(testAppReducer, initialState);
  const value = { state, dispatch };
  return createElement(TestAppContext.Provider, { value }, children);
}

// テスト用のuseAppContext
function useTestAppContext() {
  const context = useContext(TestAppContext);
  if (!context) {
    throw new Error('useTestAppContext must be used within TestAppProvider');
  }
  return context;
}

// useStatsフックをテスト用にモック
vi.mock('../../context/AppContext', () => ({
  useAppContext: () => useTestAppContext()
}));

// テスト用のラッパーコンポーネント
const createWrapper = (initialPosts: Post[] = []) => {
  return ({ children }: { children: ReactNode }) => {
    const initialState = { 
      posts: initialPosts,
      selectedPostId: null,
      highlightedPostIds: [],
      loading: { isLoading: false },
      error: null,
      toasts: [],
      viewMode: 'timeline' as const,
      selectedDate: null,
      diaryEntries: [],
      calendarData: [],
      diaryStats: null
    };
    return createElement(TestAppProvider, { initialState }, children);
  };
};

// テスト用のモックデータ
const mockPosts: Post[] = [
  {
    id: '1',
    content: '今日は良い天気でした',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    id: '2',
    content: '昨日の続きを書きます',
    createdAt: new Date('2024-01-14T15:30:00Z'),
    updatedAt: new Date('2024-01-14T15:30:00Z')
  }
];

const mockStats: DiaryStats = {
  totalPosts: 2,
  totalDays: 2,
  currentStreak: 2,
  longestStreak: 2,
  thisMonthPosts: 2,
  averagePostsPerDay: 1.0
};

const mockMonthlySummary = {
  year: 2024,
  month: 1,
  postCount: 2,
  activeDays: 2,
  averagePostsPerDay: 1.0,
  longestStreakInMonth: 2
};

describe('useStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // デフォルトのモック実装を設定
    mockStatsService.calculateDiaryStats = vi.fn().mockReturnValue(mockStats);
    mockStatsService.generateMonthlySummary = vi.fn().mockReturnValue(mockMonthlySummary);
    mockStatsService.generateMotivationMessage = vi.fn().mockReturnValue('素晴らしい継続力です！');
  });

  describe('基本機能', () => {
    it('投稿データがない場合、統計データがnullである', async () => {
      // 投稿データが空の場合のテスト
      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useStats(), { wrapper });

      // 投稿データがない場合は統計データがnull
      expect(result.current.stats).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('投稿データがある場合、自動的に統計を計算する', async () => {
      const wrapper = createWrapper(mockPosts);
      const { result } = renderHook(() => useStats(), { wrapper });

      await waitFor(() => {
        expect(mockStatsService.calculateDiaryStats).toHaveBeenCalledWith(mockPosts);
        expect(result.current.stats).toEqual(mockStats);
      });
    });

    it('refreshStats関数で手動更新ができる', async () => {
      const wrapper = createWrapper(mockPosts);
      const { result } = renderHook(() => useStats(), { wrapper });

      await act(async () => {
        await result.current.refreshStats();
      });

      expect(mockStatsService.calculateDiaryStats).toHaveBeenCalledWith(mockPosts);
    });
  });

  describe('月間サマリー機能', () => {
    it('現在の月間サマリーを取得できる', async () => {
      const wrapper = createWrapper(mockPosts);
      const { result } = renderHook(() => useStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.monthlySummary).toEqual(mockMonthlySummary);
      });
    });

    it('指定した年月の月間サマリーを取得できる', async () => {
      const wrapper = createWrapper(mockPosts);
      const { result } = renderHook(() => useStats(), { wrapper });

      const summary = await result.current.getMonthlySummary(2024, 1);
      
      expect(mockStatsService.generateMonthlySummary).toHaveBeenCalledWith(mockPosts, 2024, 1);
      expect(summary).toEqual(mockMonthlySummary);
    });
  });

  describe('促進メッセージ機能', () => {
    it('統計データがある場合、促進メッセージを生成する', async () => {
      const wrapper = createWrapper(mockPosts);
      const { result } = renderHook(() => useStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.motivationMessage).toBe('素晴らしい継続力です！');
      });
    });

    it('includeMotivation=falseの場合、促進メッセージを生成しない', async () => {
      const wrapper = createWrapper(mockPosts);
      const { result } = renderHook(() => useStats({ includeMotivation: false }), { wrapper });

      await waitFor(() => {
        expect(result.current.motivationMessage).toBeNull();
      });
    });
  });

  describe('計算済み統計値', () => {
    it('統計データから計算済み値を正しく算出する', async () => {
      const wrapper = createWrapper(mockPosts);
      const { result } = renderHook(() => useStats(), { wrapper });

      await waitFor(() => {
        const { computedStats } = result.current;
        
        expect(computedStats.hasRecentActivity).toBe(true);
        expect(computedStats.isOnStreak).toBe(true);
        expect(computedStats.streakPercentage).toBe(100); // currentStreak === longestStreak
        expect(computedStats.averageQuality).toBe('medium'); // averagePostsPerDay = 1.0
      });
    });

    it('統計データがない場合、デフォルト値を返す', async () => {
      // 統計データがnullの場合のテスト用ラッパー
      const TestWrapper = ({ children }: { children: ReactNode }) => {
        const initialState = { 
          posts: [],
          selectedPostId: null,
          highlightedPostIds: [],
          loading: { isLoading: false },
          error: null,
          toasts: [],
          viewMode: 'timeline' as const,
          selectedDate: null,
          diaryEntries: [],
          calendarData: [],
          diaryStats: null // 明示的にnullを設定
        };
        return createElement(TestAppProvider, { initialState }, children);
      };

      const { result } = renderHook(() => useStats(), { wrapper: TestWrapper });

      const { computedStats } = result.current;
      
      expect(computedStats.hasRecentActivity).toBe(false);
      expect(computedStats.isOnStreak).toBe(false);
      expect(computedStats.streakPercentage).toBe(0);
      expect(computedStats.monthlyProgress).toBe(0);
      expect(computedStats.averageQuality).toBe('low');
    });
  });

  describe('オプション設定', () => {
    it('autoRefresh=falseの場合、自動更新しない', async () => {
      // モックをクリアしてから開始
      vi.clearAllMocks();
      mockStatsService.calculateDiaryStats = vi.fn().mockReturnValue(mockStats);
      
      const wrapper = createWrapper(mockPosts);
      renderHook(() => useStats({ autoRefresh: false }), { wrapper });

      // 少し待ってもcalculateDiaryStatsが呼ばれないことを確認
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockStatsService.calculateDiaryStats).not.toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('統計計算でエラーが発生した場合、エラー状態を設定する', async () => {
      mockStatsService.calculateDiaryStats = vi.fn().mockImplementation(() => {
        throw new Error('統計計算エラー');
      });

      const wrapper = createWrapper(mockPosts);
      const { result } = renderHook(() => useStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe('統計計算エラー');
      });
    });

    it('月間サマリー取得でエラーが発生した場合、例外を投げる', async () => {
      mockStatsService.generateMonthlySummary = vi.fn().mockImplementation(() => {
        throw new Error('月間サマリーエラー');
      });

      const wrapper = createWrapper(mockPosts);
      const { result } = renderHook(() => useStats(), { wrapper });

      await expect(result.current.getMonthlySummary(2024, 1)).rejects.toThrow('月間サマリーエラー');
    });
  });
});

describe('compareStats', () => {
  const prevStats: DiaryStats = {
    totalPosts: 5,
    totalDays: 3,
    currentStreak: 2,
    longestStreak: 3,
    thisMonthPosts: 3,
    averagePostsPerDay: 1.67
  };

  const currentStats: DiaryStats = {
    totalPosts: 6,
    totalDays: 4,
    currentStreak: 3,
    longestStreak: 3,
    thisMonthPosts: 4,
    averagePostsPerDay: 1.5
  };

  it('統計の変化を正しく検出する', () => {
    const result = compareStats(prevStats, currentStats);

    expect(result.hasChanged).toBe(true);
    expect(result.changes.totalPosts).toBe(1);
    expect(result.changes.currentStreak).toBe(1);
    expect(result.changes.thisMonthPosts).toBe(1);
  });

  it('統計に変化がない場合、hasChangedがfalseになる', () => {
    const result = compareStats(prevStats, prevStats);

    expect(result.hasChanged).toBe(false);
    expect(result.changes).toEqual({});
  });

  it('前の統計がnullの場合、適切に処理する', () => {
    const result = compareStats(null, currentStats);

    expect(result.hasChanged).toBe(true);
    expect(result.changes).toEqual({});
  });

  it('現在の統計がnullの場合、適切に処理する', () => {
    const result = compareStats(prevStats, null);

    expect(result.hasChanged).toBe(false);
    expect(result.changes).toEqual({});
  });

  it('両方の統計がnullの場合、適切に処理する', () => {
    const result = compareStats(null, null);

    expect(result.hasChanged).toBe(false);
    expect(result.changes).toEqual({});
  });
});