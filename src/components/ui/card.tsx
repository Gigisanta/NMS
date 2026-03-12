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
        "border px-6 py-6 transition-all duration-300",
        className
      )}
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 86, 145, 0.1)',
        boxShadow: '0 2px 8px rgba(0, 86, 145, 0.06), 0 4px 12px rgba(0, 86, 145, 0.04)',
      }}
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
      className={cn("font-semibold text-lg leading-tight", className)}
      style={{ 
        color: '#1A1A1A', 
        letterSpacing: '-0.02em' 
      }}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm", className)}
      style={{ color: '#4A5568' }}
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
      className={cn("flex items-center pt-4", className)}
      style={{ borderTop: '1px solid rgba(0, 86, 145, 0.08)' }}
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
        "border px-6 py-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        className
      )}
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 86, 145, 0.1)',
      }}
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
        "border px-6 py-6 transition-all duration-300",
        className
      )}
      style={{
        background: '#F0F8FF',
        border: '1px solid rgba(0, 168, 232, 0.15)',
        boxShadow: '0 2px 6px rgba(0, 86, 145, 0.04)',
      }}
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
        "border px-6 py-6 transition-all duration-300 hover:shadow-lg",
        className
      )}
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F8FF 100%)',
        border: '1px solid rgba(0, 168, 232, 0.12)',
        boxShadow: '0 4px 12px rgba(0, 86, 145, 0.08)',
      }}
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
