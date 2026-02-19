# PriceCharting Setup

## Variable de entorno

En `Vercel` y en `.env.local` agrega:

```env
PRICECHARTING_API_TOKEN=tu_token_de_40_caracteres
```

## Qué muestra ahora la tienda

- En la página de producto:
  - Gráfica de tu tienda basada en pedidos reales (`orders` / `order_items`).
  - Bloque "Comparativa de mercado (PriceCharting)" con:
    - `Loose`
    - `CIB`
    - `Nuevo`
    - `Solo caja`
    - `Solo manual`
    - `Graded`

## Importante sobre la API

PriceCharting **no ofrece histórico de ventas** por API en el endpoint de precios.
Por eso:

- La gráfica histórica sale de tus ventas internas.
- PriceCharting se usa como comparación de precios actuales.
