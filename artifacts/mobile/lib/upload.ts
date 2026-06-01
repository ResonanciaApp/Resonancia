/**
 * uploadLocalFile — sube un archivo local (uri) a Object Storage vía presigned
 * URL y devuelve el `objectPath` (ej. `/objects/uploads/uuid`) que el server
 * guarda en la DB. Compartido por el chat (imágenes/audio) y la sincronización
 * de avatar del perfil.
 */
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import { requestUploadUrl } from "@workspace/api-client-react";

export async function uploadLocalFile(
  uri: string,
  contentType: string,
  fileName: string,
  hintSize: number,
): Promise<string> {
  let realSize = hintSize || 1;
  if (Platform.OS !== "web") {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && typeof (info as { size?: number }).size === "number") {
        realSize = (info as { size: number }).size;
      }
    } catch {
      // ignore, fall back to hintSize
    }
  }
  const { uploadURL, objectPath } = await requestUploadUrl({
    name: fileName,
    size: realSize,
    contentType,
  });

  if (Platform.OS === "web") {
    const fileResp = await fetch(uri);
    const blob = await fileResp.blob();
    const putResp = await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!putResp.ok) {
      const text = await putResp.text().catch(() => "");
      throw new Error(`Upload falló (${putResp.status}): ${text.slice(0, 120)}`);
    }
    return objectPath;
  }

  const result = await FileSystem.uploadAsync(uploadURL, uri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": contentType },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload falló (${result.status}): ${result.body?.slice(0, 120) ?? ""}`);
  }
  return objectPath;
}
