-- Rollback Migration 003

BEGIN;
DROP TABLE IF EXISTS drivers CASCADE;
COMMIT;
