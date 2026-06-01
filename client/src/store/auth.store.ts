import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  color: string;
  role: "ADMIN" | "SALES";
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAdmin: () => get().user?.role === "ADMIN",
    }),
    { name: "merino-auth" }
  )
);
