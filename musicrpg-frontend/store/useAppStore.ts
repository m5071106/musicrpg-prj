'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PartnerProfile } from '@/lib/localStore';

interface AppState {
  pendingStar: number;
  currentPartner: PartnerProfile | null;
  updatedPartners: string[];  // 曲リストが更新されたパートナーのユーザー名
  setPendingStar: (n: number) => void;
  setCurrentPartner: (p: PartnerProfile | null) => void;
  setUpdatedPartners: (usernames: string[]) => void;
  addUpdatedPartners: (usernames: string[]) => void;
  clearPartnerUpdate: (username: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      pendingStar: 3,
      currentPartner: null,
      updatedPartners: [],
      setPendingStar: (n) => set({ pendingStar: n }),
      setCurrentPartner: (p) => set({ currentPartner: p }),
      setUpdatedPartners: (usernames) => set({ updatedPartners: usernames }),
      addUpdatedPartners: (usernames) =>
        set((state) => ({
          updatedPartners: [
            ...new Set([...state.updatedPartners, ...usernames]),
          ],
        })),
      clearPartnerUpdate: (username) =>
        set((state) => ({
          updatedPartners: state.updatedPartners.filter((u) => u !== username),
        })),
    }),
    { name: 'musician-rpg-ui' }
  )
);
