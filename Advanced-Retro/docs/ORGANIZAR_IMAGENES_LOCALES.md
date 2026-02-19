# Organizar Imagenes Locales y Subir a Supabase

Este flujo toma archivos de `Imagenes/`, los organiza por producto y actualiza la tabla `products`.

## Flujo completo

1. Organizar y deduplicar (sin borrar originales):

```bash
npm run images:organize
```

2. Generar plantilla de mapeo manual para pendientes:

```bash
npm run images:mapping:template
```

3. (Opcional) Agrupar pendientes por similitud visual:

```bash
npm run images:cluster
```

4. (Opcional) Copiar mapeo de clusters a mapeo manual:

```bash
npm run images:cluster:apply
```

5. (Opcional) Marcar variantes duplicadas como `skip`:

```bash
npm run images:mapping:dedupe
```

6. Aplicar mapeo manual (mueve o copia desde `pendientes` a carpetas de producto):

```bash
npm run images:mapping:apply
```

7. Subir imagenes organizadas y actualizar DB:

```bash
npm run images:upload
```

8. Exportar catalogo actual de productos (ayuda para rellenar mapeo manual):

```bash
npm run images:catalog:export
```

## Archivos de reporte

- `Imagenes/Organizadas/_report/organizacion-imagenes.csv`
- `Imagenes/Organizadas/_report/organizacion-imagenes.json`
- `Imagenes/Organizadas/_report/mapeo-manual.csv`
- `Imagenes/Organizadas/_report/pendientes-clusters.csv`
- `Imagenes/Organizadas/_report/pendientes-clusters-summary.csv`
- `Imagenes/Organizadas/_report/mapeo-por-cluster.csv`
- `Imagenes/Organizadas/_report/productos-catalogo.csv`

## Notas

- El script crea/usa el bucket `product-images` en Supabase Storage.
- Se actualiza `products.image` y `products.images` por `name + category`.
- Si hay productos duplicados en DB con mismo `name + category`, se actualizan todos.
