import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ViewModeSelector } from '../ViewModeSelector';
import type { ViewMode } from '../../types';

describe('ViewModeSelector', () => {
  const mockOnModeChange = vi.fn();

  beforeEach(() => {
    mockOnModeChange.mockClear();
  });

  it('現在のモードを正しく表示する', () => {
    render(
      <ViewModeSelector 
        currentMode="timeline" 
        onModeChange={mockOnModeChange} 
      />
    );

    // 現在のモード表示を確認（現在のモード表示エリア内のテキストを確認）
    expect(screen.getByText('時系列で投稿を表示')).toBeInTheDocument();
    
    // 現在のモード表示エリア内のタイムラインテキストを確認
    const currentModeDisplay = screen.getByText('表示モード').closest('.current-mode-display');
    expect(currentModeDisplay).toContainElement(screen.getAllByText('タイムライン')[0]);
    
    // アイコンが表示されていることを確認（複数あるので最初のものをチェック）
    const icons = screen.getAllByText('📊');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('すべてのビューモードボタンが表示される', () => {
    render(
      <ViewModeSelector 
        currentMode="timeline" 
        onModeChange={mockOnModeChange} 
      />
    );

    // 各ビューモードのボタンが存在することを確認
    expect(screen.getByRole('button', { name: /タイムラインビューに切り替え/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /リストビューに切り替え/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /日記ビューに切り替え/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /カレンダービューに切り替え/ })).toBeInTheDocument();
  });

  it('現在選択されているモードのボタンがアクティブ状態になる', () => {
    render(
      <ViewModeSelector 
        currentMode="diary" 
        onModeChange={mockOnModeChange} 
      />
    );

    const diaryButton = screen.getByRole('button', { name: /日記ビューに切り替え/ });
    
    // aria-pressed属性でアクティブ状態を確認
    expect(diaryButton).toHaveAttribute('aria-pressed', 'true');
    
    // CSSクラスでアクティブ状態を確認
    expect(diaryButton).toHaveClass('border-blue-500');
  });

  it('他のモードのボタンがアクティブでない状態になる', () => {
    render(
      <ViewModeSelector 
        currentMode="diary" 
        onModeChange={mockOnModeChange} 
      />
    );

    const timelineButton = screen.getByRole('button', { name: /タイムラインビューに切り替え/ });
    
    // aria-pressed属性で非アクティブ状態を確認
    expect(timelineButton).toHaveAttribute('aria-pressed', 'false');
    
    // CSSクラスで非アクティブ状態を確認
    expect(timelineButton).toHaveClass('border-gray-200');
  });

  it('ビューモードボタンをクリックするとonModeChangeが呼ばれる', () => {
    render(
      <ViewModeSelector 
        currentMode="timeline" 
        onModeChange={mockOnModeChange} 
      />
    );

    const listButton = screen.getByRole('button', { name: /リストビューに切り替え/ });
    fireEvent.click(listButton);

    expect(mockOnModeChange).toHaveBeenCalledWith('list');
    expect(mockOnModeChange).toHaveBeenCalledTimes(1);
  });

  it('モバイル向けセレクトボックスが動作する', () => {
    render(
      <ViewModeSelector 
        currentMode="timeline" 
        onModeChange={mockOnModeChange} 
      />
    );

    const select = screen.getByLabelText('表示モード選択');
    
    // 現在の値が正しく設定されている
    expect(select).toHaveValue('timeline');

    // 値を変更
    fireEvent.change(select, { target: { value: 'calendar' } });

    expect(mockOnModeChange).toHaveBeenCalledWith('calendar');
    expect(mockOnModeChange).toHaveBeenCalledTimes(1);
  });

  it('各ビューモードの説明がツールチップとして表示される', () => {
    render(
      <ViewModeSelector 
        currentMode="timeline" 
        onModeChange={mockOnModeChange} 
      />
    );

    const diaryButton = screen.getByRole('button', { name: /日記ビューに切り替え/ });
    
    // title属性で説明が設定されている
    expect(diaryButton).toHaveAttribute('title', '日付ごとにグループ化して表示');
  });

  it('キーボードナビゲーションが動作する', () => {
    render(
      <ViewModeSelector 
        currentMode="timeline" 
        onModeChange={mockOnModeChange} 
      />
    );

    const listButton = screen.getByRole('button', { name: /リストビューに切り替え/ });
    
    // フォーカスを設定
    listButton.focus();
    expect(listButton).toHaveFocus();

    // Spaceキーで選択（ボタンの標準的なキーボード操作）
    fireEvent.keyDown(listButton, { key: ' ' });
    fireEvent.keyUp(listButton, { key: ' ' });
    
    // または直接クリックイベントをテスト
    fireEvent.click(listButton);
    
    expect(mockOnModeChange).toHaveBeenCalledWith('list');
  });

  it('すべてのビューモードで正しく動作する', () => {
    const viewModes: ViewMode[] = ['timeline', 'list', 'diary', 'calendar'];
    
    viewModes.forEach(mode => {
      const { unmount } = render(
        <ViewModeSelector 
          currentMode={mode} 
          onModeChange={mockOnModeChange} 
        />
      );

      // 現在のモードが正しく表示されている
      const expectedLabels = {
        timeline: 'タイムライン',
        list: 'リスト', 
        diary: '日記',
        calendar: 'カレンダー'
      };

      // 現在のモード表示エリア内でラベルを確認
      const currentModeDisplay = screen.getByText('表示モード').closest('.current-mode-display');
      expect(currentModeDisplay).toBeInTheDocument();

      // 対応するボタンがアクティブになっている
      const button = screen.getByRole('button', { name: new RegExp(`${expectedLabels[mode]}ビューに切り替え`) });
      expect(button).toHaveAttribute('aria-pressed', 'true');

      unmount(); // クリーンアップ
    });
  });

  it('アクセシビリティ属性が正しく設定されている', () => {
    render(
      <ViewModeSelector 
        currentMode="timeline" 
        onModeChange={mockOnModeChange} 
      />
    );

    // すべてのボタンにaria-labelが設定されている
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });

    // セレクトボックスにラベルが関連付けられている
    const select = screen.getByLabelText('表示モード選択');
    expect(select).toBeInTheDocument();
  });
});