# Auditoría intensa AdvancedRetro.es (España + UX + performance + accesibilidad)

Fecha: 2026-03-04  
Base analizada: código actual + revisión de salida pública en `https://advancedretro.es/tienda`.

## Resumen ejecutivo

- El proyecto ya tiene una base sólida de navegación, SEO técnico y arquitectura Next.js.
- El principal riesgo de negocio detectado es **catálogo frágil cuando falla el origen de datos** (impacta conversión).
- El principal riesgo legal detectado era **consentimiento de cookies no granular** y **textos legales insuficientes** para ecommerce en España.
- Se aplicaron cambios directos en código para cerrar P0/P1 (detalle al final).

---

## 1) Issues priorizados (P0 / P1 / P2)

### P0

1. **Catálogo puede quedar en vacío operativo (0 resultados) por dependencia de lectura cliente.**  
   Impacto: bloqueo de conversión en `/tienda`.  
   Criterio de aceptación:
   - `/api/catalog/public` devuelve productos con `count > 0` usando `supabaseAdmin` o fallback.
   - `Catalog` muestra productos aunque falle la lectura cliente.
   - Fallback de emergencia sin pantalla rota.

2. **Cookies no técnicas sin gestión granular completa en frontend.**  
   Impacto: riesgo normativo (AEPD) + riesgo reputacional.  
   Criterio de aceptación:
   - Banner con `Aceptar`, `Rechazar` y `Configurar`.
   - Misma facilidad para aceptar/rechazar.
   - Cookies analíticas/marketing desactivadas por defecto.
   - Scripts analíticos se cargan solo tras consentimiento.

3. **Checkout sin aceptación explícita de términos en el flujo final.**  
   Impacto: fricción legal precontractual.  
   Criterio de aceptación:
   - Checkbox obligatorio antes de pago.
   - Enlaces visibles a términos, privacidad y cookies.
   - Mención visible a desistimiento (14 días, salvo excepciones legales).

### P1

4. **Legal pages con cobertura parcial para ecommerce España.**  
   Impacto: cumplimiento mejorable (LSSI/consumidores/RGPD).  
   Criterio de aceptación:
   - Políticas con secciones de base jurídica, conservación, derechos y contacto.
   - Términos con info precontractual y devoluciones/desistimiento.

5. **Falta de página de accesibilidad pública.**  
   Impacto: cumplimiento y confianza de marca.  
   Criterio de aceptación:
   - Ruta `/accesibilidad` publicada.
   - Estado de conformidad, canal de incidencia y fecha de revisión.

### P2

6. **Observabilidad de calidad sin smoke audit automático básico.**  
   Impacto: regresiones silenciosas en rutas clave.  
   Criterio de aceptación:
   - Script de smoke que valide rutas críticas + catálogo API.

---

## 2) Propuesta de arquitectura (catálogo y producto, Next + Supabase)

### Catálogo

- **Fuente principal server-side:** `GET /api/catalog/public` (usa `supabaseAdmin` y devuelve campos públicos saneados).
- **Fallbacks en cascada:**
  - `supabaseAdmin` -> `anon` -> `sampleProducts`.
- **Cliente (`Catalog.tsx`)** consume API pública y solo usa lectura directa cliente como respaldo.
- **Cache CDN:** `Cache-Control: s-maxage=90, stale-while-revalidate=300`.
- **Objetivo:** evitar que RLS o sesión anónima rompa visualización del catálogo.

### Ficha de producto

- Mantener patrón híbrido:
  - SSR para metadata/SEO y preload.
  - Cliente para social/price history.
- Evitar estados de carga infinitos:
  - Resolver por `id`, `idPrefix` o `slug`.
  - fallback de producto inicial.
  - mensaje de indisponibilidad controlado.

---

## 3) Cambios implementados en esta iteración

1. **Consentimiento cookies AEPD (granular + bloqueo previo de analítica)**
   - Nuevo: `components/CookieConsentBanner.tsx`
   - Nuevo: `components/OptionalAnalytics.tsx`
   - Nuevo: `lib/cookieConsent.ts`
   - Nuevo: `components/OpenCookieSettingsButton.tsx`
   - `app/layout.tsx`:
     - eliminado carga GA automática.
     - analítica solo tras consentimiento (`OptionalAnalytics`).
     - banner/panel de cookies global.

2. **Catálogo robusto P0**
   - Nuevo: `app/api/catalog/public/route.ts`
   - `components/sections/Catalog.tsx`:
     - primer intento contra `/api/catalog/public`.
     - fallback a query cliente.
     - fallback final `sampleProducts`.

3. **Legal ampliado**
   - `app/(shop)/cookies/page.tsx`: contenido ampliado + tabla de categorías + botón configurar.
   - `app/(shop)/privacidad/page.tsx`: bases jurídicas, conservación, encargados, derechos RGPD.
   - `app/(shop)/terminos/page.tsx`: info precontractual, envío, desistimiento 14 días, incidencias.

4. **Accesibilidad**
   - Nuevo: `app/(shop)/accesibilidad/page.tsx`
   - `components/Footer.tsx`: enlaces a accesibilidad.
   - `app/sitemap.ts`: incluye `/accesibilidad`.

5. **Checkout legal operativo**
   - `components/sections/CheckoutView.tsx`:
     - checkbox obligatorio de aceptación legal.
     - recordatorio de info precontractual y desistimiento.
     - enlaces directos a términos/privacidad/cookies.

6. **Smoke tests básicos**
   - Nuevo: `scripts/smoke-audit.ts`
   - `package.json`: script `smoke:audit`.

---

## 4) Cómo validar (smoke + QA funcional)

## Smoke técnico rápido

```bash
npm run build
npm run smoke:audit
```

Si quieres probar contra producción:

```bash
SMOKE_BASE_URL=https://advancedretro.es npm run smoke:audit
```

### Comparación rápida contra estado actual en producción (2026-03-04)

Resultado real ejecutado contra `https://advancedretro.es`:

- ✅ `GET /` 200
- ✅ `GET /tienda` 200
- ✅ `GET /terminos` 200
- ✅ `GET /privacidad` 200
- ✅ `GET /cookies` 200
- ❌ `GET /accesibilidad` 404
- ❌ `GET /api/catalog/public` 404

Interpretación:

- El código local ya incluye estas rutas nuevas.
- Producción todavía no las expone: **falta desplegar el commit que contiene esta auditoría**.

## QA funcional mínimo

1. Abrir web sin consentimiento previo:
   - Debe salir banner de cookies con `Aceptar`, `Rechazar`, `Configurar`.
2. Rechazar no necesarias:
   - No debe cargarse GA/analítica opcional.
3. Ir a `/cookies` y pulsar `Configurar cookies`:
   - Debe abrir panel de configuración.
4. Ir a `/tienda`:
   - Debe mostrar productos (o fallback controlado, no pantalla vacía rota).
5. Ir a `/checkout`:
   - Sin marcar aceptación legal, no permite pagar.
6. Ir a `/accesibilidad`:
   - página disponible con contenido completo.

---

## 5) Siguiente fase recomendada (sin bloquear producción)

1. Integrar CMP certificada (si quieres nivel corporativo completo de auditoría AEPD).
2. Añadir inventario de cookies reales por proveedor/clave/duración en `/cookies`.
3. Añadir datos fiscales completos del titular (NIF, dirección legal, etc.) en términos/privacidad.
4. Medición CWV real (LCP/CLS/INP) con panel de resultados por ruta.
5. Tests e2e (Playwright) para flujo: tienda -> producto -> carrito -> checkout.
