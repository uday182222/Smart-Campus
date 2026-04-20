import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type DrawerNavigationProp = {
  navigate: (name: string, params?: object) => void;
  goBack: () => void;
  dispatch: (action: any) => void;
  getState: () => any;
} | null;

interface DrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  drawerNavigation: DrawerNavigationProp;
  setDrawerNavigation: (n: DrawerNavigationProp) => void;
}

const DrawerContext = createContext<DrawerContextType>({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
  drawerNavigation: null,
  setDrawerNavigation: () => {},
});

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [drawerNavigation, setDrawerNavigationState] = useState<DrawerNavigationProp>(null);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const toggleDrawer = useCallback(() => setIsOpen((prev) => !prev), []);
  const setDrawerNavigation = useCallback((n: DrawerNavigationProp) => setDrawerNavigationState(n), []);

  return (
    <DrawerContext.Provider
      value={{
        isOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        drawerNavigation,
        setDrawerNavigation,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

export const useDrawer = () => useContext(DrawerContext);
