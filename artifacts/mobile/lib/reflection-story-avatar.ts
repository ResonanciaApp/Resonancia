import { Asset } from "expo-asset";
import { uploadLocalFile } from "@/lib/upload";
import type { ProfileAvatarSource } from "@/lib/profile-avatar";
import { reflectionAvatarObjectPath } from "@/lib/reflection-story-logic";

/** Preserve the exact image, not a preset ID that may be edited later. */
export async function prepareReflectionAvatar(source: ProfileAvatarSource): Promise<string> {
  const uri = typeof source === "number" ? Asset.fromModule(source).uri : source.uri;
  const objectPath = reflectionAvatarObjectPath(uri, process.env.EXPO_PUBLIC_API_URL ?? "");
  if (objectPath) return objectPath;
  const asset = typeof source === "number" ? Asset.fromModule(source) : Asset.fromURI(uri);
  if (!asset.localUri) await asset.downloadAsync();
  const localUri = asset.localUri ?? uri;
  const extension = asset.type || uri.split(/[?#]/)[0].match(/\.(webp|png|jpe?g)$/i)?.[1]?.toLowerCase();
  const contentType = extension === "webp" ? "image/webp" : extension === "png" ? "image/png" : "image/jpeg";
  return uploadLocalFile(localUri, contentType, `reflection-avatar.${extension ?? "jpg"}`, 1);
}
