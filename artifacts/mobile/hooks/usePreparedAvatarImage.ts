import { Image, type ImageRef } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";

type AvatarSource = Parameters<typeof Image.loadAsync>[0];

/** Decode the selected avatar before mounting its native cover Modal. */
export function usePreparedAvatarImage(source: AvatarSource | null, enabled: boolean) {
  // Catalog refreshes recreate source objects even when the avatar is unchanged.
  const sourceKey = source && typeof source === "object" ? JSON.stringify(source) : source;
  const currentSource = useRef(source);
  currentSource.current = source;
  const currentKey = useRef(sourceKey);
  currentKey.current = sourceKey;
  const mounted = useRef(true);
  const request = useRef<{ key: typeof sourceKey; promise: Promise<ImageRef> } | null>(null);
  const [prepared, setPrepared] = useState<{ key: typeof sourceKey; image: ImageRef } | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const prepare = useCallback((): Promise<ImageRef | null> => {
    const source = currentSource.current;
    if (!source) return Promise.resolve(null);
    if (request.current?.key !== sourceKey) {
      const promise = Image.loadAsync(source).then(image => {
        if (mounted.current && currentKey.current === sourceKey) {
          setPrepared({ key: sourceKey, image });
        }
        return image;
      });
      request.current = { key: sourceKey, promise };
      // A failed preload is retried on the next explicit opening.
      void promise.catch(() => {
        if (request.current?.promise === promise) request.current = null;
      });
    }
    return request.current.promise;
  }, [sourceKey]);

  useEffect(() => {
    if (!enabled || !sourceKey) return;
    void prepare().catch(error => {
      console.warn("[avatar-cover] No se pudo preparar la imagen:", error);
    });
  }, [enabled, sourceKey, prepare]);

  return {
    image: prepared?.key === sourceKey ? prepared.image : null,
    prepare,
  };
}
