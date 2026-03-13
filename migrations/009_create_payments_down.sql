-- Rollback Migration 009

BEGIN;
DROP TABLE IF EXISTS payments CASCADE;
COMMIT;
