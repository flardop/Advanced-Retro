# Crear usuario admin y registro sin verificación de email

## 1. Registro automático en la base de datos

Cada usuario que se registre en la web **queda guardado en la base de datos** gracias al trigger que ya tienes en Supabase:

- Al registrarse (Auth → `auth.users`), se ejecuta el trigger `on_auth_user_created`.
- Ese trigger inserta una fila en `public.users` con el mismo `id`, `email` y `role = 'user'`.

No hace falta hacer nada más para que los usuarios queden en la base de datos.

---

## 2. Desactivar la verificación por correo (opcional)

Para que los usuarios puedan **registrarse y entrar sin confirmar el email**:

1. Entra en **Supabase** → tu proyecto.
2. **Authentication** → **Providers** → **Email**.
3. Desactiva **"Confirm email"** (o **"Enable email confirmations"**).
4. Guarda los cambios.

Así, al registrarse, la cuenta queda activa y pueden iniciar sesión de inmediato.  
Cuando quieras volver a pedir confirmación por correo, vuelve a activar esa opción.

---

## 3. Crear el usuario administrador

### Opción A: Script (recomendado)

Desde la raíz del proyecto (carpeta `Advanced-Retro`), con `.env.local` configurado:

```bash
npx tsx scripts/create-admin-user.ts
```

El script:

- Crea el usuario en Auth: **joel@admin.com** / **Polo4455@4455**
- Pone en `public.users` el rol **admin** para ese email.

Si el usuario ya existe, solo actualiza el rol a `admin`.

### Opción B: Manual en Supabase

1. **Authentication** → **Users** → **Add user**.
2. Email: `joel@admin.com`
3. Password: `Polo4455@4455`
4. **Create user**.

Luego en **SQL Editor** ejecuta:

```sql
update public.users
set role = 'admin'
where email = 'joel@admin.com';
```

---

## 4. Variables necesarias

En **.env.local** (y en Vercel si usas el script en deploy):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (para el script de crear admin; no la expongas en el front)

---

## Resumen

| Qué quieres | Dónde |
|-------------|--------|
| Que cada registro quede en la BD | Ya está con el trigger del schema |
| Que no pidan confirmar email | Supabase → Authentication → Providers → Email → desactivar "Confirm email" |
| Usuario admin joel@admin.com | Ejecutar `npx tsx scripts/create-admin-user.ts` o crearlo en Dashboard + SQL anterior |
