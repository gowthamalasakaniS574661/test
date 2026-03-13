-- Rollback Migration 006

BEGIN;
DROP TABLE IF EXISTS ride_requests CASCADE;
COMMIT;
