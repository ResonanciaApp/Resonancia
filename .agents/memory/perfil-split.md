---
name: Perfil split
description: Perfil de tabs vs pantalla dedicada /mi-perfil comparten ProfileScreenBase
---
El antiguo app/(tabs)/profile.tsx (2000 líneas) se movió a components/ProfileScreenBase.tsx con prop `dedicated`.
- Tabs (`/(tabs)/profile`): solo pills Biblioteca + Historial (default biblioteca); sin Muro ni Mi Espacio.
- `/mi-perfil` (dedicated): header con volver + "Mi Perfil" + lápiz, sin pills; renderiza el contenido del ex-Muro (profile card, racha, reflexiones).
**Why:** pedido del usuario (jul 2026) de separar el perfil personal de la biblioteca/historial.
**How to apply:** cambios de perfil van en ProfileScreenBase gateados por `dedicated`; hay estado/handlers muertos residuales del split (deuda, no crashea).
