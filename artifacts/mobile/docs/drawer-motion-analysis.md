# Inicio / drawer: diagnóstico y continuidad del gesto

## Alcance y limitaciones

Se ejecutaron los callbacks del proveedor y los gestos reales mediante el arnés
determinista del proyecto. Se simuló una cola de JavaScript retrasada y se
analizó la velocidad de las curvas. No se manipuló un teléfono físico ni se
midieron FPS nativos. Las pruebas no reproducen la composición de GPU,
BlurView, sombras o clipping de Fabric.

Por tanto, los resultados demuestran fallos de coordinación y continuidad,
no que estos sean la única causa de los tirones observados en el dispositivo.

## Hallazgos antes de modificar el comportamiento

### 1. Finalización con velocidad nueva

El gesto enviaba a JS solamente el destino, no su velocidad. JS iniciaba un
`withTiming` con ease-out cúbico y duración proporcional al recorrido restante.
Su velocidad inicial es `3 × distancia restante / duración`.

Ejemplo con ancho de 390 px y recorrido de 315 px:

| Progreso al soltar | Velocidad del dedo (px/s) | Duración (ms) | Velocidad inicial automática (px/s) |
| --- | ---: | ---: | ---: |
| 0 (avatar) | 0 | 360 | 2625 |
| 0,2 | 50 | 288 | 2625 |
| 0,2 | 1600 | 288 | 2625 |
| 0,2 | 5000 | 288 | 2625 |
| 0,8 | 50 | 126 | 1500 |

Son velocidades calculadas de la implementación, no medidas de FPS. El
desplazamiento puede mantener su posición y aun así cambiar bruscamente de
velocidad al soltar.

### 2. Una finalización antigua podía invalidar otro arrastre

Secuencia reproducida antes del cambio:

1. Gesto A llegó a progreso 0,4 y soltó; su finalización quedó en la cola JS.
2. Gesto B canceló la animación en UI y movió el progreso a 0,3.
3. Al procesar JS, la finalización de A aún tenía la misma versión que B.
4. Se inició apertura automática a 1 y se montó el escudo táctil.
5. La siguiente actualización de B debía alcanzar 0,2, pero se ignoró; quedó
   en 0,3 con una animación hacia 1.

Cancelar la animación en UI no bastaba para invalidar las órdenes pendientes
de JS.

### 3. Última coordenada del dedo

La finalización usaba el último `onUpdate`, no la traslación del evento final.
Si los eventos se agrupan durante un movimiento rápido, puede faltar parte
del recorrido al iniciar la finalización.

## Cambios

- Se conserva `drawerProgress` como único valor de posición horizontal.
- Cada arrastre invalida las generaciones anteriores inmediatamente en UI.
- Las tres superficies de gesto finalizan directamente en UI, con la última
  traslación y velocidad nativas. JS publica estados discretos, no anima X.
- La finalización usa un resorte críticamente amortiguado, sin rebote, con
  velocidad inicial `velocityX / recorrido`. Parte de la posición actual.
- Las aperturas por avatar también se despachan a UI; parten con velocidad
  cero desde reposo. Al interrumpir otro resorte, Reanimated conserva su
  velocidad en lugar de reiniciar una curva desde cero.
- Las confirmaciones y callbacks antiguos verifican también la generación
  de UI, aunque JS todavía no haya recibido el nuevo gesto.

No se cambiaron la franja visible de 75 px, las esquinas de 50 px, el aclarado
del 5 %, la sombra, el desenfoque, el fade del avatar o del menú ni su movimiento
vertical. Los efectos siguen derivados del mismo progreso.

## Verificación automatizada

### Precisión terminal del cierre

