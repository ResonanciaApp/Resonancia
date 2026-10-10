---
name: Orden de declaración de worklets
description: La transformación Babel puede hacer que una dependencia posterior falle al inicializar el módulo, aunque Node/TypeScript funcione.
---

Declarar las dependencias de un worklet antes del worklet que las captura, incluso si ambas parecen declaraciones de función hoisted en TypeScript.

**Why:** Babel convirtió las declaraciones en fábricas que capturan la clausura al inicializar el módulo. Referenciar una función posterior produjo un error de zona temporal muerta en la app, mientras las pruebas con transpileModule de TypeScript pasaban.

**How to apply:** Mantener orden topológico de helpers y complementar los tests de lógica con una inicialización del módulo transformado mediante el preset Expo y el plugin de worklets. Un HTTP 200 del bundle prueba compilación, no ejecución correcta del módulo.
