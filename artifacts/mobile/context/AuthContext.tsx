import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useGetMe,
  getGetMeQueryKey,
  type UserProfileRole,
} from "@workspace/api-client-react";

/**
 * Auth model — two layers:
 *
 * 1. LOCAL onboarding (AsyncStorage). Guests can use the whole app without
 *    creating a Clerk account. `isRegistered` is true once they complete
 *    the local onboarding (name, birth year, etc.).
 *
 * 2. CLERK account (optional). Activated only when the user opts into
 *    social features (friends, groups). Exposes `isSignedIn` separately.
 *
 * The two are independent: a user can be registered locally without being
 * signed into Clerk, or signed into Clerk before completing local onboarding.
 */

const AUTH_KEY = "@resonancia_auth";

export type AuthMethod = "email" | "apple" | "google" | "guest";

interface AuthState {
  isRegistered: boolean;
  email: string | null;
  displayName: string | null;
  birthYear: number | null;
  method: AuthMethod | null;
}

interface AuthContextValue extends AuthState {
  authLoading: boolean;
  /** True only when the user has a Clerk session (for social features). */
  isSignedIn: boolean;
  /** Rol del usuario en el server (user | creator | admin). Solo con cuenta Clerk. */
  role: UserProfileRole | null;
  isCreator: boolean;
  isAdmin: boolean;
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
  const [localState, setLocalState] = useState<AuthState>(DEFAULT);
  const [localLoading, setLocalLoading] = useState(true);

  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  // Rol del server (solo significativo con cuenta Clerk activa).
  const meQ = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: Boolean(clerkSignedIn),
      staleTime: 60_000,
    },
  });
  const role = clerkSignedIn ? meQ.data?.role ?? null : null;

  // Load local registration on mount
  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setLocalState({ ...DEFAULT, ...JSON.parse(raw) });
          } catch {}
        }
      })
      .finally(() => setLocalLoading(false));
  }, []);

  const register = useCallback(
    async (data: Omit<AuthState, "isRegistered">) => {
      const next: AuthState = { isRegistered: true, ...data };
      setLocalState(next);
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(next));
    },
    [],
  );

  const logout = useCallback(async () => {
    setLocalState(DEFAULT);
    await AsyncStorage.removeItem(AUTH_KEY);
    if (clerkSignedIn) {
      try {
        await signOut();
      } catch {}
    }
  }, [signOut, clerkSignedIn]);

  // Merge Clerk user data when signed in — prefer Clerk values for email
  // and displayName so the linked account stays in sync.
  const value = useMemo<AuthContextValue>(() => {
    const isSignedIn = Boolean(clerkSignedIn);
    const email = isSignedIn
      ? clerkUser?.primaryEmailAddress?.emailAddress ?? localState.email
      : localState.email;
    const displayName =
      localState.displayName ?? clerkUser?.firstName ?? null;

    return {
      isRegistered: localState.isRegistered,
      email,
      displayName,
      birthYear: localState.birthYear,
      method: localState.method,
      authLoading: localLoading || !clerkLoaded,
      isSignedIn,
      role,
      isCreator: role === "creator" || role === "admin",
      isAdmin: role === "admin",
      register,
      logout,
    };
  }, [
    localState,
    localLoading,
    clerkLoaded,
    clerkSignedIn,
    clerkUser,
    role,
    register,
    logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
