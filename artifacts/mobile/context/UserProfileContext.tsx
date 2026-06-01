import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "cdc_user_profile";

/** Nombre por defecto (placeholder) hasta que el usuario elige el suyo. */
export const DEFAULT_USERNAME = "ElSeñordelosCuencos";

interface UserProfile {
  username: string;
  lastName: string;
  location: string;
  description: string;
  photoUri: string | null;
  sentMessageIds: number[];
  earnedCrowns: number;
  lastCrownDate: string | null;
}

const DEFAULT_PROFILE: UserProfile = {
  username: DEFAULT_USERNAME,
  lastName: "",
  location: "",
  description: "",
  photoUri: null,
  sentMessageIds: [],
  earnedCrowns: 0,
  lastCrownDate: null,
};

interface ProfileUpdate {
  username?: string;
  lastName?: string;
  location?: string;
  description?: string;
}

interface UserProfileContextValue extends UserProfile {
  /** true una vez que se intentó cargar el perfil desde AsyncStorage. */
  profileLoaded: boolean;
  setUsername: (name: string) => void;
  setLastName: (v: string) => void;
  setLocation: (v: string) => void;
  setDescription: (v: string) => void;
  updateProfile: (fields: ProfileUpdate) => void;
  setPhotoUri: (uri: string | null) => void;
  recordSentMessage: (id: number) => void;
  checkAndAwardCrown: (topMessageId: number | null) => void;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const saved = JSON.parse(raw) as Partial<UserProfile>;
          setProfile((p) => ({ ...p, ...saved }));
        } catch {}
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((next: UserProfile) => {
    setProfile(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setUsername = useCallback(
    (name: string) => persist({ ...profile, username: name.trim() || DEFAULT_PROFILE.username }),
    [profile, persist],
  );

  const setLastName = useCallback(
    (v: string) => persist({ ...profile, lastName: v.trim() }),
    [profile, persist],
  );

  const setLocation = useCallback(
    (v: string) => persist({ ...profile, location: v.trim() }),
    [profile, persist],
  );

  const setDescription = useCallback(
    (v: string) => persist({ ...profile, description: v.trim() }),
    [profile, persist],
  );

  const updateProfile = useCallback(
    (fields: ProfileUpdate) => {
      persist({
        ...profile,
        ...(fields.username !== undefined ? { username: fields.username.trim() || DEFAULT_PROFILE.username } : {}),
        ...(fields.lastName !== undefined ? { lastName: fields.lastName.trim() } : {}),
        ...(fields.location !== undefined ? { location: fields.location.trim() } : {}),
        ...(fields.description !== undefined ? { description: fields.description.trim() } : {}),
      });
    },
    [profile, persist],
  );

  const setPhotoUri = useCallback(
    (uri: string | null) => persist({ ...profile, photoUri: uri }),
    [profile, persist],
  );

  const recordSentMessage = useCallback(
    (id: number) => {
      const updated = [...profile.sentMessageIds, id].slice(-50);
      persist({ ...profile, sentMessageIds: updated });
    },
    [profile, persist],
  );

  const checkAndAwardCrown = useCallback(
    (topMessageId: number | null) => {
      if (!topMessageId) return;
      const isOwner = profile.sentMessageIds.includes(topMessageId);
      if (!isOwner) return;
      const todayStr = new Date().toISOString().slice(0, 10);
      if (profile.lastCrownDate === todayStr) return;
      persist({
        ...profile,
        earnedCrowns: profile.earnedCrowns + 1,
        lastCrownDate: todayStr,
      });
    },
    [profile, persist],
  );

  return (
    <UserProfileContext.Provider
      value={{
        ...profile,
        profileLoaded: loaded,
        setUsername,
        setLastName,
        setLocation,
        setDescription,
        updateProfile,
        setPhotoUri,
        recordSentMessage,
        checkAndAwardCrown,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used inside UserProfileProvider");
  return ctx;
}
