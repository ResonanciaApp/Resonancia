---
name: Progreso espejo entre Perfil y Tu progreso
description: Regla de producto para mantener idénticas las tres secciones de progreso en ambas pantallas.
---

La racha semanal de siete días, la sección de estadísticas personales y el calendario son un único bloque visual y funcional compartido entre Perfil y la pantalla Tu progreso. No crear variantes locales ni ajustar una pantalla por separado.

**Why:** El usuario confirmó explícitamente que estas secciones son espejo siempre; las implementaciones duplicadas ya habían provocado diferencias de estilo y espaciado.

**How to apply:** Cualquier cambio de diseño, datos, bordes, espaciado o comportamiento de estas tres secciones debe hacerse en el componente compartido y comprobarse en ambos contenedores.