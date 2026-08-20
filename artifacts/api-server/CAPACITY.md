# Capacidad y lanzamiento

Este documento define una meta inicial y las herramientas reproducibles para validar
la capacidad de RESONANCIA. La cifra es un objetivo de ingeniería, no una garantía
comercial: debe volver a medirse cuando cambien el catálogo, los patrones de uso o
la infraestructura.

## Meta inicial de lanzamiento

- 100 usuarios virtuales concurrentes.
- 50 solicitudes por segundo sostenidas durante 2 minutos.
- Throughput real de al menos el 95% del objetivo (47,5 req/s para el perfil
  `launch`) para tolerar el desfase normal del scheduler.
- Latencia p95 agregada menor o igual a 750 ms.
- Tasa de errores menor o igual al 1%.
- Sin espera sostenida por conexiones PostgreSQL.

El perfil `smoke` usa 5 usuarios, 10 solicitudes por segundo y 15 segundos. Siempre
se ejecuta primero para comprobar que el entorno y las rutas estén sanos.

## Seguridad

- La herramienta solo hace lecturas por defecto.
- Cualquier host `.replit.dev` requiere `CAPACITY_ALLOW_REMOTE=YES`.
- Probar producción requiere `CAPACITY_ALLOW_PRODUCTION=YES` y aprobación explícita.
- Favoritos, progreso y biblioteca solo se escriben si se habilitan ambas variables:
  `CAPACITY_ENABLE_IDEMPOTENT_WRITES=YES` y `CAPACITY_DEDICATED_TEST_ACCOUNT=YES`.
- Las escrituras reutilizan el snapshot actual, pero aun así deben ejecutarse
  únicamente con una cuenta descartable.
- Los secretos de sesión se proporcionan mediante Replit Secrets; nunca se pegan en
  comandos compartidos, reportes o documentación.

## Prueba HTTP

Primero, reiniciar el API Server y comprobar:

```bash
curl "https://$REPLIT_DEV_DOMAIN/api/readyz"
```

Smoke público:

```bash
CAPACITY_BASE_URL="https://$REPLIT_DEV_DOMAIN" \
CAPACITY_ALLOW_REMOTE=YES \
CAPACITY_PROFILE=smoke \
CAPACITY_REPORT_PATH="/tmp/resonancia-capacity-smoke.json" \
pnpm --filter @workspace/api-server capacity:load
```

Perfil de lanzamiento:

```bash
CAPACITY_BASE_URL="https://$REPLIT_DEV_DOMAIN" \
CAPACITY_ALLOW_REMOTE=YES \
CAPACITY_PROFILE=launch \
CAPACITY_REPORT_PATH="/tmp/resonancia-capacity-launch.json" \
pnpm --filter @workspace/api-server capacity:load
```

Para incluir lecturas autenticadas, definir de forma segura una de estas variables:

- `CAPACITY_AUTHORIZATION`
- `CAPACITY_AUTH_COOKIE`

Con autenticación, la mezcla incluye favoritos, progreso, biblioteca, actividad y
conversaciones. Sin autenticación cubre catálogo, popularidad, mezclas, comunidad,
mensajes públicos y readiness.

Todos los límites pueden sobrescribirse:

- `CAPACITY_CONCURRENCY`
- `CAPACITY_TARGET_RPS`
- `CAPACITY_DURATION_SECONDS`
- `CAPACITY_REQUEST_TIMEOUT_MS`
- `CAPACITY_TARGET_P95_MS`
- `CAPACITY_TARGET_ERROR_RATE`
- `CAPACITY_THROUGHPUT_TOLERANCE` (por defecto 0.05)

El proceso termina con código 2 cuando no cumple las metas de latencia, errores o
throughput mínimo.

## Reporte PostgreSQL

El reporte es de solo lectura y no incluye filas ni datos personales. Resume tamaño,
actividad, uso de índices y planes de las consultas principales.

```bash
CAPACITY_DB_REPORT_PATH="/tmp/resonancia-db-capacity.json" \
pnpm --filter @workspace/db capacity:report
```

Para medir tiempos reales de ejecución en desarrollo:

```bash
CAPACITY_DB_EXPLAIN_ANALYZE=YES \
CAPACITY_DB_REPORT_PATH="/tmp/resonancia-db-capacity-analyze.json" \
pnpm --filter @workspace/db capacity:report
```

Cada ejecución corre dentro de una transacción `READ ONLY` con timeout.

## Observabilidad

- `GET /api/healthz`: confirma que el proceso está vivo.
- `GET /api/readyz`: confirma que PostgreSQL responde; se cachea 5 segundos.
- `GET /api/admin/capacity/metrics`: solo administradores. Expone agregados de
  latencia, errores y estado del pool, sin URLs con IDs, tokens, SQL ni datos personales.

El servidor registra un warning estructurado `capacity_threshold_exceeded` si una
ruta supera los umbrales. Se configuran con:

- `CAPACITY_ALERT_P95_MS` (por defecto 1000)
- `CAPACITY_ALERT_ERROR_RATE` (por defecto 0.05)
- `CAPACITY_ALERT_MIN_SAMPLES` (por defecto 20)
- `CAPACITY_ALERT_COOLDOWN_MS` (por defecto 60000)

El pool PostgreSQL se controla con:

- `DATABASE_POOL_MAX` (por defecto 10 por instancia)
- `DATABASE_POOL_IDLE_TIMEOUT_MS` (por defecto 10000)
- `DATABASE_POOL_CONNECTION_TIMEOUT_MS` (por defecto 5000)

Si el API escala horizontalmente, la suma de `DATABASE_POOL_MAX` de todas las
instancias debe permanecer por debajo del límite de conexiones de la base.

## Criterio de optimización

No se añade caché ni se cambia a cursores por intuición. Se aplica una mejora solo
cuando un reporte muestra que una ruta incumple la meta o que su plan degrada con el
volumen. Los candidatos conocidos son:

- ranking de sesiones calculado sobre todo el historial;
- catálogo completo sin paginación;
- offsets profundos en feeds;
- colecciones personales sin límite.

Después de cualquier optimización se repite exactamente el mismo perfil y se compara
el reporte anterior con el nuevo.

## Baseline medido — 19 de agosto de 2026

El perfil público de lanzamiento se ejecutó contra el API local de desarrollo:

| Medición | Resultado |
| --- | ---: |
| Usuarios virtuales | 100 |
| Objetivo / throughput real | 50 / 49,19 req/s (mínimo aceptado: 47,5) |
| Duración real | 121,98 s |
| Solicitudes | 6.001 |
| Errores | 0 |
| p50 / p95 / p99 | 4,19 / 8,27 / 12,44 ms |
| Máximo | 119,41 ms |

La consulta pública más costosa fue el catálogo, con p95 de 9,99 ms. Los cinco
planes SQL medidos quedaron entre 0,02 y 0,13 ms, sin deadlocks ni archivos
temporales.

### Alcance de esta conclusión

El baseline cumple holgadamente la meta pública definida, pero la base de desarrollo
es pequeña (aprox. 13 MB) y no representa todavía el volumen de lanzamiento. No se
ejecutó carga autenticada porque no había una cuenta descartable de staging; el
runner la deja preparada, pero no usa cuentas reales automáticamente. Por lo tanto:

- no hay evidencia para añadir caché, cursores o más índices ahora;
- el resultado confirma el arnés, la estabilidad del API público y el margen del
  entorno actual;
- antes de una promesa comercial de capacidad se debe repetir `launch` con datos
  representativos y una cuenta de staging para favoritos, sincronización y mensajes
  privados.