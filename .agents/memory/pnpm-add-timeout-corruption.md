---
name: pnpm add timeout deja node_modules corrupto
description: Si pnpm add se interrumpe/timeout, puede dejar node_modules en estado inconsistente (binarios faltantes, lockfile desincronizado). Fix = pnpm install --no-frozen-lockfile.
---

# pnpm add interrumpido corrompe node_modules

## La regla
Si un `pnpm add` se interrumpe (timeout, SIGKILL, etc.), el estado resultante puede ser:
1. **Binarios faltantes**: el paquete principal (ej. `expo`) desaparece de `.bin` aunque no se estuviera instalando.
2. **Lockfile desincronizado**: entradas residuales en `pnpm-lock.yaml` que ya no coinciden con `package.json`, impidiendo `--frozen-lockfile`.
3. **Archivos tmp residuales**: Metro intenta watchear directorios tmp de pnpm que ya no existen (ej. `emoji-regex_tmp_NNNN`), causando crash `ENOENT`.

**Why:** pnpm modifica el lockfile y los symlinks en pasos no atómicos. Una interrupción a mitad deja el estado parcialmente escrito.

**How to apply:**
- Fix principal: `pnpm install --no-frozen-lockfile` en la raíz del workspace. Esto reconcilia lockfile y restaura todos los paquetes.
- Si Metro crashea con `ENOENT watch .../emoji-regex_tmp_NNNN`: crear el directorio faltante con `mkdir -p` antes de reiniciar Expo.
- Después del `pnpm install`, regenerar código si se borró: `pnpm --filter @workspace/api-spec run codegen`.
