# RESONANCIA — Costos de almacenamiento y plan de video (Bunny.net)

> Documento de referencia. Resume los costos de almacenamiento de la app y los pasos
> para migrar los videos a Bunny.net Stream.

---

## 1. Qué ocupa almacenamiento (y qué no)

**NO genera costo de almacenamiento en la nube:**
- **Audios (MP3)** — van empaquetados *dentro* de la app. Apple/Google hostean la
  descarga gratis. No pagas hosting por los audios.
- **Imágenes de sesiones** — también bundleadas en la app.
- **La app en sí** — su distribución corre por cuenta de las tiendas.

**SÍ vive en almacenamiento en la nube:**
- **Videos** — pesan demasiado para bundlear; se transmiten (stream) al reproducirse.
  Acá está el costo real.
- **Media del chat** — fotos/audios que los usuarios se mandan en DM. Crece con el uso.
- **Base de datos** (perfiles, diario, favoritos, posts) — solo texto, costo casi nulo.

---

## 2. Los dos costos del almacenamiento

1. **Guardar (almacenamiento en reposo):** cuánto tienes acumulado (GB/mes).
   Crece lento y es barato.
2. **Transferir (ancho de banda / egress):** cada reproducción transfiere los MB del
   video al teléfono del usuario. **Esto es lo que escala con la cantidad de usuarios
   y es el costo dominante.**

Fórmula mental: **tamaño del archivo × veces que se reproduce = costo.**

---

## 3. Escenario real: 50 videos de 20–50 min

### Peso por video (depende de la calidad)

| Calidad | Peso por minuto | Video 20 min | Video 50 min |
|---|---|---|---|
| **720p** (recomendado) | ~19 MB | ~375 MB | ~940 MB |
| 1080p | ~37 MB | ~740 MB | ~1,8 GB |

Promedio usado: **35 min en 720p ≈ 0,65 GB por video.**

### Costo 1 — Guardar los 50 videos (barato y fijo)
- 50 × 0,65 GB = **~33 GB almacenados** → del orden de **USD 1 a 5 por mes**.
- No cambia con la cantidad de usuarios. Olvidate de esta parte.

### Costo 2 — Reproducción (acá está todo el costo)
Con object storage genérico (~USD 0,10/GB de transferencia):

| Usuarios activos | Videos vistos c/u al mes | Transferencia/mes | Costo aprox/mes |
|---|---|---|---|
| 100 | 10 | ~650 GB | ~USD 65 |
| 500 | 10 | ~3,25 TB | ~USD 325 |
| 1.000 | 10 | ~6,5 TB | ~USD 650 |
| 5.000 | 10 | ~32 TB | ~USD 3.250 |

El almacenamiento es trivial; **el ancho de banda se vuelve el gasto dominante** apenas
haya tracción.

---

## 4. Por qué Bunny.net (en vez de object storage genérico)

Con 50 videos largos, NO conviene usar object storage crudo para el streaming.
**Bunny.net Stream** cuesta ~10–20× menos por GB transferido e incluye CDN y
compresión automática.

Ese escenario de 1.000 usuarios que en object storage costaba ~USD 650/mes, con Bunny
baja a algo del orden de **USD 30–65/mes**.

Beneficios extra:
- **Compresión y múltiples calidades automáticas** (se adapta a la conexión de cada
  usuario → menos transferencia y mejor experiencia).
- **CDN global** → carga rápida en toda Latam y España.
- **Token Authentication** → URLs firmadas con expiración. Esto da enforcement REAL
  del gating premium (hoy el gating es solo de interfaz).

Alternativas: **Cloudflare Stream** (más simple, ~USD 1 por cada 1.000 min vistos) y
**Mux** (más premium, más caro).

---

## 5. Cómo bajar el costo pase lo que pase
- Subir los videos en **720p** bien comprimidos (no 1080p/4K).
- **Premium gating** en los videos pesados → menos reproducciones gratis.
- **Servicio de video dedicado** (Bunny) en vez de storage genérico → el mayor ahorro.

---

## 6. Pasos para migrar a Bunny.net Stream

### Parte A — Lo que haces tú (cuenta y configuración, ~15 min)
1. Crear cuenta en **https://bunny.net** (tiene prueba/saldo inicial).
2. En el panel, ir a **Stream → Add Video Library** y crear una librería
   (ej: "RESONANCIA Videos"). Elegir las regiones de replicación cercanas a tus
   usuarios (ej: Sudamérica + Europa).
3. Anotar de esa librería:
   - **Library ID** (número)
   - **CDN Hostname / Pull Zone** (algo como `vz-xxxxxxxx.b-cdn.net`)
   - **API Key** (en la pestaña *API* de la librería) → esto es secreto.
4. (Recomendado para premium) Activar **Token Authentication** en la librería y
   anotar la **Token Authentication Key** → también secreto.

### Parte B — Subir los videos
- Opción simple: arrastrar y soltar los videos en el panel de la librería. Bunny los
  transcodifica solo a varias calidades (HLS).
- Cada video queda con un **GUID** (identificador único). Ese GUID es lo que la app
  usa para reproducir.

### Parte C — Lo que hago yo (código)
1. Guardar las credenciales de Bunny como **secrets** en Replit (Library ID,
   Pull Zone, API Key, Token Key). Nunca van en el código.
2. Ajustar el tipo `VideoItem` en `data/videos.ts`: en vez de `objectPath`, cada video
   guarda su **`bunnyVideoId`** (el GUID).
3. Cambiar `getVideoSourceUri` para construir la URL HLS de Bunny:
   `https://<pull-zone>.b-cdn.net/<guid>/playlist.m3u8`
   (`expo-video` reproduce HLS sin problema).
4. (Premium real) Crear un endpoint en el API server que **firme la URL** con la Token
   Key SOLO si el usuario es premium, con expiración corta. La app pide la URL firmada
   antes de reproducir. Esto reemplaza el gating "solo UI" por enforcement real.
5. Probar reproducción y seek en la app.

### Parte D — Limpieza (opcional)
- Una vez que los videos estén en Bunny, ya no se usa la ruta
  `/api/storage/objects/*` para video (sigue sirviendo para el media del chat).

---

## 7. Resumen
- **Guardar** 50 videos cuesta unos pocos dólares al mes — no preocupa.
- **Reproducir** es lo que escala con usuarios.
- **Bunny.net** mantiene el costo en decenas de dólares (en vez de cientos) incluso con
  miles de usuarios, y de paso permite gating premium real.
- El código de la app ya está casi listo; migrar a Bunny es cambiar de dónde se sirve
  el video + (opcional) agregar el firmado de URLs premium.
