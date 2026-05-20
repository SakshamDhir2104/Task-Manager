import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken } from "../api";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    const { user: u } = await api<{ user: User }>("/api/auth/me");
    setUser(u);
  }, []);

  useEffect(() => {
    refreshUser()
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await api<{ user: User; token: string }>("/api/auth/login", {
      method: "POST",
      json: { email, password },
    });
    setToken(token);
    setUser(u);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const { user: u, token } = await api<{ user: User; token: string }>("/api/auth/signup", {
      method: "POST",
      json: { name, email, password },
    });
    setToken(token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshUser }),
    [user, loading, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
