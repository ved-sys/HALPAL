import React, { createContext, useContext, useState } from 'react';

export type AppMode = 'customer' | 'worker';

const AppModeContext = createContext<{
  mode: AppMode;
  setMode: (m: AppMode) => void;
}>({ mode: 'worker', setMode: () => {} });

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>('worker');
  return <AppModeContext.Provider value={{ mode, setMode }}>{children}</AppModeContext.Provider>;
}

export function useAppMode() {
  return useContext(AppModeContext);
}
