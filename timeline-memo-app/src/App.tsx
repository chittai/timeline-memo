import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { PostForm } from './components/PostForm';
import { PostList } from './components/PostList';
import { SimpleToastContainer } from './components/SimpleToastContainer';
import { useSimplePosts } from './hooks/useSimplePosts';
import { useToast } from './hooks/useToast';
import type { Post } from './types';

/**
 * 投稿機能付きアプリケーションコンポーネント
 */
function PostApp() {
  const { posts, isLoading, createPost, updatePost, deletePost, getStats } = useSimplePosts();
  const { toasts, success, error, removeToast } = useToast();
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);

  const stats = getStats();

  // 新規投稿作成
  const handleCreatePost = async (content: string) => {
    try {
      await createPost(content);
      success('投稿完了', '新しい投稿を作成しました');
      setShowForm(false);
    } catch {
      error('投稿失敗', '投稿の作成に失敗しました');
    }
  };

  // 投稿編集
  const handleUpdatePost = async (content: string) => {
    if (!editingPost) return;
    
    try {
      await updatePost(editingPost.id, content);
      success('更新完了', '投稿を更新しました');
      setEditingPost(null);
    } catch {
      error('更新失敗', '投稿の更新に失敗しました');
    }
  };

  // 投稿削除
  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      success('削除完了', '投稿を削除しました');
    } catch {
      error('削除失敗', '投稿の削除に失敗しました');
    }
  };

  // 編集開始
  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setShowForm(false);
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setEditingPost(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              📝 タイムライン日記アプリ
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {showForm ? 'フォームを閉じる' : '新規投稿'}
              </button>
              <div className="text-sm text-gray-500">
                v1.0.0
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: メインコンテンツエリア */}
          <div className="lg:col-span-2 space-y-6">
            {/* 投稿フォーム */}
            {(showForm || editingPost) && (
              <PostForm
                onSubmit={editingPost ? handleUpdatePost : handleCreatePost}
                onCancel={editingPost ? handleCancelEdit : () => setShowForm(false)}
                initialContent={editingPost?.content || ''}
                isEditing={!!editingPost}
              />
            )}

            {/* 投稿一覧 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  📚 投稿一覧
                </h2>
                <span className="text-sm text-gray-500">
                  {posts.length} 件の投稿
                </span>
              </div>
              <PostList
                posts={posts}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* 右側: サイドバー */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📊 統計情報
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">総投稿数</span>
                  <span className="font-semibold text-gray-900">{stats.totalPosts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">継続日数</span>
                  <span className="font-semibold text-gray-900">{stats.continuousDays}日</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">今月の投稿</span>
                  <span className="font-semibold text-gray-900">{stats.thisMonth}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎉 投稿機能が利用可能
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>✅ 投稿の作成・編集・削除</p>
                <p>✅ ローカルストレージでの保存</p>
                <p>✅ リアルタイム統計情報</p>
                <p>✅ トースト通知</p>
                <p className="mt-4 text-blue-600">
                  🔄 カレンダー機能は準備中です
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* トースト通知 */}
      <SimpleToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

/**
 * アプリケーションルートコンポーネント
 * AppProviderでコンテキストを提供
 */
function AppRoot() {
  return (
    <AppProvider>
      <PostApp />
    </AppProvider>
  );
}

export default AppRoot;