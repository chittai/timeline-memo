// Core Post interface
export interface Post {
  id: string;           // UUID
  content: string;      // Markdown対応のコンテンツ
  createdAt: Date;      // 投稿日時
  updatedAt: Date;      // 更新日時
  tags?: string[];      // 将来拡張用のタグ機能
}

// Post creation input (without generated fields)
export interface CreatePostInput {
  content: string;
  tags?: string[];
}

// Post update input (partial content update)
export interface UpdatePostInput {
  content?: string;
  tags?: string[];
}

// Timeline data structure
export interface TimelineData {
  posts: Post[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

// Timeline marker data for visualization
export interface TimelineMarkerData {
  timestamp: Date;
  postIds: string[];    // 同じ時間帯の複数投稿対応
  position: number;     // 時間軸上の位置（%）
}

// Application state management
export interface AppState {
  posts: Post[];
  selectedPostId: string | null;
  highlightedPostIds: string[]; // 時間軸とリスト間の連携用ハイライト
  loading: LoadingState;
  error: string | null;
  toasts: Toast[];
  viewMode: 'timeline' | 'list';
}

// State management actions
export type AppAction = 
  | { type: 'LOAD_POSTS'; payload: Post[] }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'UPDATE_POST'; payload: Post }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'SELECT_POST'; payload: string | null }
  | { type: 'HIGHLIGHT_POST'; payload: string } // 単一投稿のハイライト
  | { type: 'HIGHLIGHT_POSTS'; payload: string[] } // 複数投稿のハイライト
  | { type: 'CLEAR_HIGHLIGHT' } // ハイライトクリア
  | { type: 'SET_LOADING'; payload: LoadingState }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' } // エラークリア
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_TOASTS' }
  | { type: 'SET_VIEW_MODE'; payload: 'timeline' | 'list' };

// Data service interface for abstraction
export interface DataService {
  // CRUD操作
  createPost(content: string): Promise<Post>;
  updatePost(id: string, content: string): Promise<Post>;
  deletePost(id: string): Promise<void>;
  getPost(id: string): Promise<Post | null>;
  
  // 一覧・検索
  getAllPosts(): Promise<Post[]>;
  getPostsByDateRange(start: Date, end: Date): Promise<Post[]>;
  
  // リアルタイム更新（フェーズ2）
  subscribeToUpdates?(callback: (posts: Post[]) => void): () => void;
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  error?: string | null; // 単一エラーメッセージ用（後方互換性）
}

// Error types for better error handling
export type AppError = 
  | { type: 'VALIDATION_ERROR'; message: string; field?: string }
  | { type: 'STORAGE_ERROR'; message: string; operation?: string }
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'UNKNOWN_ERROR'; message: string };

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ミリ秒、undefinedの場合は自動で消えない
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Loading state types
export interface LoadingState {
  isLoading: boolean;
  operation?: string; // どの操作でローディング中かを示す
  progress?: number; // 0-100のプログレス（オプション）
}

// UI component props types
export interface PostItemProps {
  post: Post;
  isSelected?: boolean;
  isHighlighted?: boolean; // 時間軸からのハイライト表示用
  onSelect?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export interface TimelineMarkerProps {
  marker: TimelineMarkerData;
  posts: Post[];
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: (postIds: string[]) => void;
  onHover?: (postIds: string[]) => void;
  onHoverEnd?: () => void;
}