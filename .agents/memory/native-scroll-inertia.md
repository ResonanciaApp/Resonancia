---
name: Inercia global del scroll
description: Alcance del ajuste y compatibilidad entre React 19 y el ScrollView nativo.
---

El ajuste global reduce solo el desplazamiento que continúa después de soltar el dedo. Mientras se arrastra, conservar la relación normal entre dedo y contenido. Los controles con desaceleración propia conservan su valor explícito.

**Why:** El usuario eligió menos inercia al soltar, no alterar el gesto de arrastre. Los selectores y carruseles pueden depender de una desaceleración específica para alinearse.

**How to apply:** Ajustar el valor predeterminado compartido del scroll nativo, sin cambiar eventos, desplazamientos programáticos ni animaciones. La vista web sigue controlada por el navegador; no presentar un ajuste de física nativa como si cambiara el navegador.

En React 19 no confiar en defaultProps de un wrapper funcional para el runtime JSX. React Native 0.81 mantiene una clase interna de ScrollView detrás de su wrapper público; los defaults de esa clase sí se aplican a las listas y variantes animadas que la utilizan.

**Why:** Cambiar defaults solo en el wrapper público puede parecer correcto en el código y no modificar el scroll real.

**How to apply:** Al actualizar React Native, verificar la forma del componente y las pruebas del runtime JSX. No silenciar una incompatibilidad ni sustituir la interacción nativa por gestos personalizados para resolverla.