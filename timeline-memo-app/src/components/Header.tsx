import React, { useState, useEffect } from 'react';


/**
 * ヘッダーコンポーネント
 * アプリケーションのタイトルと投稿フォームを含む
 * レスポンシブデザインとタッチデバイス対応
 * 要件4.1, 6.1, 6.2, 6.3に対応
 */
const Header: React.FC = () => {
  const [showPostForm, setShowPostForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // 画面サイズとデバイス情報の検出
  useEffect(() => {
    const updateDeviceInfo = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
    };
  }, []);

  const handleToggleForm = () => {
    setShowPostForm(prev => !prev);
  };



  // ヘッダーのクラス名を動的に生成
  const getHeaderClasses = () => {
    const baseClasses = "bg-white shadow-sm border-b border-gray-200";
    const stickyClasses = isMobile ? "sticky top-0 z-10" : "";
    return `${baseClasses} ${stickyClasses}`.trim();
  };

  // コンテナのクラス名を動的に生成
  const getContainerClasses = () => {
    const baseClasses = "container mx-auto max-w-7xl";
    return isMobile 
      ? `${baseClasses} px-2 py-3`
      : `${baseClasses} px-4 py-4`;
  };

  // ボタンのクラス名を動的に生成
  const getButtonClasses = () => {
    const baseClasses = "font-medium rounded-md transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
    const sizeClasses = isMobile ? "px-4 py-2 text-sm" : "px-6 py-2 text-sm";
    const touchClasses = isTouchDevice ? "touch-manipulation" : "";
    const colorClasses = showPostForm
      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
      : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800';
    
    return `${baseClasses} ${sizeClasses} ${touchClasses} ${colorClasses}`.trim();
  };

  return (
    <header className={getHeaderClasses()}>
      <div className={getContainerClasses()}>
        <div className="flex flex-col gap-3 md:gap-4">
          {/* タイトルと投稿ボタン */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* アプリタイトル */}
            <div className="flex-shrink-0">
              <h1 className={`font-bold text-gray-900 ${
                isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'
              }`}>
                Timeline Memo
              </h1>
              {!isMobile && (
                <p className="text-sm text-gray-600 mt-1">
                  気軽にメモや感情を記録できるタイムラインアプリ
                </p>
              )}
            </div>
            
            {/* 投稿ボタン */}
            <div className="flex-shrink-0">
              <button
                onClick={handleToggleForm}
                className={getButtonClasses()}
                aria-label={showPostForm ? '投稿フォームを閉じる' : '新規投稿フォームを開く'}
              >
                {showPostForm ? (
                  <>
                    {isMobile ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        閉じる
                      </span>
                    ) : (
                      '投稿を閉じる'
                    )}
                  </>
                ) : (
                  <>
                    {isMobile ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        投稿
                      </span>
                    ) : (
                      '新規投稿'
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 投稿フォーム */}
          {showPostForm && (
            <div className={isMobile ? "mt-2" : "mt-4"}>
              {/* PostForm - 一時的に無効化 */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">投稿機能は新しいアプリで利用可能です</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;