import type { 
  Post, 
  DiaryEntry, 
  CalendarDay, 
  DiaryStats, 
  MotivationMessage, 
  Toast,
  AppState,
  LoadingState,
  TimelineMarkerData
} from '../../types';

/**
 * テスト用のモックデータ生成関数群
 * 各データ型に対応したファクトリー関数を提供
 */

/**
 * モックPostデータを生成する関数
 */
export const createMockPost = (overrides: Partial<Post> = {}): Post => {
  const now = new Date();
  const defaultPost: Post = {
    id: `post-${Math.random().toString(36).substr(2, 9)}`,
    content: 'テスト投稿内容です。これはサンプルのMarkdownテキストです。',
    createdAt: now,
    updatedAt: now,
    tags: ['テスト', 'サンプル']
  };

  return { ...defaultPost, ...overrides };
};

/**
 * 複数のモックPostデータを生成する関数
 */
export const createMockPosts = (count: number, baseOverrides: Partial<Post> = {}): Post[] => {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setHours(date.getHours() - index); // 1時間ずつ過去にずらす
    
    return createMockPost({
      content: `テスト投稿 ${index + 1}`,
      createdAt: date,
      updatedAt: date,
      ...baseOverrides
    });
  });
};

/**
 * 日付範囲内のモックPostデータを生成する関数
 */
export const createMockPostsInDateRange = (
  startDate: Date, 
  endDate: Date, 
  postsPerDay: number = 1
): Post[] => {
  const posts: Post[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    for (let i = 0; i < postsPerDay; i++) {
      const postDate = new Date(currentDate);
      postDate.setHours(9 + i * 2); // 9時から2時間間隔で投稿
      
      posts.push(createMockPost({
        content: `${currentDate.toLocaleDateString('ja-JP')}の投稿 ${i + 1}`,
        createdAt: postDate,
        updatedAt: postDate
      }));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return posts;
};

/**
 * モックDiaryEntryデータを生成する関数
 */
export const createMockDiaryEntry = (overrides: Partial<DiaryEntry> = {}): DiaryEntry => {
  const today = new Date();
  const posts = createMockPosts(2);
  
  const defaultEntry: DiaryEntry = {
    date: today.toISOString().split('T')[0], // YYYY-MM-DD形式
    posts: posts,
    postCount: posts.length
  };

  return { ...defaultEntry, ...overrides };
};

/**
 * 複数のモックDiaryEntryデータを生成する関数
 */
export const createMockDiaryEntries = (days: number): DiaryEntry[] => {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    
    const postCount = Math.floor(Math.random() * 3) + 1; // 1-3個の投稿
    const posts = createMockPosts(postCount, {
      createdAt: date,
      updatedAt: date
    });
    
    return createMockDiaryEntry({
      date: date.toISOString().split('T')[0],
      posts: posts,
      postCount: posts.length
    });
  });
};

/**
 * モックCalendarDayデータを生成する関数
 */
export const createMockCalendarDay = (overrides: Partial<CalendarDay> = {}): CalendarDay => {
  const today = new Date();
  
  const defaultCalendarDay: CalendarDay = {
    date: today,
    hasPost: true,
    postCount: 2,
    isToday: true,
    isSelected: false
  };

  return { ...defaultCalendarDay, ...overrides };
};

/**
 * 月のカレンダーデータを生成する関数
 */
export const createMockCalendarMonth = (year: number, month: number): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const hasPost = Math.random() > 0.3; // 70%の確率で投稿あり
    const postCount = hasPost ? Math.floor(Math.random() * 3) + 1 : 0;
    
    days.push(createMockCalendarDay({
      date: date,
      hasPost: hasPost,
      postCount: postCount,
      isToday: date.toDateString() === today.toDateString(),
      isSelected: false
    }));
  }
  
  return days;
};

/**
 * モックDiaryStatsデータを生成する関数
 */
