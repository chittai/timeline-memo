import { useState, useEffect } from 'react';
import type { ViewMode } from '../types';

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

/**
 * ビューモード切り替えコンポーネント
 * タイムライン、リスト、日記、カレンダーの各ビューモードを切り替える
 * レスポンシブデザイン対応
 */
export function ViewModeSelector({ currentMode, onModeChange }: ViewModeSelectorProps) {
  // デバイス情報の状態管理
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // 画面サイズとデバイス情報の検出
  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // 画面サイズの判定
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
      
      // 向きの判定
      setOrientation(width > height ? 'landscape' : 'portrait');
      
      // タッチデバイスの判定
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateScreenInfo, 100);
    });

    return () => {
      window.removeEventListener('resize', updateScreenInfo);
      window.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, []);
  // ビューモードの定義（表示順序も含む）
  const viewModes: Array<{ mode: ViewMode; label: string; icon: string; description: string }> = [
    {
      mode: 'timeline',
      label: 'タイムライン',
      icon: '📊',
      description: '時系列で投稿を表示'
    },
    {
      mode: 'list',
      label: 'リスト',
      icon: '📝',
      description: '投稿をリスト形式で表示'
    },
    {
      mode: 'diary',
      label: '日記',
      icon: '📖',
      description: '日付ごとにグループ化して表示'
    },
    {
      mode: 'calendar',
      label: 'カレンダー',
      icon: '📅',
      description: 'カレンダー形式で投稿履歴を表示'
    }
  ];

  // レスポンシブ対応のスタイル計算
  const getResponsiveStyles = () => {
    return {
      container: 'view-mode-selector',
      
      currentModeDisplay: screenSize === 'mobile' 
        ? 'current-mode-display mb-3' 
        : 'current-mode-display mb-4',
      
      title: screenSize === 'mobile' 
        ? 'text-base font-semibold text-gray-800 dark:text-gray-200' 
        : 'text-lg font-semibold text-gray-800 dark:text-gray-200',
      
      currentModeContainer: screenSize === 'mobile' 
        ? 'flex items-center mt-1' 
        : 'flex items-center mt-2',
      
      currentModeIcon: screenSize === 'mobile' 
        ? 'text-xl mr-2' 
        : 'text-2xl mr-2',
      
      currentModeLabel: screenSize === 'mobile' 
        ? 'text-sm font-medium text-gray-900 dark:text-gray-100' 
        : 'font-medium text-gray-900 dark:text-gray-100',
      
      currentModeDescription: screenSize === 'mobile' 
        ? 'text-xs text-gray-600 dark:text-gray-400' 
        : 'text-sm text-gray-600 dark:text-gray-400',
      
      modeButtons: 'mode-buttons',
      
      buttonGrid: screenSize === 'mobile' && orientation === 'portrait'
        ? 'grid grid-cols-2 gap-2'
        : screenSize === 'mobile' && orientation === 'landscape'
        ? 'grid grid-cols-4 gap-2'
        : screenSize === 'tablet'
        ? 'grid grid-cols-4 gap-3'
        : 'grid grid-cols-2 gap-3 sm:grid-cols-4',
      
      modeButton: screenSize === 'mobile'
        ? `relative ${orientation === 'portrait' ? 'p-3' : 'p-2'} rounded-lg border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isTouchDevice ? 'min-h-12' : ''}`
        : 'relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      
      buttonIcon: screenSize === 'mobile' && orientation === 'landscape'
        ? 'text-lg mb-1'
        : screenSize === 'mobile'
        ? 'text-xl mb-2'
        : 'text-2xl mb-2',
      
      buttonLabel: screenSize === 'mobile' && orientation === 'landscape'
        ? 'text-xs font-medium'
        : screenSize === 'mobile'
        ? 'text-xs font-medium'
        : 'text-sm font-medium',
      
      indicator: screenSize === 'mobile'
        ? 'absolute top-1 right-1'
        : 'absolute top-2 right-2',
      
      indicatorDot: screenSize === 'mobile'
        ? 'w-1.5 h-1.5 bg-blue-500 rounded-full'
        : 'w-2 h-2 bg-blue-500 rounded-full',
      
      mobileSelector: screenSize === 'mobile' 
        ? 'mobile-selector mt-3' 
        : 'mobile-selector sm:hidden mt-4',
      
      selectLabel: screenSize === 'mobile' 
        ? 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' 
        : 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2',
      
      select: screenSize === 'mobile'
        ? 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
        : 'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
    };
  };

  const styles = getResponsiveStyles();

  return (
    <div className={styles.container}>
      {/* 現在のモード表示 */}
      {!(screenSize === 'mobile' && orientation === 'landscape') && (
        <div className={styles.currentModeDisplay}>
          <h3 className={styles.title}>
            表示モード
          </h3>
          <div className={styles.currentModeContainer}>
            <span className={styles.currentModeIcon}>
              {viewModes.find(vm => vm.mode === currentMode)?.icon}
            </span>
            <div>
              <div className={styles.currentModeLabel}>
                {viewModes.find(vm => vm.mode === currentMode)?.label}
              </div>
              {screenSize !== 'mobile' && (
                <div className={styles.currentModeDescription}>
                  {viewModes.find(vm => vm.mode === currentMode)?.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ビューモード切り替えボタン */}
      <div className={styles.modeButtons}>
        <div className={styles.buttonGrid}>
          {viewModes.map(({ mode, label, icon, description }) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`
                ${styles.modeButton}
                ${currentMode === mode
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${isTouchDevice ? 'touch-manipulation' : ''}
              `}
              title={description}
              aria-pressed={currentMode === mode}
              aria-label={`${label}ビューに切り替え`}
            >
              {/* アイコン */}
              <div className={styles.buttonIcon}>
                {icon}
              </div>
              
              {/* ラベル */}
              <div className={styles.buttonLabel}>
                {screenSize === 'mobile' && orientation === 'landscape' 
                  ? label.charAt(0) + (label.length > 2 ? label.charAt(1) : '') // 横向きモバイルでは短縮表示
                  : label
                }
              </div>
              
              {/* 選択中インジケーター */}
              {currentMode === mode && (
                <div className={styles.indicator}>
                  <div className={styles.indicatorDot}></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* モバイル向けのセレクトボックス（縦向きのみ） */}
      {screenSize === 'mobile' && orientation === 'portrait' && (
        <div className={styles.mobileSelector}>
          <label htmlFor="view-mode-select" className={styles.selectLabel}>
            表示モード選択
          </label>
          <select
            id="view-mode-select"
            value={currentMode}
            onChange={(e) => onModeChange(e.target.value as ViewMode)}
            className={styles.select}
          >
            {viewModes.map(({ mode, label, icon }) => (
              <option key={mode} value={mode}>
                {icon} {label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}