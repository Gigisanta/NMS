# Sistema de Historial de Comprobantes y Gastos

**Fecha:** 2026-04-13
**Estado:** Pendiente de revisión

---

## 1. Resumen

Sistema de historial de comprobantes para pagos y gastos, organizado por mes, con tabla cronológica y posibilidad de adjuntar archivos (PDF, imágenes) a cada registro.

---

## 2. two Módulos

### Módulo A: Historial de Comprobantes de Pagos (por cliente)

**Ubicación:** `client-profile.tsx`, pestaña "Facturas"

**Lo que ya existe:**
- `InvoiceUpload` component muestra invoices del cliente
- Receipt upload via `ReceiptUploadDialog`

**Lo que se mejora:**
- Tabla cronológica de comprobantes agrupados por mes/año
- Estados: PENDING → VERIFIED / REJECTED
- Link a subscriptionId para saber qué mes corresponde

### Módulo B: Gastos con Comprobantes (nuevo)

**Ubicación:** `expenses-view.tsx` y `expense-form.tsx`

**Modelo Prisma - agregar a Expense:**
```prisma
receiptId   String?  @unique  // FK a Invoice
receiptStatus String  @default("PENDING")  // PENDING, VERIFIED, REJECTED
```

**Agregar a ExpenseForm:**
- Botón "Adjuntar comprobante" que abre diálogo de upload genérico
- Si tiene comprobante: mostrar nombre archivo + estado + acciones

---

## 3. Componente Compartido: ReceiptUploader

**Archivo:** `src/components/ui/receipt-uploader.tsx`

Componente genérico reutilizable:
- Drag & drop o click para subir
- Preview de imagen/PDF
- Estados: idle, uploading, success, error
- Se usa en: `receipt-upload-dialog.tsx` (pagos) y nuevo en gastos

---

## 4. Tabla de Historial de Gastos

**Ubicación:** `expenses-view.tsx` — nueva sección debajo de stats

**Columnas:**
| Fecha | Descripción | Categoría | Monto | Comprobante | Estado | Acciones |

**Filtros:** mes/año, categoría

**Estados de comprobante:** PENDING (naranja), VERIFIED (verde), REJECTED (rojo)

**Acciones por fila:**
- Ver comprobante ( abre modal/descarga)
- Marcar como verificado/rechazado
- Eliminar comprobante

---

## 5. API Changes

### PATCH `/api/expenses/[id]`
Agregar body:
```json
{
  "receiptId": "cuid",
  "receiptStatus": "VERIFIED"
}
```

### GET `/api/expenses`
Incluir `receipt: Invoice` en la respuesta (join)

### POST `/api/invoices`
Ya existe, funciona para receipts de gastos también

### GET `/api/invoices/[id]/file`
Ya existe, sirve para descargar cualquier comprobante

---

## 6. Archivos a Modificar/Crear

| Archivo | Acción |
|---------|--------|
| `prisma/schema.prisma` | Agregar campos receiptId, receiptStatus a Expense |
| `src/components/ui/receipt-uploader.tsx` | Crear componente genérico |
| `src/components/modules/expenses/expense-form.tsx` | Agregar upload comprobante |
| `src/components/modules/expenses-view.tsx` | Agregar sección historial con tabla |
| `src/components/modules/client-profile.tsx` | Mejorar historial de comprobantes |

---

## 7. Dependencias Externas

Ninguna nueva. Usa infraestructura existente:
- Almacenamiento de archivos en PostgreSQL (bytea)
- API de invoices existente
- UI components shadcn existentes

---

## 8. Out of Scope

- Sistema de automatización de ARCA/billing (ya existe)
- Notificaciones por email
- Reportes exportables a PDF
- Múltiples comprobantes por gasto (uno solo)