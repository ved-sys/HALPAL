import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/state/AuthContext';

export type AppMode = 'customer' | 'worker';

const AppModeContext = createContext<{
  mode: AppMode;
  setMode: (m: AppMode) => void;
}>({ mode: 'customer', setMode: () => {} });

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>('customer');
  const { user } = useAuth();
  const userId = user?.id ?? null;
  // The toggle is per person, so a new sign-in (or a sign-out) starts
  // over in customer mode rather than inheriting the last user's choice.
  useEffect(() => {
    setMode('customer');
  }, [userId]);
  return <AppModeContext.Provider value={{ mode, setMode }}>{children}</AppModeContext.Provider>;
}

export function useAppMode() {
  return useContext(AppModeContext);
}
