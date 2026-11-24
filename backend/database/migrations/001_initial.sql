CREATE TABLE users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL,
  department text NOT NULL,
  affiliation text NOT NULL CHECK (affiliation IN ('aluno', 'professor', 'funcionario')),
  photo text,
  is_public boolean NOT NULL DEFAULT true,
  onboarding_step smallint NOT NULL DEFAULT 1 CHECK (onboarding_step BETWEEN 1 AND 4),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_expires ON sessions (expires_at);

CREATE TABLE skills (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  normalized_name text NOT NULL UNIQUE,
  description text,
  category text
);

CREATE TABLE user_skills (
  user_id integer REFERENCES users ON DELETE CASCADE,
  skill_id integer REFERENCES skills,
  kind text CHECK (kind IN ('teach', 'learn')),
  slot smallint NOT NULL CHECK (slot BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_id, kind),
  UNIQUE (user_id, kind, slot)
);
CREATE INDEX user_skills_matching ON user_skills (skill_id, kind, user_id);

CREATE TABLE matches (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_low integer NOT NULL REFERENCES users,
  user_high integer NOT NULL REFERENCES users,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_low < user_high),
  UNIQUE (user_low, user_high)
);
CREATE INDEX matches_user_high ON matches (user_high);
CREATE VIEW match_participants AS
SELECT id AS match_id, user_low AS user_id FROM matches
UNION ALL
SELECT id, user_high FROM matches;

CREATE TABLE messages (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id integer NOT NULL REFERENCES matches,
  sender_id integer NOT NULL REFERENCES users,
  client_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  CHECK (read_at IS NULL OR delivered_at IS NOT NULL),
  UNIQUE (match_id, sender_id, client_id)
);
CREATE INDEX messages_history ON messages (match_id, id DESC);
CREATE INDEX messages_unread ON messages (match_id, sender_id) WHERE read_at IS NULL;

CREATE TABLE appointments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id integer NOT NULL REFERENCES matches,
  proposer_id integer NOT NULL REFERENCES users,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  location text NOT NULL,
  modality text NOT NULL CHECK (modality IN ('presencial', 'online')),
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado')),
  change_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (starts_at < ends_at)
);
CREATE INDEX appointments_match_time ON appointments (match_id, starts_at);

CREATE TABLE reviews (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id integer NOT NULL REFERENCES appointments,
  author_id integer NOT NULL REFERENCES users,
  recipient_id integer NOT NULL REFERENCES users,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (author_id <> recipient_id),
  UNIQUE (appointment_id, author_id)
);
CREATE INDEX reviews_recipient ON reviews (recipient_id);

CREATE TABLE challenges (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author_id integer NOT NULL REFERENCES users,
  description text NOT NULL,
  deadline date NOT NULL,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'encerrado')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX challenges_status_created ON challenges (status, created_at DESC);

CREATE TABLE challenge_replies (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  challenge_id integer NOT NULL REFERENCES challenges,
  author_id integer NOT NULL REFERENCES users,
  parent_id integer,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'oculta')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, id),
  FOREIGN KEY (challenge_id, parent_id) REFERENCES challenge_replies (challenge_id, id),
  CHECK (parent_id IS NULL OR parent_id <> id)
);
