import React, { useState, useEffect } from 'react';


/**
 * ヘッダーコンポーネント
 * アプリケーションのタイトルを表示
 * レスポンシブデザインとタッチデバイス対応
 * 要件4.1, 6.1, 6.2, 6.3に対応
 */
const Header: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  // 画面サイズの検出
  useEffect(() => {
    const updateDeviceInfo = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
    };
  }, []);



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



  return (
    <header className={getHeaderClasses()}>
      <div className={getContainerClasses()}>
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
      </div>
    </header>
  );
};

export default Header;