import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { disablePush } from "@/lib/push";
import { api, ApiError, User } from "@/lib/api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (id: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  loginWithToken: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        setUser(null);
        return;
      }
      const me = await api.get<User | { user: User }>("/auth/me");
      setUser('user' in me ? me.user : me);
    } catch (error) {
      setUser(null);
      if (error instanceof ApiError && error.status === 401) {
        await AsyncStorage.removeItem("auth_token");
      }
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (mb_id: string, mb_password: string) => {
    const res = await api.post<{ token: string; user: User }>("/auth/login", {
      mb_id,
      mb_password,
    });
    await AsyncStorage.setItem("auth_token", res.token);
    queryClient.clear();
    setUser(res.user);
  }, [queryClient]);

  const loginWithToken = useCallback(async (token: string, user: User) => {
    await AsyncStorage.setItem("auth_token", token);
    queryClient.clear();
    setUser(user);
  }, [queryClient]);

  const logout = useCallback(async () => {
    await disablePush();
    await api.post("/auth/logout").catch(() => {});
    await AsyncStorage.removeItem("auth_token");
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
