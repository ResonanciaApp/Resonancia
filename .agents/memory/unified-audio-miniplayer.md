---
name: Miniplayer unificado
description: Regla visual compartida entre las reproducciones compactas de Dormir y las sesiones.
---

# Miniplayer unificado

Dormir y las sesiones deben presentar la misma barra compacta reutilizable. Cada flujo conserva
su propio estado de audio y destino al tocar la barra: las sesiones abren su reproductor completo
y Dormir abre su reproductor expandido con temporizador.

**Why:** La diferencia de destino no justifica dos diseños ni dos implementaciones visuales casi
idénticas; mantener una presentación común evita que vuelvan a divergir.

**How to apply:** Cualquier ajuste de layout, controles, iconos o animación de estas dos barras se
hace en la presentación compartida. Las reglas de visibilidad, minimización de sesión, expansión
de Dormir y el temporizador siguen en sus envoltorios o contextos especializados.