import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/expo";
import React, { createContext, useCallback, useContext, useMemo } from "react";

export type AuthMethod = "email" | "apple" | "google";

interface AuthState {
  isRegistered: boolean;
  email: string | null;
  displayName: string | null;
  birthYear: number | null;
  method: AuthMethod | null;
}

interface AuthContextValue extends AuthState {
  authLoading: boolean;
  isSignedIn: boolean;
  register: (data: Omit<AuthState, "isRegistered">) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type OnboardingMeta = {
  onboarded?: boolean;
  displayName?: string;
  birthYear?: number;
  method?: AuthMethod;
  [key: string]: unknown;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: userLoaded, user } = useUser();
  const { isLoaded: authLoaded, isSignedIn } = useClerkAuth();
  const { signOut } = useClerk();

  const authLoading = !userLoaded || !authLoaded;

  const meta = (user?.unsafeMetadata ?? {}) as OnboardingMeta;
  const isRegistered = Boolean(isSignedIn && meta.onboarded);
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const displayName = meta.displayName ?? user?.firstName ?? null;
  const birthYear = meta.birthYear ?? null;
  const method = meta.method ?? "email";

  const register = useCallback(
    async (data: Omit<AuthState, "isRegistered">) => {
      if (!user) {
        throw new Error("Cannot register before sign-in. User is not signed in.");
      }
      const next: OnboardingMeta = {
        ...(user.unsafeMetadata as OnboardingMeta),
        onboarded: true,
        displayName: data.displayName ?? undefined,
        birthYear: data.birthYear ?? undefined,
        method: data.method ?? "email",
      };
      await user.update({ unsafeMetadata: next });
      await user.reload();
    },
    [user],
  );

  const logout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isRegistered,
      email,
      displayName,
      birthYear,
      method,
      authLoading,
      isSignedIn: Boolean(isSignedIn),
      register,
      logout,
    }),
    [isRegistered, email, displayName, birthYear, method, authLoading, isSignedIn, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
