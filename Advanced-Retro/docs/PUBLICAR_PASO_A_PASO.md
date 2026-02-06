# Publicar la página web – Paso a paso

Guía para dejar tu tienda ADVANCED RETRO en línea usando **GitHub** + **Vercel** (gratis para empezar).

---

## Resumen de pasos

1. Crear `.gitignore` y comprobar que el proyecto compila.
2. Crear cuenta en GitHub y subir el código.
3. Crear cuenta en Vercel y conectar el repositorio.
4. Añadir variables de entorno en Vercel.
5. Configurar Supabase para producción (URLs).
6. Hacer el primer deploy y probar la URL.
7. (Opcional) Dominio propio y Stripe en producción.

---

## Paso 1: Preparar el proyecto en tu ordenador

### 1.1 Tener Git instalado

- En Mac: abre Terminal y escribe `git --version`. Si no está, instala desde [git-scm.com](https://git-scm.com/).

### 1.2 Comprobar que el build funciona

En la carpeta del proyecto (`tienda-web`) ejecuta:

```bash
npm run build
```

Si termina sin errores, puedes seguir. Si falla, corrige los errores antes de publicar.

### 1.3 No subir secretos

El proyecto ya incluye un archivo **`.gitignore`** para no subir:

- `node_modules/`
- `.next/`
- **`.env.local`** (aquí están tus claves; no debe ir a GitHub)

No borres ni subas `.env.local`. En producción usarás las variables en Vercel.

---

## Paso 2: Crear cuenta en GitHub y subir el código

### 2.1 Crear cuenta en GitHub

1. Entra en [github.com](https://github.com/) y haz clic en **Sign up**.
2. Crea tu cuenta (email, contraseña, nombre de usuario).

### 2.2 Crear un repositorio nuevo

1. Una vez dentro, clic en **+** (arriba derecha) → **New repository**.
2. **Repository name**: por ejemplo `tienda-web` o `advanced-retro`.
3. Elige **Private** si no quieres que el código sea público (recomendado al tener claves en Vercel, no en el repo).
4. No marques "Add a README" (ya tienes código).
5. Clic en **Create repository**.

### 2.3 Subir el proyecto desde tu ordenador

Abre la **Terminal**, ve a la carpeta del proyecto y ejecuta (sustituye `TU_USUARIO` por tu usuario de GitHub y `tienda-web` por el nombre del repo si lo cambiaste):

```bash
cd /Users/joelrivera/tienda-web

git init
git add .
git commit -m "Primera subida - tienda ADVANCED RETRO"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/tienda-web.git
git push -u origin main
```

Te pedirá usuario y contraseña de GitHub. Si usas **contraseña**, en GitHub activa antes **Settings → Developer settings → Personal access tokens** y usa un token en lugar de la contraseña. O usa **GitHub Desktop** para hacer el push con la interfaz gráfica.

Cuando termine, en GitHub deberías ver todos los archivos del proyecto (sin `node_modules` ni `.env.local`).

---

## Paso 3: Crear cuenta en Vercel y conectar el repo

### 3.1 Crear cuenta en Vercel

1. Entra en [vercel.com](https://vercel.com/).
2. Clic en **Sign Up**.
3. Elige **Continue with GitHub** y autoriza a Vercel a acceder a tus repositorios.

### 3.2 Importar el proyecto

1. En el panel de Vercel, clic en **Add New…** → **Project**.
2. En la lista verás los repos de GitHub. Elige **tienda-web** (o el nombre que pusiste).
3. Clic en **Import**.

### 3.3 Configuración del proyecto (primera pantalla)

- **Framework Preset**: debe detectar **Next.js**.
- **Root Directory**: déjalo en blanco (o `.`).
- **Build Command**: `npm run build` (por defecto).
- **Output Directory**: `.next` (por defecto para Next.js).
- **Install Command**: `npm install` (por defecto).

No hagas clic en **Deploy** todavía; primero añade las variables de entorno.

---

## Paso 4: Añadir variables de entorno en Vercel

Antes del primer deploy, en la misma pantalla de Vercel baja hasta **Environment Variables**.

Añade **una por una** estas variables (los valores los copias de tu `.env.local`; en producción la URL será la de Vercel, ver paso 4.5):

| Nombre | Valor | Dónde lo tienes |
|--------|--------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Tu proyecto Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clave "anon" pública | Mismo sitio |
| `SUPABASE_SERVICE_ROLE_KEY` | La clave "service_role" (secreta) | Mismo sitio |

**Importante:**  
- **No** subas `.env.local` a GitHub.  
- En **Vercel** pon la URL de producción cuando la tengas (paso 4.5).

### 4.5 URL del sitio en producción

En el **primer deploy**, Vercel te dará una URL como:

`https://tienda-web-xxxxx.vercel.app`

Cuando tengas esa URL:

1. Vuelve a **Vercel** → tu proyecto → **Settings** → **Environment Variables**.
2. Añade (o edita) esta variable:
   - **Name:** `NEXT_PUBLIC_SITE_URL`
   - **Value:** `https://tienda-web-xxxxx.vercel.app` (la URL que te dio Vercel)
   - **Environment:** Production (y si quieres también Preview).

Sin esta variable, los enlaces de “volver al sitio” después del login o del pago pueden fallar.

Si usas **Stripe**, añade también en Vercel:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (el del webhook de producción; ver paso 7).

Cuando termines de añadir variables, haz clic en **Deploy**.

---

## Paso 5: Configurar Supabase para producción

Para que login, registro y “Continuar con Google/Apple” funcionen en la URL pública:

1. Entra en [Supabase Dashboard](https://dashboard.supabase.com) → tu proyecto.
2. **Authentication** → **URL Configuration**.
3. **Site URL**: pon la URL de Vercel, por ejemplo  
   `https://tienda-web-xxxxx.vercel.app`
4. **Redirect URLs**: añade (una línea por URL):
   - `https://tienda-web-xxxxx.vercel.app`
   - `https://tienda-web-xxxxx.vercel.app/auth/callback`
5. Guarda.

Así Supabase aceptará redirecciones desde tu dominio de Vercel.

---

## Paso 6: Probar la página publicada

1. En Vercel, cuando el deploy termine, haz clic en **Visit** (o abre la URL que te muestra).
2. Prueba:
   - Ver la home y la tienda.
   - Crear cuenta / Iniciar sesión (email o Google/Apple si los tienes configurados).
   - Añadir producto al carrito (el checkout con Stripe solo funcionará bien cuando configures el webhook de producción; ver paso 7).

Si algo falla, revisa la pestaña **Deployments** en Vercel y los **logs** del último deploy para ver errores de build o de variables de entorno.

---

## Paso 7: (Opcional) Stripe en producción

Para que los pagos funcionen en la web publicada:

1. En [Stripe Dashboard](https://dashboard.stripe.com/) → **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL**: `https://tienda-web-xxxxx.vercel.app/api/stripe/webhook`
3. Eventos: por ejemplo `checkout.session.completed` (y los que use tu API).
4. Crea el endpoint y copia el **Signing secret**.
5. En **Vercel** → **Settings** → **Environment Variables** añade o edita:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** el signing secret del webhook de **producción** (no el de localhost).
6. Redespliega el proyecto en Vercel (Deployments → los tres puntos del último deploy → Redeploy) para que cargue la nueva variable.

---

## Paso 8: (Opcional) Dominio propio

Si quieres usar un dominio como `www.tudominio.com`:

1. En Vercel → tu proyecto → **Settings** → **Domains**.
2. Añade tu dominio (ej. `www.tudominio.com`) y sigue las instrucciones (DNS).
3. En **Supabase** → **URL Configuration** actualiza **Site URL** y **Redirect URLs** a `https://www.tudominio.com` y `https://www.tudominio.com/auth/callback`.
4. En **Vercel** → **Environment Variables** cambia `NEXT_PUBLIC_SITE_URL` a `https://www.tudominio.com`.
5. Si usas Stripe, en el webhook de Stripe añade/usa la URL `https://www.tudominio.com/api/stripe/webhook` y el secret correspondiente.

---

## Checklist rápido

- [ ] `npm run build` funciona en tu carpeta.
- [ ] Proyecto subido a GitHub (sin `.env.local` ni `node_modules`).
- [ ] Proyecto importado en Vercel desde GitHub.
- [ ] Variables de entorno en Vercel: Supabase (y Stripe si aplica).
- [ ] Tras el primer deploy, `NEXT_PUBLIC_SITE_URL` = URL de Vercel.
- [ ] En Supabase: Site URL y Redirect URLs con la URL de Vercel (y `/auth/callback`).
- [ ] Probado: home, tienda, login/registro, y si aplica checkout.

Cuando todo esto esté hecho, tu página estará publicada y accesible desde la URL que te da Vercel (y desde tu dominio si configuraste el paso 8).
