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

## Global mixer exception: pause, never stop, on blur

The mixer is shared app state rather than screen-local audio. When the mixer screen loses
focus, it must call an explicit idempotent pause operation, not its toggle and not its
destructive stop path.

**Why:** a tab-focus cleanup can run more than once during navigation. A toggle can
accidentally resume playback; stopping would discard the user's selected sounds, volumes,
preset, and miniplayer state.

**How to apply:** keep the focus effect independent from panel open/close state (whose
changes also rerun effect cleanups). The pause operation only changes playback state and
keeps players and mix metadata intact, so playback resumes solely after an explicit Play.
