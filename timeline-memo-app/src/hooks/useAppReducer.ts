import { useReducer } from 'react';
import type { AppState, AppAction } from '../types';

// 初期状態の定義
const initialState: AppState = {
  posts: [],
  selectedPostId: null,
  highlightedPostIds: [],
  loading: {
    isLoading: false,
  },
  error: null,
  toasts: [],
  viewMode: 'timeline'
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
        error: null
      };

    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post => 
          post.id === action.payload.id ? action.payload : post
        ),
        error: null
      };

    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload),
        selectedPostId: state.selectedPostId === action.payload ? null : state.selectedPostId,
        error: null
      };

    case 'SELECT_POST':
      return {
        ...state,
        selectedPostId: action.payload
      };

    case 'HIGHLIGHT_POSTS':
      return {
        ...state,
        highlightedPostIds: action.payload
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