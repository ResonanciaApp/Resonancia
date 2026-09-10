export type PlayerCloseDependencies = {
  stop: () => void | Promise<void>;
  canGoBack: () => boolean;
  back: () => void;
  replace: (path: string) => void;
};

export async function closePlayerForOrigin(
  playlistSlug: string | undefined,
  dependencies: PlayerCloseDependencies,
): Promise<void> {
  if (!playlistSlug) {
    dependencies.back();
    return;
  }

  await dependencies.stop();
  if (dependencies.canGoBack()) {
    dependencies.back();
  } else {
    dependencies.replace(`/editorial-playlist/${playlistSlug}`);
  }
}

export function stopPlaylistPlaybackOnUnmount(
  playlistSlug: string | undefined,
  closeAlreadyHandled: boolean,
  stop: () => void | Promise<void>,
): boolean {
  if (!playlistSlug || closeAlreadyHandled) return false;
  void stop();
  return true;
}