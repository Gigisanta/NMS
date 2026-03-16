# Plan: Mostrar Montos Personalizados en Dashboard

## Problema
El usuario asigna montos personalizados ($70,000, $35,000) a cada cliente en "Nuevo cliente" > "Suscripción", pero:
1. No hay campo de monto en el formulario
2. El dashboard muestra $0 porque usa precio por defecto
3. Necesita ver el monto asignado y poder modificarlo

## Objetivos
1. Agregar campo de monto en formulario de cliente
2. Guardar monto en suscripción 
3. Mostrar en dashboard el total por grupo usando montos reales
4. Mostrar monto en perfil de cliente

## Tareas

### Tarea 1: Agregar campo de monto al formulario
- Modificar `client-form.tsx` para incluir campo de monto en sección Suscripción
- Agregar input numérico con formato currency

### Tarea 2: Actualizar API de clientes
- Modificar POST/PUT en `/api/clients` para guardar `amount` en suscripción

### Tarea 3: Actualizar suscripciones existentes
- Script para copiar monto de mes anterior a mes actual

### Tarea 4: Verificar dashboard
- Confirmar que muestra totales correctos

## Tech
- Frontend: React/Next.js
- Backend: API Routes + Prisma
