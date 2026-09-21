---
name: Entitlement RevenueCat desconocido
description: Regla de seguridad para conservar acceso Premium durante fallos transitorios sin extenderlo más allá de su vencimiento.
---

El estado de suscripción debe modelarse como activo, inactivo o desconocido. Un fallo de red, SDK sin configurar, carga inicial o consulta fallida nunca debe convertirse automáticamente en “inactivo”, porque eso revoca acceso y puede mostrar una oferta de compra a alguien que ya pagó.

**Why:** RevenueCat puede fallar temporalmente o no responder al arrancar. Al mismo tiempo, guardar un booleano `true` sin vencimiento permitiría conservar Premium indefinidamente después de cancelar.

**How to apply:** En estado desconocido, usar únicamente el último entitlement verificado mientras su fecha de expiración siga vigente. Programar la invalidación al vencer y reevaluarla cuando la app vuelve a primer plano. Una compra o restauración debe escribir inmediatamente el `CustomerInfo` retornado en el caché antes de revalidar por red.