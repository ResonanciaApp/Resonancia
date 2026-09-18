# Inspiración diaria: administración y activación

## Antes de activar el contenido

La sección no incluye frases ni fotografías de ejemplo presentadas como contenido definitivo. Preparar la primera semana editorial con siete fechas, imágenes autorizadas, frases y reflexiones. El audio relacionado es opcional y se elige del catálogo existente.

La portada de Inicio abre la semana actual. Una fecha sin publicación muestra un estado explícito de contenido no disponible; no reutiliza el texto de otro día.

## Publicación

1. Abrir **Inspiración diaria** en Admin y seleccionar la semana y el día.
2. Completar frase, reflexión e imagen. Agregar autor/crédito y audio si corresponde.
3. Ajustar el encuadre y el oscurecimiento para que la frase se lea sobre la fotografía.
4. Guardar el borrador y revisar las vistas previas de portada y detalle.
5. Publicar el día. No es obligatorio completar toda la semana para guardar o publicar.

Guardar cambios en el borrador de un día ya publicado no reemplaza su versión pública. Volver a publicar aplica los cambios. Las fechas futuras permanecen bloqueadas para el lector hasta que llegue la fecha en su zona horaria; el servidor aplica esta regla también a las imágenes.

Si otra persona modificó la misma inspiración, el editor informa el conflicto en lugar de sobrescribirla silenciosamente. Revisar la versión actual antes de volver a guardar.

## Retirar contenido

Despublicar retira el contenido del lector y conserva el borrador. Eliminar exige confirmación. Las notas privadas del lector permanecen accesibles desde **Mis notas**, incluso si se retira la inspiración. Un favorito retirado puede quitarse de la lista.

No borrar archivos del almacenamiento manualmente: una imagen puede estar referenciada por otra versión o publicación.

## Datos del lector

- La lectura es gratuita; el audio mantiene su permiso gratuito o Premium.
- Los invitados guardan notas y favoritos en su dispositivo.
- Las cuentas sincronizan sus datos privados; importar apuntes de invitado requiere confirmación.
- Los conflictos de notas deben resolverse conservando el texto pendiente, nunca descartándolo automáticamente.
- Compartir una imagen incluye la frase pública, fecha, crédito y marca; no incluye notas privadas.
- Admin administra contenido editorial, no notas de lectores.

## Despliegue coordinado

Aplicar la migración aditiva de Inspiración diaria mediante el procedimiento de migraciones existente antes de desplegar la API que utiliza las nuevas tablas. Desplegar API y Admin compatibles con el mismo contrato y luego actualizar la app móvil. No ejecutar migraciones de desarrollo contra producción ni usar contenido editorial real como datos de prueba.

Comprobar una fecha publicada, una futura y una vacía; guardar y recuperar un favorito; crear, editar y borrar una nota; y compartir una imagen desde un dispositivo iOS/Android. Verificar también el audio Premium con una cuenta sin suscripción.