# Guía: Configurar Vercel para que funcione con Supabase

## El Problema

Tu proyecto funciona **localmente** (`npm run dev`) porque tienes `.env.local` configurado. Pero **Vercel no tiene acceso a ese archivo** — necesita que configures las variables en el dashboard de Vercel.

---

## Solución: Configurar Environment Variables en Vercel

### Paso 1: Obtén tus valores de Supabase

Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com/):

1. **Settings** → **API** (esquina inferior izquierda)

2. Copia estos valores:
   ```
   Project URL: https://darrmonhygphreshbplz.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcnJtb25oeWdwaHJlc2hicGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDA2NTEsImV4cCI6MjA4NTYxNjY1MX0.u5HNKSsZz48pKWgo8CvYZ74xoOxIST8A0Ke4uIlKOho
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcnJtb25oeWdwaHJlc2hicGx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA0MDY1MSwiZXhwIjoyMDg1NjE2NjUxfQ.CJqOAv_o1qzdZK00D5zeCYRZue5nOZ37QhBOo8g3xlc
   ```

---

### Paso 2: Configura en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)

2. Selecciona tu proyecto **Advanced-Retro** (o el que uses)

3. **Settings** → **Environment Variables**

4. **Añade cada variable:**

#### Variable 1:
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://darrmonhygphreshbplz.supabase.co
Environments: Production, Preview, Development
```
→ Haz clic en "Add"

#### Variable 2:
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcnJtb25oeWdwaHJlc2hicGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDA2NTEsImV4cCI6MjA4NTYxNjY1MX0.u5HNKSsZz48pKWgo8CvYZ74xoOxIST8A0Ke4uIlKOho
Environments: Production, Preview, Development
```
→ Haz clic en "Add"

#### Variable 3:
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcnJtb25oeWdwaHJlc2hicGx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA0MDY1MSwiZXhwIjoyMDg1NjE2NjUxfQ.CJqOAv_o1qzdZK00D5zeCYRZue5nOZ37QhBOo8g3xlc
Environments: Production, Preview, Development
```
→ Haz clic en "Add"

#### Variable 4 (opcional, pero recomendado):
```
Name: NEXT_PUBLIC_SITE_URL
Value: https://tu-proyecto-vercel.vercel.app   (o tu dominio custom)
Environments: Production
```
→ Haz clic en "Add"

---

### Paso 3: Redeploy

1. Ve a la pestaña **Deployments**

2. Busca el último deployment (probablemente dice "Failed")

3. Haz clic en los **3 puntos** → **Redeploy**

4. Espera a que termine (2-5 minutos)

---

### Paso 4: Verifica que funciona

1. Abre `https://tu-proyecto-vercel.vercel.app` (o tu dominio custom)

2. Intenta:
   - ✅ Registrarte (`/login` → "Crear cuenta")
   - ✅ Iniciar sesión
   - ✅ Acceder a `/perfil`
   - ✅ Ir a `/tienda` (debe cargar productos)

Si todo funciona, ¡listo!

---

## ⚠️ Notas importantes

### "Environments"
- **Production**: La URL pública en `vercel.app`
- **Preview**: PRs y ramas adicionales
- **Development**: Para testing local (no necesario para Vercel)

Es recomendable marcar los 3 para que funcione en todos lados.

### Si copias/pegas y ve "Invalid format"
- Asegúrate de que **NO haya espacios** al principio o final
- Los JWT son muy largos — verifica que la copia esté completa

### Diferencia entre variables
- Prefijo **`NEXT_PUBLIC_`** = visible en el cliente (OK, no contiene secretos)
- Sin prefijo = solo servidor (seguro para secretos)

---

## Checklist

- [ ] Obtuve valores de Supabase → Settings → API
- [ ] Creé 3 Environment Variables en Vercel
- [ ] Marqué los 3 environments (Production, Preview, Development)
- [ ] Hice Redeploy desde "Deployments"
- [ ] Esperé 2-5 minutos
- [ ] Probé `/login` → "Crear cuenta"
- [ ] Probé `/perfil`

---

## Si aún falla

Dime:
1. ¿Qué error ves en Vercel Deployments → Logs?
2. ¿Funciona localmente (`npm run dev`)?
3. ¿Qué URL intentas acceder?

Los logs exactos me ayudan a diagnosticar.
