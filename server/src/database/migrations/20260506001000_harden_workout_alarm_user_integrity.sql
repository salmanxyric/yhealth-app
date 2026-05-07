-- Migration: Harden workout alarm user integrity
--
-- Older local/dev databases may contain workout alarms for users that were
-- deleted by unsafe test cleanup. Those rows cannot produce valid
-- notifications and repeatedly trip notifications_user_id_fkey at runtime.

DELETE FROM workout_alarms wa
 WHERE NOT EXISTS (
   SELECT 1 FROM users u WHERE u.id = wa.user_id
 );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'workout_alarms_user_id_fkey'
       AND conrelid = 'workout_alarms'::regclass
  ) THEN
    ALTER TABLE workout_alarms
      ADD CONSTRAINT workout_alarms_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

SELECT 'workout alarm user integrity hardened' AS status;
