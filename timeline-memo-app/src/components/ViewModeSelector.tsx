import type { ViewMode } from '../types';

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

/**
 * ビューモード切り替えコンポーネント
 * タイムライン、リスト、日記、カレンダーの各ビューモードを切り替える
 */
export function ViewModeSelector({ currentMode, onModeChange }: ViewModeSelectorProps) {
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

  return (
    <div className="view-mode-selector">
      {/* 現在のモード表示 */}
      <div className="current-mode-display mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          表示モード
        </h3>
        <div className="flex items-center mt-2">
          <span className="text-2xl mr-2">
            {viewModes.find(vm => vm.mode === currentMode)?.icon}
          </span>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {viewModes.find(vm => vm.mode === currentMode)?.label}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {viewModes.find(vm => vm.mode === currentMode)?.description}
            </div>
          </div>
        </div>
      </div>

      {/* ビューモード切り替えボタン */}
      <div className="mode-buttons">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {viewModes.map(({ mode, label, icon, description }) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${currentMode === mode
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              title={description}
              aria-pressed={currentMode === mode}
              aria-label={`${label}ビューに切り替え`}
            >
              {/* アイコン */}
              <div className="text-2xl mb-2">
                {icon}
              </div>
              
              {/* ラベル */}
              <div className="text-sm font-medium">
                {label}
              </div>
              
              {/* 選択中インジケーター */}
              {currentMode === mode && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* モバイル向けのコンパクト表示（オプション） */}
      <div className="mobile-selector sm:hidden mt-4">
        <label htmlFor="view-mode-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          表示モード選択
        </label>
        <select
          id="view-mode-select"
          value={currentMode}
          onChange={(e) => onModeChange(e.target.value as ViewMode)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {viewModes.map(({ mode, label, icon }) => (
            <option key={mode} value={mode}>
              {icon} {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}