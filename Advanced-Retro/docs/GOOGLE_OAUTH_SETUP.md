# Configurar Google OAuth en Supabase + Next.js

## Paso 1: Crear aplicación en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto (o usa uno existente):
   - Haz clic en el selector de proyecto (arriba a la izquierda)
   - Selecciona "NEW PROJECT"
   - Nombre: "Advanced Retro" (o lo que prefieras)
   - Crea el proyecto

3. Ve a **APIs & Services** → **Credentials**

4. Haz clic en **Create Credentials** → **OAuth 2.0 Client IDs**
   - Si no está habilitada la API de OAuth 2.0, primero haz clic en **Enable APIs and Services**
   - Busca "Google+ API" o "OAuth 2.0 API" y habilítala

5. Selecciona tipo: **Web application**

6. Configura URIs autorizados:
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     https://localhost:3000
     https://tu-dominio-vercel.vercel.app
     https://tu-dominio-custom.com
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:3000/auth/callback
     https://tu-dominio-vercel.vercel.app/auth/callback
     https://tu-dominio-custom.com/auth/callback
     ```

7. Copia el **Client ID** y **Client Secret** (lo necesitarás en Supabase)

---

## Paso 2: Configurar Google OAuth en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/)

2. **Authentication** → **Providers**

3. Busca **Google** y haz clic en "Enable"

4. Pega el **Client ID** y **Client Secret** que obtuviste en Google Cloud Console

5. Guarda los cambios

6. Copia la URL de callback de Supabase (debe aparecer debajo del formulario):
   ```
   https://<tu-proyecto>.supabase.co/auth/v1/callback
   ```
   - Añade esta URL a **Authorized redirect URIs** en Google Cloud Console (si no la pusiste)

---

## Paso 3: Configurar variables de entorno (opcional, si usas IGDB)

En tu `.env.local` (o `.env.production` en Vercel), asegúrate de tener:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role>

# Optional: IGDB para mejores imágenes
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
```

---

## Paso 4: Probar el flujo de registro/login

1. Inicia la app:
   ```bash
   npm install
   npm run dev
   ```

2. Ve a http://localhost:3000/login

3. Prueba:
   - ✅ Crear cuenta con email/contraseña
   - ✅ Iniciar sesión con email/contraseña
   - ✅ Iniciar sesión con Google
   - ✅ Acceder a `/perfil` para ver tu perfil

---

## Paso 5: Aplicar políticas RLS (una sola vez)

Si el registro falla con error de permisos, ejecuta el SQL en `database/rls-policies.sql`:

1. Ve a tu proyecto Supabase → **SQL Editor**
2. Copia y pega el contenido de `database/rls-policies.sql`
3. Ejecuta (Ctrl+Enter o el botón "Run")

Esto añadirá las políticas necesarias para que los usuarios puedan:
- Crear su propio perfil
- Actualizar su perfil
- Crear órdenes

---

## Troubleshooting

### Error: "Invalid Client ID"
- Verifica que el Client ID en Supabase coincida exactamente con el de Google Cloud
- Los espacios/caracteres especiales importan

### Error: "Redirect URI mismatch"
- Asegúrate de que la URL de callback está registrada en Google Cloud Console
- Supabase proporciona una URL específica: `https://<proyecto>.supabase.co/auth/v1/callback`
- Añádela a Google Cloud

### El login con Google abre un popup en blanco
- Verifica que los orígenes JavaScript están registrados en Google Cloud Console
- Incluye `http://localhost:3000` para desarrollo local

### Los usuarios no aparecen en la tabla `users`
- El trigger `on_auth_user_created` debe estar activo
- Verifica en **SQL Editor** con:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```
- Si no existe, ejecuta `database/schema.sql` de nuevo

---

## Preguntas frecuentes

**P: ¿Por qué los usuarios se crean automáticamente en la tabla `users`?**
R: El trigger `on_auth_user_created` inserta automáticamente una fila en `users` cuando alguien se registra en `auth.users` (tabla de Supabase Auth).

**P: ¿Puedo cambiar el rol del usuario después del registro?**
R: Sí, pero solo con el `SUPABASE_SERVICE_ROLE_KEY` (desde el servidor). Los usuarios no pueden cambiar su propio rol.

**P: ¿Cómo hago admin a un usuario?**
R: Ejecuta en la DB:
```sql
UPDATE users SET role = 'admin' WHERE email = 'usuario@ejemplo.com';
```

**P: ¿Funciona Apple OAuth del mismo modo?**
R: Casi. Apple requiere más configuración (un Apple Developer Team). Por ahora, mantén Google y email/password como opciones principales.

---

## Próximos pasos

Después de verificar que el registro funciona:

1. (Opcional) Configura verificación de email obligatoria: Auth → Email
2. Prueba el script de crear admin: `npx tsx scripts/create-admin-user.ts`
3. Actualiza imágenes de productos: `npx tsx scripts/update-product-images.ts --dry-run`
