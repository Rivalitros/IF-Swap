-- Alinha chaves criadas pela primeira versão do seed às chaves usadas pelo cadastro.
DO $$
DECLARE
  previous_key text;
  normalized_key text;
  previous_id integer;
  canonical_id integer;
BEGIN
  FOR previous_key, normalized_key IN
    SELECT * FROM (VALUES ('programação', 'programacao'), ('violão', 'violao'),
      ('matemática', 'matematica'), ('inglês', 'ingles')) AS translations(previous_name, current_name)
  LOOP
    SELECT id INTO previous_id FROM skills WHERE normalized_name = previous_key;
    IF previous_id IS NULL THEN CONTINUE; END IF;

    SELECT id INTO canonical_id FROM skills WHERE normalized_name = normalized_key;
    IF canonical_id IS NULL THEN
      UPDATE skills SET normalized_name = normalized_key WHERE id = previous_id;
    ELSE
      UPDATE skills AS canonical SET
        description = COALESCE(canonical.description, previous.description),
        category = COALESCE(canonical.category, previous.category)
      FROM skills AS previous WHERE canonical.id = canonical_id AND previous.id = previous_id;

      UPDATE user_skills AS canonical SET created_at = LEAST(canonical.created_at, previous.created_at)
      FROM user_skills AS previous WHERE canonical.skill_id = canonical_id AND previous.skill_id = previous_id
        AND canonical.user_id = previous.user_id AND canonical.kind = previous.kind;
      DELETE FROM user_skills AS previous USING user_skills AS canonical
        WHERE canonical.skill_id = canonical_id AND previous.skill_id = previous_id
          AND canonical.user_id = previous.user_id AND canonical.kind = previous.kind;
      UPDATE user_skills SET skill_id = canonical_id WHERE skill_id = previous_id;
      DELETE FROM skills WHERE id = previous_id;
    END IF;
  END LOOP;
END $$;
