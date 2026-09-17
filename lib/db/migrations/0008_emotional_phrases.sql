CREATE TABLE IF NOT EXISTS emotional_phrase_sets (
  mood_id text PRIMARY KEY CHECK (
    mood_id IN (
      'estresado', 'ansioso', 'cansado', 'inepto', 'triste', 'solo',
      'deprimido', 'desmotivado', 'enojado', 'adolorido', 'agradecido',
      'emocionado', 'lleno-de-amor', 'feliz', 'en-paz', 'esperanzado',
      'contento', 'presente'
    )
  ),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emotional_phrases (
  mood_id text NOT NULL REFERENCES emotional_phrase_sets(mood_id) ON DELETE CASCADE,
  slot integer NOT NULL CHECK (slot BETWEEN 1 AND 7),
  text text NOT NULL CHECK (length(btrim(text)) BETWEEN 1 AND 500),
  PRIMARY KEY (mood_id, slot)
);