export const createMockDiaryStats = (overrides: Partial<DiaryStats> = {}): DiaryStats => {
  const defaultStats: DiaryStats = {
    totalPosts: 150,
    totalDays: 45,
    currentStreak: 7,
    longestStreak: 21,
    thisMonthPosts: 32,
    averagePostsPerDay: 3.3
  };

  return { ...defaultStats, ...overrides };
};

/**
 * モックMotivationMessageデータを生成する関数
 */
export const createMockMotivationMessage = (overrides: Partial<MotivationMessage> = {}): MotivationMessage => {
  const now = new Date();
  
  const defaultMessage: MotivationMessage = {
    id: `motivation-${Math.random().toString(36).substr(2, 9)}`,
    type: 'encouragement',
    title: '素晴らしい継続です！',
    message: '7日連続で投稿を続けています。この調子で頑張りましょう！',
    daysSinceLastPost: 0,
    streakCount: 7,
    isVisible: true,
    createdAt: now
  };

  return { ...defaultMessage, ...overrides };
};

/**
 * モックToastデータを生成する関数
 */
export const createMockToast = (overrides: Partial<Toast> = {}): Toast => {
  const defaultToast: Toast = {
    id: `toast-${Math.random().toString(36).substr(2, 9)}`,
    type: 'success',
    title: '投稿が保存されました',
    message: '投稿が正常に保存されました。',
    duration: 3000
  };

  return { ...defaultToast, ...overrides };
};

/**
 * モックLoadingStateデータを生成する関数
 */
export const createMockLoadingState = (overrides: Partial<LoadingState> = {}): LoadingState => {
  const defaultLoadingState: LoadingState = {
    isLoading: false,
    operation: undefined,
    progress: undefined
  };

  return { ...defaultLoadingState, ...overrides };
};

/**
 * モックTimelineMarkerDataを生成する関数
 */
export const createMockTimelineMarker = (overrides: Partial<TimelineMarkerData> = {}): TimelineMarkerData => {
  const now = new Date();
  
  const defaultMarker: TimelineMarkerData = {
    timestamp: now,
    postIds: ['post-1', 'post-2'],
    position: 50 // 50%の位置
  };

  return { ...defaultMarker, ...overrides };
};

/**
 * 完全なモックAppStateデータを生成する関数
 */
export const createMockAppState = (overrides: Partial<AppState> = {}): AppState => {
  const posts = createMockPosts(5);
  const today = new Date();
  
  const defaultState: AppState = {
    posts: posts,
    selectedPostId: null,
    highlightedPostIds: [],
    loading: createMockLoadingState(),
    error: null,
    toasts: [],
    viewMode: 'timeline',
    selectedDate: null,
    diaryEntries: createMockDiaryEntries(7),
    calendarData: createMockCalendarMonth(today.getFullYear(), today.getMonth() + 1),
    diaryStats: createMockDiaryStats(),
    motivationMessages: [createMockMotivationMessage()],
    lastPostDate: posts[0]?.createdAt || null,
    daysSinceLastPost: 0
  };

  return { ...defaultState, ...overrides };
};

/**
 * 空状態のモックAppStateデータを生成する関数
 */
export const createEmptyMockAppState = (): AppState => {
  return createMockAppState({
    posts: [],
    diaryEntries: [],
    calendarData: [],
    diaryStats: createMockDiaryStats({
      totalPosts: 0,
      totalDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      thisMonthPosts: 0,
      averagePostsPerDay: 0
    }),
    motivationMessages: [],
    lastPostDate: null,
    daysSinceLastPost: 0
  });
};

/**
 * エラー状態のモックAppStateデータを生成する関数
 */
export const createErrorMockAppState = (errorMessage: string = 'テストエラーが発生しました'): AppState => {
  return createMockAppState({
    error: errorMessage,
    loading: createMockLoadingState({ isLoading: false })
  });
};

/**
 * ローディング状態のモックAppStateデータを生成する関数
 */
export const createLoadingMockAppState = (operation: string = 'データを読み込み中'): AppState => {
  return createMockAppState({
    loading: createMockLoadingState({ 
      isLoading: true, 
      operation: operation,
      progress: 50 
    })
  });
};