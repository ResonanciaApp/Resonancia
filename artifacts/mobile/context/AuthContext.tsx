import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const AUTH_KEY = "@resonancia_auth";

export type AuthMethod = "email" | "apple" | "google";

interface AuthState {
  isRegistered: boolean;
  email: string | null;
  displayName: string | null;
  birthYear: number | null;
  method: AuthMethod | null;
}

interface AuthContextValue extends AuthState {
  register: (data: Omit<AuthState, "isRegistered">) => Promise<void>;
  logout: () => Promise<void>;
}

const DEFAULT: AuthState = {
  isRegistered: false,
  email: null,
  displayName: null,
  birthYear: null,
  method: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((raw) => {
      if (!raw) return;
      try {
        setState({ ...DEFAULT, ...JSON.parse(raw) });
      } catch {}
    });
  }, []);

  const register = useCallback(async (data: Omit<AuthState, "isRegistered">) => {
    const next: AuthState = { isRegistered: true, ...data };
    setState(next);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(next));
  }, []);

  const logout = useCallback(async () => {
    setState(DEFAULT);
    await AsyncStorage.removeItem(AUTH_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
