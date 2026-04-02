-- Add fileData column for storing invoice files directly in PostgreSQL
ALTER TABLE "invoices" ADD COLUMN "fileData" bytea;