import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,

        setUser: (user) =>
          set({ user, isAuthenticated: !!user }),

        setToken: (token) => {
          set({ token });
          if (token) {
            localStorage.setItem("token", token);
          } else {
            localStorage.removeItem("token");
          }
        },

        logout: () => {
          localStorage.removeItem("token");
          set({ user: null, token: null, isAuthenticated: false });
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      }
    ),
    { name: "auth-store" }
  )
);
