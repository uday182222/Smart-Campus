import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/apiClient';
import { useAuth } from './AuthContext';

export interface Child {
  id: string;
  name: string;
  className: string;
  section?: string;
  studentId: string;
  rollNumber?: string;
  avatarUrl?: string;
}

interface ActiveChildContextType {
  children: Child[];
  activeChild: Child | null;
  setActiveChild: (child: Child) => void;
  loadChildren: () => Promise<void>;
}

const ActiveChildContext = createContext<ActiveChildContextType | undefined>(undefined);

export function ActiveChildProvider({ children }: { children: ReactNode }) {
  const { userData } = useAuth();
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [activeChild, setActiveChildState] = useState<Child | null>(null);
  const isParent = (userData?.role ?? '').toUpperCase() === 'PARENT';

  const loadChildren = useCallback(async () => {
    try {
      const res = await apiClient.get<{ success?: boolean; data?: { children: any[] } }>('/parent/children');
      const data = (res as any)?.data ?? res;
      const list = Array.isArray(data?.children) ? data.children : [];
      const mapped: Child[] = list.map((c: any) => ({
        id: c.id || c.studentId,
        name: c.name || c.studentName || 'Child',
        className: c.className || c.class?.name || c.grade || '—',
        section: c.section ?? '',
        studentId: c.id || c.studentId,
        rollNumber: c.rollNumber ?? '',
        avatarUrl: c.avatarUrl ?? c.avatar ?? undefined,
      }));
      setChildrenList(mapped);
      if (mapped.length > 0 && !activeChild) {
        const storedId = await AsyncStorage.getItem('activeChildId');
        const found = storedId ? mapped.find((ch) => ch.studentId === storedId) : null;
        const toSet = found || mapped[0];
        setActiveChildState(toSet);
        await AsyncStorage.setItem('activeChildId', toSet.studentId);
      }
    } catch (_e) {
      setChildrenList([]);
      setActiveChildState(null);
    }
  }, []);

  const setActiveChild = useCallback(async (child: Child) => {
    setActiveChildState(child);
    await AsyncStorage.setItem('activeChildId', child.studentId);
  }, []);

  useEffect(() => {
    if (isParent) loadChildren();
    else {
      setChildrenList([]);
      setActiveChildState(null);
    }
  }, [loadChildren, isParent]);

  useEffect(() => {
    AsyncStorage.getItem('activeChildId').then((storedId) => {
      if (storedId && childrenList.length > 0) {
        const found = childrenList.find((c) => c.studentId === storedId);
        if (found) setActiveChildState(found);
        else setActiveChildState(childrenList[0]);
      } else if (childrenList.length > 0 && !activeChild) {
        setActiveChildState(childrenList[0]);
      }
    });
  }, [childrenList]);

  const value: ActiveChildContextType = {
    children: childrenList,
    activeChild,
    setActiveChild,
    loadChildren,
  };

  return <ActiveChildContext.Provider value={value}>{children}</ActiveChildContext.Provider>;
}

export const useActiveChild = () => {
  const context = useContext(ActiveChildContext);
  if (!context) {
    throw new Error('useActiveChild must be used within ActiveChildProvider');
  }
  return context;
};