La ejecución del `onStart` y `onFrame` del resorte instalado de Reanimated
(sin renderizador nativo) reprodujo una discontinuidad de finalización:
con el umbral anterior de energía `1e-5`, un cierre desde reposo a 60 Hz
terminaba a los 333,33 ms y forzaba a cero un desplazamiento restante de
0,7067 px (pantalla de 390 px). El radio correspondiente saltaba 1,8463 px.
La sombra y el aclarado ya eran casi transparentes: los saltos de opacidad
eran 0,000538 y 0,000112, respectivamente.

El cambio mínimo pasa el destino al configurador y usa el umbral estándar
de Reanimated (`6e-9`) solo al cerrar. No cambia rigidez, amortiguación, masa,
velocidad, geometría, navegación ni la configuración de apertura. Todos los
fotogramas anteriores al corte viejo son idénticos; únicamente se deja
completar la cola subpíxel. En ese mismo caso, el corte nuevo deja 0,01585 px
de desplazamiento y 0,04191 px de radio, a los 500 ms. No se ralentiza el
recorrido principal, pero la finalización formal ocurre más tarde porque
ya no trunca esa cola.

Las pruebas ejecutan el motor instalado en 240 cierres a 60/90/120 Hz, con
cinco anchos, cuatro posiciones y cuatro velocidades. Comprueban posición
monótona, cero exacto, precisión terminal y configuración de apertura
idéntica. Los cierres con velocidad suficiente para cruzar cero usan el
clamping intencional existente, no se confunden con el corte por energía.
Las pruebas anteriores mantienen la protección de callbacks, el orden de
navegación, la capa táctil estable y el video reanudado después del cierre.

Esto prueba y corrige la discontinuidad del motor, pero no mide FPS, coste
de composición ni percepción en un teléfono. No permite asegurar por sí
solo que desapareció cualquier tirón físico restante.

- Matriz de 32 casos: apertura/cierre, distancias 15/63/157,5/280 px y
  velocidades 50/500/1600/5000 px/s, incluido retorno al destino original.
- Posición 1:1 mientras el dedo permanece apoyado, sin renders adicionales
  del proveedor por actualización de movimiento.
- Última coordenada al soltar, velocidad transferida y finalización correcta.
- Cola JS retrasada con nuevo arrastre: las órdenes viejas ya no montan el
  escudo ni reinician el movimiento.
- Apertura programática desde posición intermedia e inversión de resorte.
- Callbacks tardíos de animación y readiness no interrumpen el gesto nuevo.
- Conservación de velocidad analítica en cuatro anchos y siete velocidades.
- Regresiones de navegación, destinos, escenas, video del hero y widget.
- Inicialización del módulo tras la transformación Babel nativa de worklets:
  las dependencias deben estar declaradas antes de capturarlas. Esta prueba
  complementa los tests TypeScript, que por sí solos permiten hoisting.

El arnés no representa todos los renders de la aplicación: el video del hero
conserva su actualización local al comenzar/terminar el desplazamiento.

## Verificación nativa pendiente

El usuario confirmó después que la apertura desde el avatar quedó fluida y
que el cierre mejoró mucho, con una pequeña traba restante al terminar.
Se conservó esa curva. Para evitar concentrar trabajo en el último frame,
la capa táctil queda montada e inactiva al cerrar y el video se reanuda tras
dos oportunidades de pintura. La reanudación se cancela al reabrir o desmontar.
Esto elimina el cambio de jerarquía y separa operaciones; no es una medición
de GPU ni confirma por sí solo que el tirón residual desapareció.

Para confirmar la fluidez visual se necesita una sesión en dispositivo con
tiempos de frame: reposo, avatar, arrastres lentos/rápidos/cortos/largos,
apertura/cierre e interrupciones. Debe distinguirse FPS de UI y JS, comparando
también desarrollo frente a un build sin instrumentación de desarrollo.

No hay evidencia medida para culpar o descartar definitivamente la
composición conjunta del radio, sombra, velo y contenido. Mantener esos
efectos; si persisten tirones, medir el render nativo antes de hacer más
eliminaciones de prueba.
