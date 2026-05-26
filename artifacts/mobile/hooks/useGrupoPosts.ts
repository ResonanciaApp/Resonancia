import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const keyFor = (grupoId: string) => `resonancia:grupo_posts:${grupoId}`;

export interface GrupoComment {
  id: string;
  author: string;
  initials: string;
  color: string;
  text: string;
  createdAt: number;
}

export interface GrupoPost {
  id: string;
  author: string;
  initials: string;
  color: string;
  text: string;
  createdAt: number;
  likes: number;
  replies: number;
  comments?: GrupoComment[];
}

export function useGrupoPosts(grupoId: string | undefined) {
  const [posts, setPosts] = useState<GrupoPost[]>([]);

  const reload = useCallback(async () => {
    if (!grupoId) return;
    try {
      const raw = await AsyncStorage.getItem(keyFor(grupoId));
      setPosts(raw ? (JSON.parse(raw) as GrupoPost[]) : []);
    } catch {}
  }, [grupoId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addPost = useCallback(
    async (post: Omit<GrupoPost, "id" | "createdAt" | "likes" | "replies">) => {
      if (!grupoId) return;
      const next: GrupoPost = {
        ...post,
        id: `p-${Date.now()}`,
        createdAt: Date.now(),
        likes: 0,
        replies: 0,
      };
      setPosts((prev) => {
        const arr = [next, ...prev];
        AsyncStorage.setItem(keyFor(grupoId), JSON.stringify(arr)).catch(() => {});
        return arr;
      });
    },
    [grupoId],
  );

  const addComment = useCallback(
    async (
      postId: string,
      comment: Omit<GrupoComment, "id" | "createdAt">,
    ) => {
      if (!grupoId) return;
      const newComment: GrupoComment = {
        ...comment,
        id: `c-${Date.now()}`,
        createdAt: Date.now(),
      };
      setPosts((prev) => {
        const arr = prev.map((p) =>
          p.id === postId
            ? { ...p, comments: [...(p.comments ?? []), newComment], replies: (p.replies ?? 0) + 1 }
            : p,
        );
        AsyncStorage.setItem(keyFor(grupoId), JSON.stringify(arr)).catch(() => {});
        return arr;
      });
    },
    [grupoId],
  );

  const ensureWelcomePost = useCallback(
    async (data: Omit<GrupoPost, "id" | "createdAt" | "likes" | "replies">) => {
      if (!grupoId) return;
      setPosts((prev) => {
        if (prev.some((p) => p.id === "welcome")) return prev;
        const welcome: GrupoPost = {
          ...data,
          id: "welcome",
          createdAt: Date.now(),
          likes: 0,
          replies: 0,
        };
        const arr = [...prev, welcome];
        AsyncStorage.setItem(keyFor(grupoId), JSON.stringify(arr)).catch(() => {});
        return arr;
      });
    },
    [grupoId],
  );

  const togglePostLike = useCallback(
    async (postId: string, liked: boolean) => {
      if (!grupoId) return;
      setPosts((prev) => {
        const arr = prev.map((p) =>
          p.id === postId
            ? { ...p, likes: Math.max(0, (p.likes ?? 0) + (liked ? 1 : -1)) }
            : p,
        );
        AsyncStorage.setItem(keyFor(grupoId), JSON.stringify(arr)).catch(() => {});
        return arr;
      });
    },
    [grupoId],
  );

  const deletePost = useCallback(
    async (postId: string) => {
      if (!grupoId) return;
      setPosts((prev) => {
        const arr = prev.filter((p) => p.id !== postId);
        AsyncStorage.setItem(keyFor(grupoId), JSON.stringify(arr)).catch(() => {});
        return arr;
      });
    },
    [grupoId],
  );

  const clearAll = useCallback(async () => {
    if (!grupoId) return;
    setPosts([]);
    AsyncStorage.removeItem(keyFor(grupoId)).catch(() => {});
  }, [grupoId]);

  return { posts, addPost, addComment, ensureWelcomePost, togglePostLike, deletePost, clearAll, reload };
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  const date = new Date(ts);
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
