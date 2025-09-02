import { render, screen, act, fireEvent } from '@testing-library/react';
import { AppProvider, useAppContext } from '../AppContext';
import type { Post } from '../../types';

// テスト用のコンポーネント
function TestComponent() {
  const { state, dispatch } = useAppContext();
  
  return (
    <div>
      <div data-testid="posts-count">{state.posts.length}</div>
      <div data-testid="loading">{state.loading.isLoading.toString()}</div>
      <div data-testid="loading-operation">{state.loading.operation || 'none'}</div>
      <div data-testid="error">{state.error || 'no-error'}</div>
      <div data-testid="selected-post">{state.selectedPostId || 'none'}</div>
      <div data-testid="highlighted-post">{state.highlightedPostIds.join(',') || 'none'}</div>
      
      <button 
        data-testid="add-post-button"
        onClick={() => dispatch({
          type: 'ADD_POST',
          payload: {
            id: 'test-id',
            content: 'テスト投稿',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })}
      >
        投稿追加
      </button>
      
      <button 
        data-testid="set-loading-button"
        onClick={() => dispatch({ 
          type: 'SET_LOADING', 
          payload: { isLoading: true, operation: 'creating' } 
        })}
      >
        ローディング設定
      </button>
      
      <button 
        data-testid="set-error-button"
        onClick={() => dispatch({ type: 'SET_ERROR', payload: 'テストエラー' })}
      >
        エラー設定
      </button>
      
      <button 
        data-testid="select-post-button"
        onClick={() => dispatch({ type: 'SELECT_POST', payload: 'test-id' })}
      >
        投稿選択
      </button>
      
      <button 
        data-testid="highlight-post-button"
        onClick={() => dispatch({ type: 'HIGHLIGHT_POST', payload: 'test-id' })}
      >
        投稿ハイライト
      </button>
      
      <button 
        data-testid="load-posts-button"
        onClick={() => dispatch({
          type: 'LOAD_POSTS',
          payload: [
            {
              id: 'post-1',
              content: '投稿1',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01')
            },
            {
              id: 'post-2',
              content: '投稿2',
              createdAt: new Date('2024-01-02'),
              updatedAt: new Date('2024-01-02')
            }
          ]
        })}
      >
        投稿読み込み
      </button>
      
      <button 
        data-testid="update-post-button"
        onClick={() => dispatch({
          type: 'UPDATE_POST',
          payload: {
            id: 'test-id',
            content: '更新された投稿',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })}
      >
        投稿更新
      </button>
      
      <button 
        data-testid="delete-post-button"
        onClick={() => dispatch({ type: 'DELETE_POST', payload: 'test-id' })}
      >
        投稿削除
      </button>
      
      <button 
        data-testid="clear-error-button"
        onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
      >
        エラークリア
      </button>
    </div>
  );
}

describe('AppContext', () => {
  test('AppProvider が正しく初期状態を提供する', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('posts-count')).toHaveTextContent('0');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('loading-operation')).toHaveTextContent('none');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('selected-post')).toHaveTextContent('none');
    expect(screen.getByTestId('highlighted-post')).toHaveTextContent('none');
  });

  test('ADD_POST アクションが正しく動作する', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('add-post-button'));
    });

    expect(screen.getByTestId('posts-count')).toHaveTextContent('1');
  });

  test('LOAD_POSTS アクションが正しく動作する', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('load-posts-button'));
    });

    expect(screen.getByTestId('posts-count')).toHaveTextContent('2');
  });

  test('UPDATE_POST アクションが正しく動作する', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // まず投稿を追加
    act(() => {
      fireEvent.click(screen.getByTestId('add-post-button'));
    });

    // 投稿を更新
    act(() => {
      fireEvent.click(screen.getByTestId('update-post-button'));
    });

    expect(screen.getByTestId('posts-count')).toHaveTextContent('1');
  });

  test('DELETE_POST アクションが正しく動作する', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // まず投稿を追加
    act(() => {
      fireEvent.click(screen.getByTestId('add-post-button'));
    });

    expect(screen.getByTestId('posts-count')).toHaveTextContent('1');

    // 投稿を削除
    act(() => {
      fireEvent.click(screen.getByTestId('delete-post-button'));
    });

    expect(screen.getByTestId('posts-count')).toHaveTextContent('0');
  });

  test('SET_LOADING アクションが正しく動作する', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('set-loading-button'));
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(screen.getByTestId('loading-operation')).toHaveTextContent('creating');
  });

  test('SET_ERROR アクションが正しく動作する', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('set-error-button'));
    });

    expect(screen.getByTestId('error')).toHaveTextContent('テストエラー');
  });

  test('CLEAR_ERROR アクションが正しく動作する', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // まずエラーを設定
    act(() => {
      fireEvent.click(screen.getByTestId('set-error-button'));
    });

    expect(screen.getByTestId('error')).toHaveTextContent('テストエラー');

    // エラーをクリア
    act(() => {
      fireEvent.click(screen.getByTestId('clear-error-button'));
    });

    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  test('SELECT_POST アクションが正しく動作する', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('select-post-button'));
    });

    expect(screen.getByTestId('selected-post')).toHaveTextContent('test-id');
  });

  test('HIGHLIGHT_POST アクションが正しく動作する', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('highlight-post-button'));
    });

    expect(screen.getByTestId('highlighted-post')).toHaveTextContent('test-id');
  });

  test('useAppContext が AppProvider 外で使用された場合にエラーを投げる', () => {
    // コンソールエラーを抑制
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAppContext は AppProvider 内で使用する必要があります');

    consoleSpy.mockRestore();
  });

  test('複数のアクションが連続して正しく動作する', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // 投稿を追加
    act(() => {
      fireEvent.click(screen.getByTestId('add-post-button'));
    });

    // 投稿を選択
    act(() => {
      fireEvent.click(screen.getByTestId('select-post-button'));
    });

    // ローディング状態を設定
    act(() => {
      fireEvent.click(screen.getByTestId('set-loading-button'));
    });

    expect(screen.getByTestId('posts-count')).toHaveTextContent('1');
    expect(screen.getByTestId('selected-post')).toHaveTextContent('test-id');
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });
});