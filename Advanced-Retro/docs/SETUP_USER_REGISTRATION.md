# Guía Completa: Configurar Registro & Autenticación en tu Tienda

Este documento te guía paso a paso para que el registro de usuarios funcione perfectamente en tu tienda (con email/contraseña y Google OAuth).

---

## Requisitos previos

- ✅ Proyecto Supabase creado
- ✅ Variables de entorno `.env.local` configuradas (ver [.env.local.example](.env.local.example))
- ✅ Next.js 14.2+ instalado
- ✅ Node.js 18+

---

## 1️⃣ Configuración de la Base de Datos

### A. Ejecutar el schema principal (una sola vez)

```bash
# En Supabase Dashboard, ve a: SQL Editor
# Copia y pega todo el contenido de:
# database/schema.sql

# Esto crea:
# - Tabla users
# - Trigger on_auth_user_created (crea usuario automáticamente)
# - Tabla products, orders, etc.
# - Índices y RLS básico
```

**Verificar que funcionó:**
```sql
SELECT name FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- Debe retornar: on_auth_user_created
```

---

### B. Añadir políticas RLS (Row Level Security)

```bash
# En Supabase SQL Editor, ejecuta:
# database/rls-policies.sql

# Esto permite que los usuarios:
# - Creen su propio perfil
# - Actualicen su perfil
# - Creen órdenes
```

**Verificar:**
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'users';
-- Debe retornar varias políticas
```

---

### C. Extender tabla users (opcional, pero recomendado)

Si quieres guardar nombre, avatar, dirección, etc. en los perfiles de usuario:

```bash
# En Supabase SQL Editor, ejecuta:
# database/extend-users-table.sql

# Esto añade columnas:
# - name
# - avatar_url
# - phone, address, city, country
# - updated_at
```

---

## 2️⃣ Configurar Google OAuth

Ver [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) para instrucciones detalladas.

**Resumen rápido:**
1. Crea app en Google Cloud Console
2. Obtén **Client ID** y **Client Secret**
3. Configura URIs de callback
4. Pega credenciales en Supabase → Authentication → Providers → Google

---

## 3️⃣ Variables de Entorno

Copia `.env.local.example` a `.env.local` y rellena:

```bash
cp .env.local.example .env.local
```

Contenido mínimo:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
```

**⚠️ IMPORTANTE:**
- Nunca commites `.env.local` (está en `.gitignore`)
- Rota las claves inmediatamente si las expones

---

## 4️⃣ Probar el flujo de registro

### A. En desarrollo local

```bash
# Instala dependencias
npm install

# Inicia el servidor
npm run dev

# Abre http://localhost:3000/login
```

### B. Prueba de registro con email/contraseña

1. Haz clic en **"Crear cuenta"**
2. Llena:
   - Email: `usuario@ejemplo.com`
   - Contraseña: `MiContraseña123!`
3. Haz clic en **"Crear cuenta"**

**Esperado:**
- ✅ Se crea la cuenta en `auth.users` (Supabase Auth)
- ✅ El trigger crea automáticamente una fila en la tabla `users`
- ✅ Si la verificación de email está habilitada, envía un correo

**Si falla:** Ver sección "Troubleshooting" abajo

### C. Prueba de login

1. Haz clic en **"Iniciar sesión"**
2. Usa las credenciales que creaste
3. Si funciona, serás redirigido a `/perfil`

### D. Prueba de Google OAuth

1. Haz clic en **"Continuar con Google"**
2. Login con tu cuenta de Google
3. Autoriza la app
4. Serás redirigido a `/perfil`

**Esperado:**
- ✅ Se crea cuenta con email de Google
- ✅ El trigger `on_auth_user_created` la añade a la tabla `users`
- ✅ Puedes ver tu perfil

---

## 5️⃣ Verificar en Supabase

Después de registrarte, verifica que todo esté bien:

### En `auth.users` (Authentication)

```
Supabase → Authentication → Users
→ Debe aparecer: usuario@ejemplo.com (o tu email de Google)
```

### En tabla `users` (Database)

