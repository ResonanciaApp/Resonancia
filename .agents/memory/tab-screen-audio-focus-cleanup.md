---
name: Tab-screen scoped audio needs focus cleanup
description: Screen-local expo-audio playback in a tab screen must stop on blur, not on unmount
---

Screen-scoped background audio (a player owned by a single tab screen, e.g. Geometrix
ambient) must be stopped with `useFocusEffect` cleanup, NOT only with a `useEffect`
unmount cleanup.

**Why:** Expo Router tab screens stay mounted when you switch tabs, so the unmount
cleanup never runs on a tab switch and the loop keeps playing in other tabs. With
`setAudioModeAsync({ shouldPlayInBackground: true })` the leak is even more audible.

**How to apply:** In the screen, add
`useFocusEffect(useCallback(() => () => { stopSound(); setActiveSound(null); }, [stopSound]))`
in addition to the unmount cleanup. Also reset the "active" UI state when the audio
source is missing, or the thumbnail shows active with no player.
