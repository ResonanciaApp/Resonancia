---
name: Parallax del header de Inicio 3
description: Restricción visual para optimizaciones de rendimiento del hero de Inicio 3.
---

El avatar, las acciones laterales y la fila semanal de Inicio 3 deben conservar su desplazamiento lento y sincronizado respecto del scroll.

Al acortar el carrusel hero de Inicio 3 por arriba, dejar ese espacio arriba como fondo visible: desplazar el borde superior hacia abajo y conservar fijo el borde inferior y el alto del contenedor exterior. Es distinto de trasladar el hero entero: cuando se pida subir el hero y «arrastrar todo», mover a la vez su posición y el espacio que reserva en el flujo para que el contenido inferior suba con él, sin desplazar el avatar ni la fila semanal.

**Why:** El usuario confirmó que este parallax es intencional. No es el sticky header que pidió retirar; eliminar la compensación de scroll cambió el diseño equivocado. Primero pidió expresamente conservar arriba el hueco liberado al achicar el hero y después pidió subir el hero junto con todo el contenido que viene debajo.

**How to apply:** Al optimizar el hero, aislar renders de React y mantener el movimiento en el hilo de UI. No retirar el estilo compartido ni cambiar su factor sin una solicitud explícita. Si se recorta por arriba, conservar el borde inferior; si se traslada todo el bloque, cambiar tanto la posición del carrusel como el espacio vertical reservado para él, sin tocar los elementos flotantes del encabezado.

El factor de compensación confirmado es `0.52`: el bloque se desplaza visualmente a cerca del 48% de la velocidad normal del contenido.

No animar una máscara (`MaskedView`) en respuesta al scroll del hero. Aunque el valor viva en el hilo de UI, la recomposición de la máscara puede trabar tanto el hero como las capas parallax. Preferir un degradado simple.

No activar `shouldRasterizeIOS` ni `renderToHardwareTextureAndroid` en los bloques que reciben el transform del parallax: bajo Fabric pueden invalidar la superficie durante el scroll y volver a introducir el lag. Mantener esos subárboles estáticos y dejar que Reanimated componga solo el `translateY`.