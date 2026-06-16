import { create } from 'zustand';

import { supabase } from '@/src/lib/supabase';
import type { User, WorkSession } from '@/src/types/entities';

const WORK_KEY = 'acdrill-work-session';

const storage = {
  get: (key: string) => globalThis.localStorage?.getItem(key) ?? null,
  set: (key: string, value: string) =>
    globalThis.localStorage?.setItem(key, value),
  remove: (key: string) => globalThis.localStorage?.removeItem(key),
};

interface AuthState {
  user: User | null;
  hydrated: boolean;
  setUser: (user: User | null) => void;
  setHydrated: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: () => set({ hydrated: true }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));

interface WorkState {
  active: WorkSession | null;
  lastCompleted: WorkSession | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setActive: (session: WorkSession | null) => Promise<void>;
  finish: (session: WorkSession) => Promise<void>;
  clearSummary: () => void;
  clearPendingSync: () => void;
}

export const useWorkStore = create<WorkState>((set) => ({
  active: null,
  lastCompleted: null,
  hydrated: false,
  hydrate: async () => {
    if (typeof window === 'undefined') {
      set({ hydrated: true });
      return;
    }
    const raw = storage.get(WORK_KEY);
    set({
      active: raw ? (JSON.parse(raw) as WorkSession) : null,
      hydrated: true,
    });
  },
  setActive: async (active) => {
    if (typeof window !== 'undefined') {
      if (active) storage.set(WORK_KEY, JSON.stringify(active));
      else storage.remove(WORK_KEY);
    }
    set({ active });
  },
  finish: async (session) => {
    if (typeof window !== 'undefined') storage.remove(WORK_KEY);
    set({ active: null, lastCompleted: session });
  },
  clearSummary: () => set({ lastCompleted: null }),
  clearPendingSync: () =>
    set((state) => ({
      active: state.active ? { ...state.active, pendingSync: false } : null,
      lastCompleted: state.lastCompleted
        ? { ...state.lastCompleted, pendingSync: false }
        : null,
    })),
}));

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  clear: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ message });
    toastTimer = setTimeout(() => set({ message: null }), 2800);
  },
  clear: () => set({ message: null }),
}));
