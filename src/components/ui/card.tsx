import * as React from "react"

import { cn } from "@/lib/utils"

/* ============================================
   CARD COMPONENT - Oro Azul Premium
   Superficies: Azul Muy Pálido (#F0F8FF)
   ============================================ */

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "border px-6 py-6 rounded-3xl transition-all duration-300 bg-card text-card-foreground border-border",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 pb-4",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-semibold text-lg leading-tight text-card-foreground", className)}
      style={{ letterSpacing: '-0.02em' }}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("pt-2", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center pt-4 border-t border-border", className)}
      {...props}
    />
  )
}

/* ============================================
   CARD VARIANTS - Oro Azul
   ============================================ */

/* Card con efecto hover */
function CardHover({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "border px-6 py-6 rounded-3xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer bg-card text-card-foreground border-border",
        className
      )}
      {...props}
    />
  )
}

/* Card tipo superficie (F0F8FF) */
function CardSurface({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "border px-6 py-6 rounded-3xl transition-all duration-300 bg-muted text-muted-foreground border-border",
        className
      )}
      {...props}
    />
  )
}

/* Card con gradiente sutil */
function CardGradient({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "border px-6 py-6 rounded-3xl transition-all duration-300 hover:shadow-lg bg-card text-card-foreground border-border",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardHover,
  CardSurface,
  CardGradient,
}
