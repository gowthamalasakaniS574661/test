-- Rollback Migration 010

BEGIN;
DROP TABLE IF EXISTS ratings CASCADE;
COMMIT;
