---
name: Pesos intermedios de Manrope
description: Cómo respetar aumentos exactos de 50 en el peso tipográfico de etiquetas móviles.
---

No representar pesos intermedios como 550 mediante un `fontWeight` arbitrario ni redondearlos a la centena siguiente cuando el usuario pidió un incremento exacto.

**Why:** El conversor de fuentes de React Native iOS reconoce pesos discretos; un valor no reconocido puede volver silenciosamente al peso regular. La fuente Manrope original tiene un eje variable que permite generar el peso exacto.

**How to apply:** Instanciar el peso solicitado en una fuente estática con identidad propia, registrarla y usar esa familia solo en las etiquetas solicitadas. Comprobar el peso real del archivo y no alterar el parche global de Text ni las fuentes de iconos.
