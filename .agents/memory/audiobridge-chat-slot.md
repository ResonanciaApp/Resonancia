---
name: audiobridge-chat-slot
description: Integración del audio del chat con el audioBridge (exclusión mutua con sesión/mezcla/descanso)
---

# AudioBridge — slot de chat

## Regla
El audioBridge tiene 4 slots: session / mix / sound / **chat**. Cada uno registra un stopper y llama a los otros antes de empezar a reproducir.

**Why:** Antes de esta tarea, los mensajes de voz del chat sonaban encima de la sesión/mezclador sin cortar nada. El microphone de grabación tampoco pedía la sesión de audio exclusiva.

## Apertura del Mezclador = cambio de contexto

Abrir el drawer del Mezclador también debe pedir exclusividad de sesión, aunque el
usuario todavía no haya activado un sonido de la mezcla. La barra de la sesión debe
cerrarse y no debe mostrarse ninguna barra persistente dentro o sobre el drawer.

**Why:** el drawer queda montado sobre las tabs; sin esa transición, una sesión conserva
su estado visual y puede aparecer como un miniplayer morado duplicado dentro del
Mezclador.

**How to apply:** tratar la apertura del Mezclador como el límite entre sesión y mezcla:
detener la sesión mediante el coordinador y suprimir las barras globales mientras el
drawer está abierto. Una barra de mezcla solo puede reaparecer fuera del drawer cuando
existe una mezcla realmente activa.

## Archivos tocados
- `artifacts/mobile/context/audioBridge.ts` — añadido `chatStopper`, `registerChatStopper()`, `stopChatPlayback()`
- `artifacts/mobile/app/chat/[userId].tsx` — AudioAttachment.toggle llama `stopSessionPlayback/stopMixPlayback/stopSoundPlayback/stopChatPlayback` antes de play, luego registra el stopper; startRecording idem antes de grabar
- `artifacts/mobile/context/PlayerContext.tsx` — dos call sites de inicio de sesión llaman `stopChatPlayback()`
- `artifacts/mobile/context/MixerContext.tsx` — tres call sites de inicio de mezcla llaman `stopChatPlayback()`
- `artifacts/mobile/hooks/useDescansoPlayer.ts` — llama `stopChatPlayback()` junto a los otros stops

## Patrón de AudioAttachment
- Al iniciar playback: `registerChatStopper(fn)` donde fn pausa el player y llama `registerChatStopper(null)`
- Al pausar (usuario): `registerChatStopper(null)`
- Al terminar el audio (`didJustFinish`): `registerChatStopper(null)`
- En el cleanup de unmount: `registerChatStopper(null)` (evita stopper huérfano apuntando a un player desmontado)
