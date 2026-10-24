import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface AuthUser {
  mb_id: string;
  mb_name: string;
  mb_email: string;
  mb_hp: string;
  mb_level: number;
  company_name: string;
  business_number: string;
  is_admin: boolean;
  is_approved: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (mb_id: string, mb_password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "seoulmono_token";
const USER_KEY = "seoulmono_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setUser(null);
      localStorage.removeItem(USER_KEY);
      return;
    }
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: AuthUser) => {
        setUser(data);
        localStorage.setItem(USER_KEY, JSON.stringify(data));
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      });
  }, [token]);

    const notifyApp = useCallback((type: "login" | "logout", user?: AuthUser, token?: string) => {
    const rn = (window as any).ReactNativeWebView;
    if (!rn) return;
    if (type === "login" && user && token) {
      rn.postMessage(JSON.stringify({
        type: "login",
        userName: user.mb_name,
        userEmail: user.mb_email,
        token,
      }));
    } else if (type === "logout") {
      rn.postMessage(JSON.stringify({ type: "logout" }));
    }
  }, []);

  const login = useCallback(async (mb_id: string, mb_password: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mb_id, mb_password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "로그인에 실패했습니다");
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      notifyApp("login", data.user, data.token);
    } finally {
      setLoading(false);
    }
  }, [notifyApp]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    notifyApp("logout");
  }, [notifyApp]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
