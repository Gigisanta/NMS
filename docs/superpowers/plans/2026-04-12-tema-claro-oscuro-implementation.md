# Tema Claro-Oscuro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar toggle de tema claro/oscuro en la barra superior con transición animada fluida y sin flash.

**Architecture:** Se usa `next-themes` (ya instalado) para manejo de tema. El `<html>` recibe la clase `.dark` que activa las CSS variables de dark mode definidas en `globals.css`. Un script inline en `<head>` previene flash leyendo localStorage antes del primer render.

**Tech Stack:** next-themes, Tailwind 4, CSS custom properties, framer-motion (para rotación del icono).

---

## File Map

| Archivo | Acción | Responsabilidad |
|---------|--------|----------------|
| `src/components/ui/theme-toggle.tsx` | Crear | Componente toggle con icono animado |
| `src/app/layout.tsx` | Modificar | Inyectar script anti-flash en `<head>` |
| `src/components/layout/app-layout.tsx` | Modificar | Integrar ThemeToggle en el header |

**No se tocan:** `globals.css` (CSS vars dark ya existen), `sonner.tsx` (ya usa useTheme).

---

## Tasks

### Task 1: Crear ThemeToggle component

**Files:**
- Create: `src/components/ui/theme-toggle.tsx`

- [ ] **Step 1: Escribir el componente completo**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar hydration mismatch — el toggle solo renderiza después de mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Placeholder estático durante SSR/hydration para evitar layout shift
    return (
      <div className="h-10 w-10 rounded-full" />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200',
        'hover:scale-105 active:scale-95',
        isDark
          ? 'hover:bg-[rgba(240,248,255,0.1)]'
          : 'hover:bg-[rgba(0,168,232,0.12)]'
      )}
      style={{
        color: isDark ? '#8BA4BC' : '#4A5568',
      }}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {/* Icono que rota 180° con transición */}
      <div className="relative w-5 h-5">
        <Sun
          className={cn(
            'absolute inset-0 w-5 h-5 transition-all duration-300 ease-in-out',
            !isDark ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180 scale-50'
          )}
          style={{ color: '#005691' }}
        />
        <Moon
          className={cn(
            'absolute inset-0 w-5 h-5 transition-all duration-300 ease-in-out',
            isDark ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180 scale-50'
          )}
          style={{ color: '#00A8E8' }}
        />
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/theme-toggle.tsx
git commit -m "feat: add ThemeToggle component with animated sun/moon icon"
```

---

### Task 2: Integrar ThemeToggle en AppLayout header

**Files:**
- Modify: `src/components/layout/app-layout.tsx:1-28` (imports)
- Modify: `src/components/layout/app-layout.tsx:387-404` (header right side)

- [ ] **Step 1: Agregar import del ThemeToggle**

Agregar después de los imports existentes (línea ~21):
```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle'
```

- [ ] **Step 2: Reemplazar el bloque derecho del header**

En `app-layout.tsx`, buscar el bloque que dice:
```tsx
{/* Right side */}
<div className="flex items-center gap-3 sm:gap-5">
  {/* Search en mobile */}
  ...
  <UserMenu />
</div>
```

Reemplazar con:
```tsx
{/* Right side */}
<div className="flex items-center gap-2 sm:gap-4">
  {/* Search en mobile */}
  <button
    className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
    style={{ color: '#005691' }}
    onClick={() => setCommandPaletteOpen(true)}
  >
    <Search className="w-4 h-4" />
  </button>
  <span
    className="hidden md:block text-sm font-medium"
    style={{ color: '#4A5568' }}
  >
    {dateLabel}
  </span>
  <ThemeToggle />
  <UserMenu />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/app-layout.tsx
git commit -m "feat: integrate ThemeToggle in header bar next to UserMenu"
```

---

### Task 3: Agregar script anti-flash en layout.tsx

**Files:**
- Modify: `src/app/layout.tsx:38-52`

- [ ] **Step 1: Agregar script inline anti-flash en el body**

El script debe ir ANTES de cualquier contenido. Se agrega como string en el archivo JSX:

En `layout.tsx`, modificar el `<html>` tag para agregar `suppressHydrationWarning` (ya tiene) y agregar el script como primer children del `<body>`:

```tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `
    (function() {
      try {
        var stored = localStorage.getItem('theme')
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (stored === 'dark' || (!stored && prefersDark)) {
          document.documentElement.classList.add('dark')
        }
      } catch (e) {}
    })()
  `

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Anti-flash: aplica tema antes del primer paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
```

**Nota:** No se usa `<Script>` de Next.js porque ese componente requiere hydrate/render y el script necesita ejecutarse en el head síncronamente para evitar el flash. Un `<script>` inline es la forma correcta.

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add anti-flash theme script in layout head"
```

---

### Task 4: Verificar transiciones CSS en globals.css

**Files:**
- Review: `src/app/globals.css:159-193` (base styles)

- [ ] **Step 1: Verificar que body tenga transición de colores**

En `@layer base body {}` agregar si no existe:
```css
transition: background-color 300ms ease, color 300ms ease
```

Verificar que los elementos principales (body, cards, sidebar, headers) tengan transiciones suaves. El spec dice que ya existen transiciones CSS para los componentes de shadcn/ui, pero verificamos que cubran todos los elementos visuales.

- [ ] **Step 2: Commit (solo si se hicieron cambios)**

Si se agregó algo en globals.css:
```bash
git add src/app/globals.css
git commit -m "style: ensure smooth color transitions in theme switch"
```

---

## Spec Coverage Check

| Requisito del spec | Task que lo cubre |
|--------------------|-------------------|
| Toggle en barra superior | Task 2 |
| Icono Sun/Moon con rotación 180° | Task 1 |
| Hover bg suave | Task 1 |
| Transición animada 300ms | Task 1 |
| Persistencia localStorage | Task 1 (next-themes lo maneja) |
| Script anti-flash en head | Task 3 |
| Tema claro y oscuro completos | Tasks 1-4 |

---

## Execution

**Option 1: Subagent-Driven (recommended)** — Dispatch fresh subagent per task, review between tasks.

**Option 2: Inline Execution** — Execute tasks in this session.

Which approach?