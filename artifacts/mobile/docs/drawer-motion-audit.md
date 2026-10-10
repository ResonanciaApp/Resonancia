# Auditoría del drawer de Inicio

## Hallazgos comprobables

- El seguimiento del dedo ya escribía directamente un progreso Reanimated en
  UI. No había un setState por frame. Inicio usa contextos estables; sus
  proveedores de herramientas y navegación ya estaban aislados del estado
  abierto/cerrado.
- La finalización del gesto sí cruzaba UI → runOnJS → open/close → timing.
  Por ello el comienzo del asentamiento dependía de la disponibilidad de JS.
  Ahora el worklet inicia timing directamente y notifica a JS sin esperarlo.
- La apertura/cierre programáticos ahora leen el progreso y cancelan/inician
  timing en una misma operación UI. Un gesto nuevo invalida comandos y
  finalizaciones antiguos mediante su versión.
- Las rutas antes se cambiaban ANTES del cierre. Ahora navegan después de
  completarlo. Los overlays conservan el contrato de preparar su layout antes
  de cerrar; no se desmonta Inicio para animar el drawer.
- Hay un único progreso para translateX, radios, velo blanco del 5 %, sombra,
  avatar y aparición del menú. No se cambió su geometría, duración ni diseño.
- El gesto cancela timing al comenzar y no monta la capa táctil de bloqueo
  hasta soltar. Las actualizaciones del dedo no programan callbacks JS.

## Coste gráfico: no determinado

TranslateX y opacidad son operaciones de composición; radios con recorte,
sombra/elevation y el contenido bajo ellos pueden exigir trabajo gráfico
adicional incluso si se ejecutan desde UI. El código por sí solo no permite
atribuirles los tirones. No se eliminaron efectos ni se habilitó rasterización.

Las pruebas anteriores de radio, brillo y desenfoque no produjeron mejora
según el usuario. No equivalen a un perfil de GPU. No se dispone aquí de una
captura de rendimiento del teléfono autenticado ni de una build release
ejecutándose en ese dispositivo. No se afirma una causa raíz completa ni una
mejora de FPS.

## Verificación

61 pruebas automatizadas pasan, incluyendo ejecución del proveedor y gestos
reales con mocks deterministas de React/Reanimated:

- apertura, arrastre en ambas direcciones y cierre;
- UI sigue el dedo y termina apertura/cierre con la cola JS detenida;
- ninguna llamada JS adicional durante los frames del arrastre;
- interrupciones, atrás, cancelación de selección y reapertura;
- navegación solo tras finalización y destinos overlay con readiness;
- identidad estable de contextos de navegación y herramientas;
- conservación de geometría y pausa del video hero.

Estas pruebas validan comportamiento y coordinación, no renderizado nativo.
La revisión global de tipos sigue con 59 errores previos; ninguno en los
archivos modificados del drawer.

Para determinar un efecto costoso hace falta una comparación nativa aislada:
misma build, tema, contenido y gesto; medir frame time UI/JS y commits de
Inicio primero con todos los efectos y luego alternando uno solo por captura
(sombra, recorte, velo). Restaurar cada efecto antes de la siguiente captura.
No atribuir a un efecto una diferencia basada solo en mocks o preview web.
