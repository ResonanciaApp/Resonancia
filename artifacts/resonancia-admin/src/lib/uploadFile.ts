/**
 * Shared file upload helper.
 * Requests a pre-signed PUT URL from the API, then streams the file via XHR
 * (so progress callbacks work). Returns the metadata needed to reference the
 * uploaded object in subsequent API calls.
 */

export interface UploadedFile {
  file: File;
  objectPath: string;
  contentType: string;
  sizeBytes: number;
  name: string;
}

type RequestUrlFn = (args: {
  data: { name: string; size: number; contentType: string };
}) => Promise<{ uploadURL: string; objectPath: string }>;

type SetProgressFn =
  | ((p: { label: string; pct: number } | null) => void)
  | null
  | undefined;

export async function uploadFile(
  file: File,
  requestUrlFn: RequestUrlFn,
  setProgress: SetProgressFn,
  progressLabel?: string,
): Promise<UploadedFile> {
  const { uploadURL, objectPath } = await requestUrlFn({
    data: { name: file.name, size: file.size, contentType: file.type },
  });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadURL);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && progressLabel && setProgress) {
        setProgress({
          label: progressLabel,
          pct: Math.round((e.loaded / e.total) * 100),
        });
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Error al subir archivo: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Error de red al subir archivo"));
    xhr.send(file);
  });

  return {
    file,
    objectPath,
    contentType: file.type,
    sizeBytes: file.size,
    name: file.name,
  };
}
