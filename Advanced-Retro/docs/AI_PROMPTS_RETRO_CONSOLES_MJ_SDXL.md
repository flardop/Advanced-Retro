# Advanced Retro · Prompt Pack Consolas (Midjourney + SDXL)

Fecha: 2026-03-12  
Uso: generar imagenes de catalogo con estilo consistente para consolas retro.

---

## 1) Bloque global obligatorio

### Negative prompt global (usar siempre)

```
deformed, distorted, warped geometry, wrong proportions, duplicated console, extra buttons, broken controller, melted plastic, lowres, blurry, noise, watermark, logo text, cropped product, hands, people, background clutter
```

### Estilo fijo (usar siempre)

```
studio product photo, dark navy + purple retro neon background, cyan rim light, soft reflection on clean surface, centered composition, e-commerce catalog style, ultra sharp, realistic materials, no text
```

---

## 2) Prompts base por consola (master)

### Consola Game Boy DMG-01

```
Consola Game Boy DMG-01, frontal 3/4 view, full body visible, iconic gray shell, clean buttons and screen proportions, studio product photo, dark navy + purple retro neon background, cyan rim light, soft reflection on clean surface, centered composition, e-commerce catalog style, ultra sharp, realistic materials, no text
```

### Consola Game Boy Color

```
Consola Game Boy Color, frontal 3/4 view, full body visible, translucent retro shell look, accurate button layout and screen ratio, studio product photo, dark navy + purple retro neon background, cyan rim light, soft reflection on clean surface, centered composition, e-commerce catalog style, ultra sharp, realistic materials, no text
```

### Consola Game Boy Advance

```
Consola Game Boy Advance, frontal 3/4 view, horizontal handheld shape, correct triggers and button geometry, studio product photo, dark navy + purple retro neon background, cyan rim light, soft reflection on clean surface, centered composition, e-commerce catalog style, ultra sharp, realistic materials, no text
```

### Consola Super Nintendo PAL

```
Consola Super Nintendo PAL with controller, console centered and complete, correct cartridge slot and rounded body, studio product photo, dark navy + purple retro neon background, cyan rim light, soft reflection on clean surface, centered composition, e-commerce catalog style, ultra sharp, realistic materials, no text
```

### Consola Nintendo GameCube

```
Consola Nintendo GameCube with controller, cube body and handle clearly visible, correct ports and proportions, studio product photo, dark navy + purple retro neon background, cyan rim light, soft reflection on clean surface, centered composition, e-commerce catalog style, ultra sharp, realistic materials, no text
```

### Consola Game Boy Light Gold (Edicion especial JP)

```
Consola Game Boy Light Gold special edition, premium gold finish, full handheld visible, accurate retro details and proportions, studio product photo, dark navy + purple retro neon background, cyan rim light, soft reflection on clean surface, centered composition, e-commerce catalog style, ultra sharp, realistic materials, no text
```

### Consola Game Boy Color Pikachu (Edicion especial)

```
Consola Game Boy Color Pikachu special edition, yellow themed shell, clean authentic-like special edition details, full handheld visible, studio product photo, dark navy + purple retro neon background, cyan rim light, soft reflection on clean surface, centered composition, e-commerce catalog style, ultra sharp, realistic materials, no text
```

### Consola Game Boy Advance SP NES Classic (Edicion especial)

```
Consola Game Boy Advance SP NES Classic special edition, clamshell open position, screen and controls perfectly aligned, accurate hinge geometry, studio product photo, dark navy + purple retro neon background, cyan rim light, soft reflection on clean surface, centered composition, e-commerce catalog style, ultra sharp, realistic materials, no text
```

### Consola Super Famicom Jr (Edicion especial Japon)

```
Consola Super Famicom Jr special edition Japan, compact SNES-style body with controller, full product visible, clean plastic edges and correct proportions, studio product photo, dark navy + purple retro neon background, cyan rim light, soft reflection on clean surface, centered composition, e-commerce catalog style, ultra sharp, realistic materials, no text
```

### Consola Panasonic Q (Edicion especial GameCube)

```
Consola Panasonic Q special edition GameCube/DVD style, metallic body, front loading tray details, one controller included, full product visible, studio product photo, dark navy + purple retro neon background, cyan rim light, soft reflection on clean surface, centered composition, e-commerce catalog style, ultra sharp, realistic materials, no text
```

---

## 3) Formato exacto Midjourney (copy/paste)

Parametros estables recomendados para consistencia:

- `--ar 4:5`
- `--v 6`
- `--stylize 120`
- `--chaos 0`
- `--seed 424242`

Plantilla MJ:

```
[PROMPT_BASE], no text --ar 4:5 --v 6 --stylize 120 --chaos 0 --seed 424242
```

Ejemplo (Game Boy DMG):

```
Consola Game Boy DMG-01, frontal 3/4 view, full body visible, iconic gray shell, clean buttons and screen proportions, studio product photo, dark navy + purple retro neon background, cyan rim light, soft reflection on clean surface, centered composition, e-commerce catalog style, ultra sharp, realistic materials, no text, no text --ar 4:5 --v 6 --stylize 120 --chaos 0 --seed 424242
```

Nota: Midjourney no usa negative prompt igual que SDXL. Para evitar defectos, ya estan forzados por estilo y parametros estables.

---

## 4) Formato exacto SDXL (copy/paste)

Ajustes recomendados SDXL:

- `Width: 1024`
- `Height: 1280`
- `Steps: 35`
- `CFG: 6.0`
- `Sampler: DPM++ 2M Karras`
- `Seed: 424242`

Plantilla SDXL:

### Positive prompt

```
[PROMPT_BASE]
```

### Negative prompt

```
deformed, distorted, warped geometry, wrong proportions, duplicated console, extra buttons, broken controller, melted plastic, lowres, blurry, noise, watermark, logo text, cropped product, hands, people, background clutter
```

---

## 5) Recomendaciones para mantener calidad de catalogo

1. Generar 4 variaciones por consola con seeds: `424242`, `424243`, `424244`, `424245`.  
2. Elegir solo imagenes con consola completa y geometria limpia.  
3. Mantener mismo ratio (`4:5`) en toda la tienda para coherencia visual.  
4. Evitar recortes manuales agresivos (mejor regenerar).  
5. Exportar final en WebP (85-90 calidad) para rendimiento.

