-- Rollback Migration 004

BEGIN;
DROP TABLE IF EXISTS vehicles CASCADE;
COMMIT;
