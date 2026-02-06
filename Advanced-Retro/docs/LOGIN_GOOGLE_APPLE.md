# Login con Google y Apple (OAuth)

Tu app ya tiene los botones "Continuar con Google" y "Continuar con Apple". Para que funcionen hay que configurar los proveedores en **Supabase** y crear las credenciales en **Google Cloud** y **Apple Developer**.

---

## 1. Configuración común en Supabase

1. Entra en [Supabase Dashboard](https://dashboard.supabase.com) → tu proyecto.
2. Ve a **Authentication** → **URL Configuration**.
3. Asegúrate de tener:
   - **Site URL**: `http://localhost:3020` (desarrollo) o tu URL de producción (ej. `https://tudominio.com`).
   - **Redirect URLs**: añade:
     - `http://localhost:3020/auth/callback`
     - Y en producción: `https://tudominio.com/auth/callback`

Sin esto, Google y Apple redirigirán a una URL que Supabase no acepta y fallará el login.

---

## 2. Login con Google

### 2.1 Crear credenciales en Google Cloud

1. Entra en [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto o elige uno existente.
3. Ve a **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
4. Si te pide configurar la pantalla de consentimiento:
   - **User type**: External (o Internal si es solo para tu organización).
   - Completa nombre de la app, email de soporte, etc.
   - En **Scopes** añade: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
   - Guarda.
5. En **Application type** elige **Web application**.
6. **Name**: por ejemplo "ADVANCED RETRO".
7. **Authorized JavaScript origins**:
   - `http://localhost:3020`
   - En producción: `https://tudominio.com`
8. **Authorized redirect URIs** (muy importante):
   - Copia la URL que te da Supabase. En el Dashboard: **Authentication** → **Providers** → **Google** → ahí verás algo como:
   - `https://XXXXXXXX.supabase.co/auth/v1/callback`
   - Pega **esa URL exacta** en "Authorized redirect URIs" en Google Cloud.
9. Crea el cliente. Copia el **Client ID** y el **Client Secret**.

### 2.2 Configurar Google en Supabase

1. En Supabase: **Authentication** → **Providers** → **Google**.
2. Activa **Enable Sign in with Google**.
3. Pega el **Client ID** y el **Client Secret** de Google.
4. Guarda.

Prueba en tu app: "Continuar con Google". Debería abrir la ventana de Google y al aceptar volver a tu sitio ya logueado.

---

## 3. Login con Apple

### 3.1 Requisitos

- Cuenta de [Apple Developer](https://developer.apple.com/) (de pago, ~99 €/año).
- Sin cuenta de desarrollador no puedes usar "Sign in with Apple" en producción.

### 3.2 Crear configuración en Apple Developer

1. Entra en [Apple Developer](https://developer.apple.com/account/) → **Certificates, Identifiers & Profiles**.
2. **Identifiers** → **+** → **Services IDs** → Continue.
3. **Description**: "ADVANCED RETRO" (o el nombre de tu app).
4. **Identifier**: por ejemplo `com.tudominio.advancedretro` (único).
5. Marca **Sign In with Apple** → Configure:
   - **Primary App ID**: elige tu App ID (o crea uno).
   - **Domains and Subdomains**: en desarrollo puedes usar un dominio de prueba; en producción tu dominio (ej. `tudominio.com`).
   - **Return URLs**: debe ser la URL de callback de Supabase:
     - `https://XXXXXXXX.supabase.co/auth/v1/callback`
     - (La ves en Supabase → Authentication → Providers → Apple.)
6. Guarda el Services ID.

4. Crear una **Key** para Sign in with Apple:
   - **Keys** → **+** → nombre "Supabase Apple Key".
   - Marca **Sign In with Apple** → Configure → elige tu Primary App ID.
   - Register y **Download** la clave (.p8). Solo se puede descargar una vez; guárdala.
   - Anota el **Key ID** y el **Services ID** (y el **Team ID** y **Client ID** que uses).

5. En Supabase necesitas:
   - **Services ID** (identifier del Services ID, ej. `com.tudominio.advancedretro`).
   - **Secret**: un JWT generado con la clave .p8. Supabase tiene en su doc cómo generarlo, o puedes usar [esta herramienta](https://supabase.com/docs/guides/auth/social-login/auth-apple#generate-the-client-secret) o generar el JWT con la clave privada, el Key ID, el Team ID y el Client ID (App Bundle ID o Services ID según lo que pida Supabase).

### 3.3 Configurar Apple en Supabase

1. En Supabase: **Authentication** → **Providers** → **Apple**.
2. Activa **Enable Sign in with Apple**.
3. Rellena:
   - **Services ID** (el identifier del Services ID de Apple).
   - **Secret**: el JWT generado con tu clave .p8 (Team ID, Key ID, Client ID/App Bundle ID y clave privada).
4. Guarda.

Documentación oficial de Supabase para Apple:  
[https://supabase.com/docs/guides/auth/social-login/auth-apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)

---

## 4. Resumen rápido

| Dónde | Qué hacer |
|-------|-----------|
| **Supabase → URL Configuration** | Site URL y Redirect URLs con `http://localhost:3020` y `/auth/callback` (y tu dominio en producción). |
| **Google Cloud** | Crear OAuth client (Web), poner en redirect URIs la URL de callback de Supabase (`https://xxx.supabase.co/auth/v1/callback`). |
| **Supabase → Providers → Google** | Activar Google y pegar Client ID y Client Secret. |
| **Apple Developer** | Crear Services ID, configurar Sign in with Apple, crear Key, generar JWT (secret). |
| **Supabase → Providers → Apple** | Activar Apple y pegar Services ID y Secret (JWT). |

Tu app ya redirige a `/auth/callback` tras el login; ese callback intercambia el código por sesión y deja al usuario logueado. No hace falta poner Google/Apple credentials en `.env.local`: todo se configura en el Dashboard de Supabase.
