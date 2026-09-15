export type PlayerCloseDependencies = {
  stop: () => void | Promise<void>;
  canGoBack: () => boolean;
  back: () => void;
  replace: (path: string) => void;
};

export async function closePlayerForOrigin(
  playlistSlug: string | undefined,
  dependencies: PlayerCloseDependencies,
  privatePlaylistId?: string,
): Promise<void> {
  if (!playlistSlug && !privatePlaylistId) {
    dependencies.back();
    return;
  }

  await dependencies.stop();
  if (dependencies.canGoBack()) {
    dependencies.back();
  } else if (privatePlaylistId) {
    dependencies.replace(`/playlist/${privatePlaylistId}`);
  } else {
    dependencies.replace(`/editorial-playlist/${playlistSlug}`);
  }
}

export function stopPlaylistPlaybackOnUnmount(
  playlistSlug: string | undefined,
  closeAlreadyHandled: boolean,
  stop: () => void | Promise<void>,
  privatePlaylistId?: string,
): boolean {
  if ((!playlistSlug && !privatePlaylistId) || closeAlreadyHandled) return false;
  void stop();
  return true;
}