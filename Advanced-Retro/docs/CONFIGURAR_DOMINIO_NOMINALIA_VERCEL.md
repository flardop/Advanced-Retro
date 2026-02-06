# Conectar advancedretro.es (Nominalia) a Vercel

Guía para que tu dominio **advancedretro.es** apunte a tu proyecto en Vercel.

---

## Parte 1: Configurar el dominio en Vercel

1. Entra en **[vercel.com](https://vercel.com)** → tu proyecto **Advanced-Retro**.
2. Ve a **Settings** (Configuración) → **Domains**.
3. En el campo **Add**, escribe: **`advancedretro.es`** y pulsa **Add**.
4. Vercel te mostrará qué registros DNS debes crear. Anota:
   - Para **advancedretro.es** (dominio raíz): suele pedir un **registro A** con valor **76.76.21.21** (o la IP que te indique Vercel).
   - Para **www.advancedretro.es**: suele pedir un **registro CNAME** con valor **cname.vercel-dns.com** (o el que te muestre Vercel).

5. Si quieres que tanto **advancedretro.es** como **www.advancedretro.es** funcionen, añade **los dos** en Vercel:
   - `advancedretro.es`
   - `www.advancedretro.es`

6. Deja la pestaña de Vercel abierta para copiar exactamente los valores que te pida.

---

## Parte 2: Configurar DNS en Nominalia

1. Entra en **[nominalia.com](https://www.nominalia.com)** con tu cuenta.
2. Ve a **Mis dominios** (o **Dominios**) y selecciona **advancedretro.es**.
3. Busca la sección **DNS**, **Zona DNS**, **Registros DNS** o **Gestión DNS** (el nombre puede variar).
4. **Añade los registros que Vercel te indicó:**

### Dominio raíz (advancedretro.es)

- **Tipo:** A  
- **Nombre / Host:** `@` o vacío o `advancedretro.es` (según lo que permita Nominalia).  
- **Valor / Apunta a:** **76.76.21.21** (o la IP que Vercel te haya dado para el dominio raíz).  
- **TTL:** 3600 o el que venga por defecto.

### Subdominio www (www.advancedretro.es)

- **Tipo:** CNAME  
- **Nombre / Host:** `www`  
- **Valor / Apunta a:** **cname.vercel-dns.com** (o el que Vercel te indique para www).  
- **TTL:** 3600 o el que venga por defecto.

5. **Guarda** los cambios en Nominalia.

---

## Parte 3: Comprobar en Vercel

1. Vuelve a **Vercel** → tu proyecto → **Settings** → **Domains**.
2. Al lado de **advancedretro.es** y **www.advancedretro.es** verás un estado:
   - **Valid Configuration**: todo correcto, solo hay que esperar propagación.
   - **Pending** / **Checking**: DNS aún propagándose (puede tardar hasta 24–48 h, a veces minutos).
   - Si sale **error** (por ejemplo "Invalid configuration"), Vercel suele indicar qué registro falla; revisa que en Nominalia hayas puesto **exactamente** el tipo, nombre y valor que Vercel pide.

3. Cuando el dominio esté **Valid**, Vercel asignará el certificado SSL (HTTPS) automáticamente.

---

## Errores frecuentes y qué revisar

| Error / Situación | Qué hacer |
|-------------------|------------|
| **Invalid configuration** | Comprueba en Nominalia que el **tipo** (A o CNAME), el **nombre** (@ o www) y el **valor** (IP o cname.vercel-dns.com) coincidan con lo que dice Vercel. |
| **Solo funciona www** o **solo el dominio sin www** | Asegúrate de tener **los dos** dominios añadidos en Vercel y los dos registros en Nominalia (A para raíz, CNAME para www). |
| **Sigue en Pending** | La propagación DNS puede tardar hasta 48 h. Espera y vuelve a comprobar; a veces en 10–30 minutos ya está. |
| **SSL / certificado** | No hace falta configurar nada extra; cuando el dominio esté bien en Vercel, el HTTPS se activa solo. |

---

## Resumen rápido

1. **Vercel** → Settings → Domains → Añadir **advancedretro.es** y **www.advancedretro.es**.
2. **Nominalia** → DNS del dominio → Crear **A** para el raíz (IP de Vercel) y **CNAME** para **www** (cname.vercel-dns.com).
3. Esperar propagación y comprobar en Vercel que pase a **Valid Configuration**.

Cuando esté validado, entra en **https://advancedretro.es** y deberías ver tu tienda. Si me dices el mensaje de error exacto que te sale en Vercel (o una captura), te digo el paso concreto a corregir.
