# TemaClaro-Oscuro Design Spec

## 1. Concept & Vision

Un toggle de tema elegante integrado en la barra superior junto al UserMenu. La transición entre temas es fluida y animada, sin saltos ni parpadeos (flash). El diseño mantiene la personalidad "Oro Azul Premium" del natatorio tanto en modo claro como oscuro.

## 2. Design Language

### Ubicación
- **Barra superior**, lado derecho, entre el botón de búsqueda y el UserMenu
- Visible en desktop y mobile

### Estética
- Icono Sun/Moon que rota 180° al cambiar
- Fondo circular sutil que aparece en hover (light mode: `rgba(0,168,232,0.12)`, dark mode: `rgba(240,248,255,0.1)`)
- Sin texto, solo icono de 20x20px

### Colores

| Modo   | Icono inactivo | Icono activo | Hover bg |
|--------|---------------|--------------|----------|
| Light  | `#4A5568` (slate-500) | `#005691` | `rgba(0,168,232,0.12)` |
| Dark   | `#8BA4BC` (slate-400) | `#00A8E8` | `rgba(240,248,255,0.1)` |

### Transición animada (300ms ease)
1. Icono rota 180° con `ease-in-out`
2. El fondo del toggle aparece con fade
3. El `html` recibe/retira la clase `.dark` — el CSS transitions en `globals.css` se encarga del resto de elementos (background, cards, texto, bordes, sombras)

### Persistencia
- `localStorage` key: `'theme'`
- Valores: `'light'` | `'dark'` | `'system'` (system = prefSistema)
- Default: `'system'`

## 3. Layout & Structure

```
Header bar (right side):
[search] [date] [ThemeToggle] [UserMenu]

Mobile:
[search] [date] [ThemeToggle] [avatar dropdown]
```

- ThemeToggle: `h-10 w-10 rounded-full` — mismo tamaño que otros icon-buttons del header
- En mobile <1024px no hay date label, el toggle sigue presente

## 4. Features & Interactions

### Interacciones
- **Click**: alterna light ↔ dark (no system desde el toggle directo)
- **Hover**: fondo suave aparece, icono se ilumina
- **Keyboard**: focus visible con ring

### Comportamiento
- Al cambiar tema, la clase `.dark` se agrega/retira del `<html>`
- Toasts (sonner) también reciben el tema correcto (ya integrado via `useTheme()` en sonner.tsx)
- NO hay "flash" de tema incorrecto al cargar — el script anti-flash se ejecuta sincronamente en `<head>`

### Excepciones de color
- **Sidebar**: tiene fondo con gradiente fijo en línea — ya está cubierto por CSS vars en `.dark`
- **Cards y popovers**:transicionan via `--card`, `--popover` CSS vars
- **Bordes y sombras**:transicionan via `--border`, `--shadow-*` CSS vars

## 5. Component Inventory

### `ThemeToggle` (new file: `src/components/ui/theme-toggle.tsx`)

**States:**
| State | Apariencia |
|-------|------------|
| Light + idle | Icono Sun (`#4A5568`), sin fondo |
| Light + hover | Icono Sun (`#005691`), fondo `rgba(0,168,232,0.12)` |
| Dark + idle | Icono Moon (`#8BA4BC`), sin fondo |
| Dark + hover | Icono Moon (`#00A8E8`), fondo `rgba(240,248,255,0.1)` |
| Focus | Ring `2px` offset `2px`, color `ring-primary/50` |

**Animación:** `transition-all duration-200` en el contenedor, `transition-transform duration-300` en el icono.

### Anti-flash script (inline `<script>` en `src\app\layout.tsx`)

```js
(function() {
  const stored = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.classList.add('dark')
  }
})()
```

Este script DEBE ir en el `<head>` ANTES de cualquier render para evitar el flash de tema incorrecto.

## 6. Technical Approach

### Dependencias necesarias
- `npm install next-themes` — ya presente en el proyecto (lo usa sonner.tsx)

### Estructura de archivos a crear/modificar

| Archivo | Acción |
|----------|--------|
| `src/components/ui/theme-toggle.tsx` | Crear — nuevo componente |
| `src/app/layout.tsx` | Modificar — inyectar script anti-flash en `<head>` |
| `src/app/globals.css` | Ya tiene CSS vars dark mode — verificar que transitions cubran todos los elementos |
| `src/components/layout/app-layout.tsx` | Modificar — importar y colocar ThemeToggle en header right side |
| `src/components/ui/sonner.tsx` | Ya usa `useTheme()` — verificar que funcione con `.dark` class |

### Flujo de datos
1. `ThemeToggle` llama `setTheme('dark'|'light')` de `next-themes`
2. `next-themes` actualiza `localStorage` y agrega/retira `.dark` del `<html>`
3. CSS vars en `globals.css` responden a `.dark` → transicionan colores suavemente
4. `sonner.tsx` lee `theme` de `useTheme()` → aplica al toast

### Archivos a crear
- `src/components/ui/theme-toggle.tsx`

### Archivos a modificar
- `src/app/layout.tsx` (inyectar script)
- `src/components/layout/app-layout.tsx` (agregar toggle al header)