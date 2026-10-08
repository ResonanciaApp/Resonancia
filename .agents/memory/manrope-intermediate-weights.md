---
name: Pesos intermedios de Manrope
description: Cómo respetar ajustes exactos de pesos intermedios en etiquetas móviles.
---

No representar pesos intermedios como 550 mediante un `fontWeight` arbitrario ni redondearlos a una centena cuando el usuario pidió un aumento o una reducción exactos.

**Why:** El conversor de fuentes de React Native iOS reconoce pesos discretos; un valor no reconocido puede volver silenciosamente al peso regular. La fuente Manrope original tiene un eje variable que permite generar el peso exacto.

**How to apply:** Instanciar el peso solicitado en una fuente estática con identidad propia, registrarla y usar esa familia solo en las etiquetas solicitadas. Comprobar el peso real del archivo y no alterar el parche global de Text ni las fuentes de iconos.
