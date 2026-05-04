'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PartnerProfile } from '@/lib/localStore';

interface AppState {
  pendingStar: number;
  currentPartner: PartnerProfile | null;
  setPendingStar: (n: number) => void;
  setCurrentPartner: (p: PartnerProfile | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      pendingStar: 3,
      currentPartner: null,
      setPendingStar: (n) => set({ pendingStar: n }),
      setCurrentPartner: (p) => set({ currentPartner: p }),
    }),
    { name: 'musician-rpg-ui' }
  )
);
