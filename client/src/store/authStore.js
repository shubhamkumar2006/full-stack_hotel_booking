import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken }) =>
        set({ user, accessToken, isAuthenticated: true }),

      setAccessToken: (token) =>
        set({ accessToken: token }),

      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),

      isGuest:  () => get().user?.role === 'GUEST',
      isHost:   () => get().user?.role === 'HOST',
      isAdmin:  () => get().user?.role === 'ADMIN',
      canHost:  () => ['HOST', 'ADMIN'].includes(get().user?.role),
    }),
    {
      name: 'staynest-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
