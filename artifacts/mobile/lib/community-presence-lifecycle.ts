// Logout must retire the foreground lease before Clerk removes its token.
let retire: (() => Promise<void>) | null = null;
export function registerCommunityPresenceRetirer(next: () => Promise<void>) {
  retire = next;
  return () => { if (retire === next) retire = null; };
}
export async function retireCommunityPresence() {
  await retire?.();
}