```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 1;
-- Debe retornar tu usuario registrado
```

---

## 6️⃣ Crear usuario Admin

Una vez que el registro funciona, crea un admin:

```bash
npx tsx scripts/create-admin-user.ts
```

Esto crea:
- Email: `joel@admin.com`
- Contraseña: `Polo4455@4455`
- Rol: `admin`

Luego puedes:
- Iniciar sesión en `/login`
- Acceder a `/admin` para gestionar productos/imágenes

---

## 🐛 Troubleshooting

### ❌ Error: "Invalid request to /auth/v1/signup"

**Causa:** Las políticas RLS son demasiado restrictivas

**Solución:**
```bash
# Ejecuta database/rls-policies.sql en Supabase SQL Editor
```

---

### ❌ Error: "User already exists"

**Causa:** Ya existe un usuario con ese email

**Solución:**
1. Usa otro email
2. O elimina el usuario en Supabase → Authentication → Users → Delete

---

### ❌ El usuario se crea en auth pero NO en la tabla `users`

**Causa:** El trigger `on_auth_user_created` no se disparó

**Solucionar:**
1. Verifica que el trigger existe:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Si no existe, ejecuta `database/schema.sql` de nuevo
3. Si existe pero no funciona, verifica que el procedimiento existe:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

---

### ❌ Google OAuth abre un popup en blanco

**Causa:** Client ID incorrecto o URIs no registrados en Google Cloud

**Solucionar:**
1. Verifica Client ID en Supabase = Google Cloud Console
2. Asegúrate que `http://localhost:3000` está en **Authorized JavaScript origins**
3. Asegúrate que `http://localhost:3000/auth/callback` está en **Authorized redirect URIs**

---

### ❌ Error en `/perfil`: "Unauthorized"

**Causa:** El usuario no está autenticado o no tiene permiso para ver su perfil

**Solucionar:**
1. Cierra sesión y vuelve a iniciar
2. Verifica que la política RLS existe:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users' AND policyname = 'users can read own profile';
   ```

---

## 📋 Resumen de archivos confguración

| Archivo | Descripción | Cuándo usarlo |
|---------|-------------|---|
| `database/schema.sql` | Crea tablas y trigger principal | **Una sola vez** (nuevo proyecto) |
| `database/rls-policies.sql` | Añade políticas de seguridad | Si el registro falla |
| `database/extend-users-table.sql` | Añade columnas a tabla users | Opcional, si quieres más datos |
| `.env.local.example` | Plantilla variables de entorno | Copia y rellena en `.env.local` |
| `docs/GOOGLE_OAUTH_SETUP.md` | Configurar Google OAuth | Seguir paso a paso |
| `scripts/create-admin-user.ts` | Crear usuario admin | Después que registro funciona |

---

## ✅ Checklist de verificación

- [ ] Ejecuté `database/schema.sql` en Supabase
- [ ] Ejecuté `database/rls-policies.sql` en Supabase
- [ ] Configuré `.env.local` con claves Supabase
- [ ] Probé registro con email/contraseña
- [ ] Probé login con email/contraseña
- [ ] Ejecuté `scripts/create-admin-user.ts`
- [ ] Puedo ver `/admin` con usuario admin
- [ ] (Opcional) Configuré Google OAuth y funciona

---

## Próximos pasos

Una vez que el registro funciona:

1. **Actualizar imágenes de productos:**
   ```bash
   npx tsx scripts/update-product-images.ts --dry-run  # Simular
   npx tsx scripts/update-product-images.ts            # Real
   ```

2. **Rotar claves de Supabase** (si fueron expuestas)

3. **Configurar Stripe** para pagos (ver `docs/SETUP_STRIPE.md`)

4. **Publicar en Vercel** y configurar dominio custom

---

## ¿Preguntas?

Consulta los otros archivos en `docs/`:
- `SETUP_SUPABASE.md` - Configuración inicial de Supabase
- `GOOGLE_OAUTH_SETUP.md` - Detalle de Google OAuth
- `SETUP_STRIPE.md` - Pagos
- `DEPLOY_VERCEL.md` - Publicar la app
