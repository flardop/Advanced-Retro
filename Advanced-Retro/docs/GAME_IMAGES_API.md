# API de Imágenes de Juegos Retro

Esta guía explica cómo usar el sistema de búsqueda automática de imágenes de juegos retro para tu tienda ADVANCED RETRO.

## 🎯 Fuentes de Imágenes

El sistema busca imágenes desde múltiples fuentes:

1. **LibRetro CDN** (Recomendado) ⭐
   - ✅ Gratis, sin API key
   - ✅ Alta calidad
   - ✅ CDN rápido
   - URL: `https://thumbnails.libretro.com/`

2. **IGDB API** (Opcional)
   - ✅ Muy completa
   - ⚠️ Requiere cuenta Twitch + API key
   - ⚠️ Límites de rate limit
   - URL: `https://api.igdb.com/v4/`

3. **Splash! Games Directory** (Fallback)
   - ✅ Ya lo estás usando
   - ⚠️ Cobertura limitada
   - URL: `https://splash.games.directory/`

## 🚀 Uso Rápido

### Opción 1: Usar la API Route (Recomendado)

```typescript
// En tu código frontend o backend
const response = await fetch(
  '/api/games/images?gameName=Pokemon Red&platform=game-boy-color'
);
const data = await response.json();
// data.images[0].url contiene la URL de la imagen
```

### Opción 2: Usar la Librería Directamente

```typescript
import { getBestGameImage, searchGameImages } from '@/lib/gameImages';

// Obtener la mejor imagen disponible
const imageUrl = await getBestGameImage('Pokemon Red', 'game-boy-color');

// Obtener todas las imágenes encontradas
const results = await searchGameImages({
  gameName: 'Pokemon Red',
  platform: 'game-boy-color',
  preferSource: 'libretro', // 'libretro' | 'igdb' | 'splash'
});
```

### Opción 3: Actualizar Productos Automáticamente

Ejecuta el script para actualizar todos los productos existentes:

```bash
# Asegúrate de tener las variables de entorno configuradas
npx tsx scripts/update-product-images.ts
```

## ⚙️ Configuración

### Variables de Entorno (.env.local)

```env
# Requeridas (ya las tienes)
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_anon

# Opcional: Para usar IGDB API
IGDB_CLIENT_ID=tu_client_id_twitch
IGDB_CLIENT_SECRET=tu_client_secret_twitch
```

### Configurar IGDB API (Opcional)

Si quieres usar IGDB API para más cobertura:

1. Ve a [Twitch Developer Portal](https://dev.twitch.tv/console/apps)
2. Crea una nueva aplicación
3. Obtén tu `Client ID` y `Client Secret`
4. Agrega las variables de entorno:
   ```env
   IGDB_CLIENT_ID=tu_client_id
   IGDB_CLIENT_SECRET=tu_client_secret
   ```

**Nota:** IGDB es opcional. LibRetro funciona perfectamente sin configuración adicional.

## 📡 Endpoints de API

### GET /api/games/images

Busca imágenes para un juego específico.

**Parámetros:**
- `gameName` (requerido): Nombre del juego
- `platform` (opcional): `game-boy` | `game-boy-color` | `game-boy-advance` (default: `game-boy-color`)
- `preferSource` (opcional): `libretro` | `igdb` | `splash` (default: `libretro`)

**Ejemplo:**
```bash
curl "http://localhost:3020/api/games/images?gameName=Pokemon%20Red&platform=game-boy-color"
```

**Respuesta:**
```json
{
  "success": true,
  "gameName": "Pokemon Red",
  "platform": "game-boy-color",
  "images": [
    {
      "url": "https://thumbnails.libretro.com/...",
      "source": "libretro",
      "type": "boxart"
    }
  ],
  "count": 1
}
```

## 🔧 Integración con Productos

### Actualizar un Producto Individual

```typescript
import { getBestGameImage } from '@/lib/gameImages';
import { supabaseServer } from '@/lib/supabaseServer';

async function updateProductImage(productId: string, gameName: string) {
  const imageUrl = await getBestGameImage(gameName, 'game-boy-color');
  
  const supabase = supabaseServer();
  await supabase
    .from('products')
    .update({ images: [imageUrl] })
    .eq('id', productId);
}
```

### Crear Producto con Imagen Automática

```typescript
import { getBestGameImage } from '@/lib/gameImages';

async function createProductWithImage(name: string, ...otherFields) {
  const imageUrl = await getBestGameImage(name, 'game-boy-color');
  
  const supabase = supabaseServer();
  await supabase.from('products').insert({
    name,
    images: [imageUrl],
    ...otherFields,
  });
}
```

## 🎮 Plataformas Soportadas

- `game-boy`: Game Boy original (monocromo)
- `game-boy-color`: Game Boy Color (recomendado)
- `game-boy-advance`: Game Boy Advance

## 💡 Tips

1. **LibRetro es la mejor opción** para la mayoría de casos: gratis, rápido, sin configuración.

2. **Si no encuentras una imagen**, el sistema retorna `/placeholder.svg` automáticamente.

3. **El script de actualización** puede tardar varios minutos si tienes muchos productos. Es normal.

4. **Rate Limits**: 
   - LibRetro: Sin límites conocidos
   - IGDB: ~4 requests/segundo (tier gratuito)
   - El script incluye pausas automáticas

5. **Nombres de juegos**: Usa nombres en inglés para mejores resultados (ej: "Pokemon Red" en vez de "Pokémon Rojo").

## 🐛 Troubleshooting

### No encuentra imágenes

- Verifica que el nombre del juego esté en inglés
- Intenta diferentes variantes del nombre
- Revisa la consola del navegador/servidor para errores

### Error con IGDB

- Verifica que `IGDB_CLIENT_ID` y `IGDB_CLIENT_SECRET` estén configurados
- Asegúrate de que tu aplicación Twitch tenga 2FA habilitado
- Revisa los límites de rate limit

### Script de actualización falla

- Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurado (o usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Asegúrate de tener permisos de escritura en la tabla `products`
- Revisa los logs para errores específicos

## 📚 Recursos Adicionales

- [LibRetro Thumbnails](https://github.com/libretro/libretro-thumbnails)
- [IGDB API Docs](https://api-docs.igdb.com/)
- [Splash! Games Directory](https://splash.games.directory/)
