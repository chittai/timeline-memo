import { useReducer } from 'react';
import type { AppState, AppAction } from '../types';

// 初期状態の定義
const initialState: AppState = {
  // 既存の投稿関連状態
  posts: [],
  selectedPostId: null,
  highlightedPostIds: [],
  loading: {
    isLoading: false,
  },
  error: null,
  toasts: [],
  viewMode: 'timeline', // デフォルトはタイムラインビュー
  
  // 日記機能用の新規フィールド
  selectedDate: null,        // 選択された日付（カレンダービューで使用）
  diaryEntries: [],          // 日付ごとにグループ化された投稿エントリー
  calendarData: [],          // カレンダー表示用のデータ
  diaryStats: null,          // 投稿統計情報
  
  // 継続促進機能用の新規フィールド
  motivationMessages: [],    // 促進メッセージのリスト
  lastPostDate: null,        // 最後の投稿日
  daysSinceLastPost: 0       // 最後の投稿からの経過日数
};

// Reducerの実装
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_POSTS':
      return {
        ...state,
        posts: action.payload,
        loading: { isLoading: false },
        error: null
      };

    case 'ADD_POST':
      return {
        ...state,
        posts: [action.payload, ...state.posts], // 新しい投稿を先頭に追加
        error: null,
        // 投稿が追加されたら日記関連のデータをクリアして再計算を促す
        diaryEntries: [],
        calendarData: [],
        diaryStats: null,
        // 継続促進機能の状態も更新
        lastPostDate: action.payload.createdAt,
        daysSinceLastPost: 0 // 新しい投稿があったので0にリセット
      };

    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post => 
          post.id === action.payload.id ? action.payload : post
        ),
        error: null,
        // 投稿が更新されたら日記関連のデータをクリアして再計算を促す
        diaryEntries: [],
        calendarData: [],
        diaryStats: null
      };

    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload),
        selectedPostId: state.selectedPostId === action.payload ? null : state.selectedPostId,
        error: null,
        // 投稿が削除されたら日記関連のデータをクリアして再計算を促す
        diaryEntries: [],
        calendarData: [],
        diaryStats: null
        // 継続促進機能の状態は削除後に再計算されるため、ここでは更新しない
      };

    case 'SELECT_POST':
      return {
        ...state,
        selectedPostId: action.payload
      };

    case 'HIGHLIGHT_POST':
      return {
        ...state,
        highlightedPostIds: [action.payload]
      };

    case 'HIGHLIGHT_POSTS':
      return {
        ...state,
        highlightedPostIds: action.payload
      };

    case 'CLEAR_HIGHLIGHT':
      return {
        ...state,
        highlightedPostIds: []
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: { isLoading: false }
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.payload]
      };

    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload)
      };

    case 'CLEAR_TOASTS':
      return {
        ...state,
        toasts: []
      };

    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload,
        // ビューモード変更時にハイライトをクリア
        highlightedPostIds: [],
        // 日記ビューやカレンダービューに切り替える場合、選択状態をクリア
        selectedPostId: action.payload === 'diary' || action.payload === 'calendar' ? null : state.selectedPostId
      };

    // 日記機能用の新規アクションハンドラー
    
    // 選択された日付の設定（カレンダービューで使用）
    case 'SET_SELECTED_DATE':
      return {
        ...state,
        selectedDate: action.payload
      };

    // 日記エントリーの読み込み（日付ごとにグループ化された投稿）
    case 'LOAD_DIARY_ENTRIES':
      return {
        ...state,
        diaryEntries: action.payload,
        loading: { isLoading: false },
        error: null
      };

    // カレンダーデータの読み込み（月別のカレンダー表示用）
    case 'LOAD_CALENDAR_DATA':
      return {
        ...state,
        calendarData: action.payload,
        loading: { isLoading: false },
        error: null
      };

    // 日記統計の読み込み（投稿数、継続日数など）
    case 'LOAD_DIARY_STATS':
      return {
        ...state,
        diaryStats: action.payload,
        loading: { isLoading: false },
        error: null
      };

    // 継続促進機能用の新規アクションハンドラー
    
    // 促進メッセージの追加
    case 'ADD_MOTIVATION_MESSAGE':
      return {
        ...state,
        motivationMessages: [...state.motivationMessages, action.payload]
      };

    // 促進メッセージの削除
    case 'REMOVE_MOTIVATION_MESSAGE':
      return {
        ...state,
        motivationMessages: state.motivationMessages.filter(message => message.id !== action.payload)
      };

    // 全ての促進メッセージをクリア
    case 'CLEAR_MOTIVATION_MESSAGES':
      return {
        ...state,
        motivationMessages: []
      };

    // 最後の投稿日の更新
    case 'UPDATE_LAST_POST_DATE':
      return {
        ...state,
        lastPostDate: action.payload
      };

    // 最後の投稿からの経過日数の更新
    case 'UPDATE_DAYS_SINCE_LAST_POST':
      return {
        ...state,
        daysSinceLastPost: action.payload
      };

    default:
      return state;
  }
}

// useAppReducerカスタムフック
export function useAppReducer() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return {
    state,
    dispatch
  };
}