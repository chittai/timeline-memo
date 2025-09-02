import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction } from '../types';
import { useAppReducer } from '../hooks/useAppReducer';

// Context の型定義
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// Context の作成
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider コンポーネントの Props
interface AppProviderProps {
  children: ReactNode;
}

// Context Provider コンポーネント
export function AppProvider({ children }: AppProviderProps) {
  const { state, dispatch } = useAppReducer();

  const contextValue: AppContextType = {
    state,
    dispatch
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Context を使用するためのカスタムフック
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext は AppProvider 内で使用する必要があります');
  }
  
  return context;
}