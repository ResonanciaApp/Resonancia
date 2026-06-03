# Propuesta de paquete Premium (a revisar y definir)

> Backlog de producto/monetización extraído de `replit.md` para mantenerlo liviano. Nada de esto está confirmado ni implementado; son decisiones a tomar.

## FREE incluye

- Sesiones marcadas como gratuitas (hoy: #1 "Adentro de uno mismo" y #29 "Prueba Maestra 1") — pensar 5-8 sesiones sampler en total, repartidas entre categorías
- Intención del día (ilimitada)
- Frase del día (ver + compartir)
- Diario: hasta **5 entradas** guardadas
- Favoritos: hasta **5 sesiones** favoritas
- Timer de sueño / meditación: hasta **30 min**
- Comunidad: acceso completo (grupos, posts, actividades, chat, invitar, crear)
- Configuraciones, perfil, ayuda, registro
- Notificaciones (cuando exista backend)

## PREMIUM desbloquea

- Catálogo completo de sesiones
- **Voz Interior**: grabar mensajes (hoy todos pueden)
- **Diario / Mensajes del Alma**: entradas ilimitadas
- **Favoritos**: ilimitados
- **Timer**: hasta 8 hs (para dormir toda la noche)
- **Descargas offline** de sesiones
- **Mensajes anónimos**: enviar (no solo leer)
- **Estadísticas / historial extendido** (más allá de últimos 7 días)
- **Personalización avanzada**: temas, sonidos ambiente custom

**Comunidad queda 100% FREE** (grupos, actividades, chat, invitar amigos, postear).

## Notas de implementación cuando se confirme

- Cada feature gateada usa `const { isPremium } = usePremium()` y muestra PremiumBadge / Alert → `router.push("/membresia")`
- Mantener UX coherente: el free ve la opción pero al tocar le explica brevemente y le ofrece probar premium
- Para los límites (5 diario, 30 min timer, etc.), guardar el contador local y al alcanzar el tope mostrar paywall

## Cobro (pagos in-app)

- Usar **RevenueCat** sobre Apple IAP / Google Play Billing (obligatorio en apps móviles — no se puede usar Stripe directo). Apple/Google retienen 15-30%. Falta: definir precio (mensual/anual/lifetime), crear cuentas en App Store Connect + Google Play Console + RevenueCat. Para web (si llega) sí va Stripe directo.

## Prueba gratis de 7 días (free trial)

Estándar en la categoría (Calm, Headspace, Pura Mente). NO se programa en código — se configura como "oferta introductoria" en App Store Connect y Google Play Console, atada al producto de suscripción. RevenueCat la lee automáticamente y `isPremium` ya funciona durante el trial. Decisiones a tomar:

- Duración: 7 días (estándar) vs 14 (más conversión, más abuso)
- Solo en plan anual (recomendado, empuja al anual) vs también en mensual
- Pedir tarjeta upfront (default Apple/Google, mejor conversión post-trial) vs sin tarjeta
- Precio sugerido: ~$43.900/año (similar a Pura Mente) + opción mensual ~$4.900/mes — ajustar según mercado

## Disponibilidad por país + precios por región

La app se puede vender en +150 países (todos los hispanohablantes). Al publicar se elige disponibilidad (default: todos, o solo Latam+España al inicio). Apple/Google cobran en moneda local y retienen impuestos por país. Estrategia recomendada:

- **Localizar precios por región** (NO un precio global convertido): el poder adquisitivo varía mucho. Un precio que funciona en España (~€40/año) es caro para Latam.
- Tiers sugeridos: España/EE.UU. ≈ €40-45/año; México/Chile/Colombia/Perú/Argentina ≈ USD 15-25/año equivalente; ajustar con las sugerencias de paridad de RevenueCat/App Store Connect.
- RevenueCat permite definir precios por país/región desde su panel sin tocar código — `isPremium` funciona igual sin importar el precio pagado.
- Plan anual como ancla (mejor retención) + mensual más caro proporcionalmente para empujar al anual.
- Al lanzar, arrancar con precios un poco más bajos (oferta de lanzamiento) para ganar reseñas y conversión, luego subir.
