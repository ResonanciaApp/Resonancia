import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const keyFor = (grupoId: string) => `resonancia:grupo_posts:${grupoId}`;

export interface GrupoPost {
  id: string;
  author: string;
  initials: string;
  color: string;
  text: string;
  createdAt: number;
  likes: number;
  replies: number;
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

  return { posts, addPost, deletePost, clearAll, reload };
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
