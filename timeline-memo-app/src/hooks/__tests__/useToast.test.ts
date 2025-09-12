import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useToast } from '../useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初期状態では空のトースト配列を返す', () => {
    const { result } = renderHook(() => useToast());
    
    expect(result.current.toasts).toEqual([]);
  });

  it('成功トーストを追加できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.success('成功', '操作が完了しました');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].title).toBe('成功');
    expect(result.current.toasts[0].message).toBe('操作が完了しました');
  });

  it('エラートーストを追加できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.error('エラー', '操作に失敗しました');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('error');
    expect(result.current.toasts[0].title).toBe('エラー');
    expect(result.current.toasts[0].message).toBe('操作に失敗しました');
  });

  it('情報トーストを追加できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.info('情報', 'お知らせがあります');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('info');
    expect(result.current.toasts[0].title).toBe('情報');
    expect(result.current.toasts[0].message).toBe('お知らせがあります');
  });

  it('警告トーストを追加できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.warning('警告', '注意が必要です');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('warning');
    expect(result.current.toasts[0].title).toBe('警告');
    expect(result.current.toasts[0].message).toBe('注意が必要です');
  });

  it('複数のトーストを追加できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.success('成功1', 'メッセージ1');
      result.current.error('エラー1', 'メッセージ2');
      result.current.info('情報1', 'メッセージ3');
    });
    
    expect(result.current.toasts).toHaveLength(3);
  });

  it('トーストを手動で削除できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.success('成功', 'メッセージ');
    });
    
    const toastId = result.current.toasts[0].id;
    
    act(() => {
      result.current.removeToast(toastId);
    });
    
    expect(result.current.toasts).toHaveLength(0);
  });

  it('トーストが自動的に削除される', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.success('成功', 'メッセージ');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    
    // 5秒経過
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(result.current.toasts).toHaveLength(0);
  });

  it('カスタム表示時間でトーストが削除される', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.success('成功', 'メッセージ', 3000);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    
    // 3秒経過
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(result.current.toasts).toHaveLength(0);
  });

  it('各トーストに一意のIDが割り当てられる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.success('成功1', 'メッセージ1');
      result.current.success('成功2', 'メッセージ2');
    });
    
    const ids = result.current.toasts.map(toast => toast.id);
    expect(new Set(ids).size).toBe(2); // 重複がないことを確認
  });

  it('最大表示数を超えると古いトーストが削除される', () => {
    const { result } = renderHook(() => useToast());
    
    // 6個のトーストを追加（最大5個と仮定）
    act(() => {
      for (let i = 1; i <= 6; i++) {
        result.current.success(`成功${i}`, `メッセージ${i}`);
      }
    });
    
    // 最大5個まで表示される想定
    expect(result.current.toasts.length).toBeLessThanOrEqual(5);
  });
});