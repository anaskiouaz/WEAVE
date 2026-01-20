-- Migration: convert tasks.assigned_to from varchar to uuid[] and set default
BEGIN;

-- Convert existing values (assumes comma-separated UUIDs if stored as text)
ALTER TABLE tasks
  ALTER COLUMN assigned_to TYPE uuid[]
  USING (
    CASE
      WHEN assigned_to IS NULL OR assigned_to = '' THEN ARRAY[]::uuid[]
      ELSE string_to_array(assigned_to, ',')::uuid[]
    END
  );

-- Ensure no NULLs and set default
UPDATE tasks SET assigned_to = '{}'::uuid[] WHERE assigned_to IS NULL;
ALTER TABLE tasks ALTER COLUMN assigned_to SET DEFAULT '{}'::uuid[];

COMMIT;

-- Notes:
-- If assigned_to previously contained non-UUID values this will fail; validate data beforehand.
