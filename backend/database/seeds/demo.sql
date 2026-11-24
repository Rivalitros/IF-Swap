DO $$
DECLARE
  ana integer := (SELECT id FROM users WHERE email = 'ana@demo.invalid');
  bruno integer := (SELECT id FROM users WHERE email = 'bruno@demo.invalid');
  conversation integer;
  meeting integer;
  challenge integer;
BEGIN
  INSERT INTO matches (user_low, user_high)
    VALUES (LEAST(ana, bruno), GREATEST(ana, bruno)) RETURNING id INTO conversation;
  INSERT INTO messages (match_id, sender_id, client_id, content)
    VALUES (conversation, bruno, '8fd196ea-4a05-4d4d-af20-7fb8eb980376', 'Oi, Ana! Vamos combinar outra troca de habilidades?');
  INSERT INTO appointments (match_id, proposer_id, starts_at, ends_at, location, modality, status)
    VALUES (conversation, ana, now() - interval '2 days', now() - interval '2 days' + interval '1 hour',
      'Biblioteca do campus', 'presencial', 'concluido')
    RETURNING id INTO meeting;
  INSERT INTO reviews (appointment_id, author_id, recipient_id, rating, comment)
    VALUES (meeting, ana, bruno, 5, 'Aprendi meus primeiros acordes!');
  INSERT INTO challenges (author_id, description, deadline)
    VALUES (ana, 'Preciso praticar funções de segundo grau antes da prova.', current_date + 7)
    RETURNING id INTO challenge;
  INSERT INTO challenge_replies (challenge_id, author_id, message)
    VALUES (challenge, bruno, 'Posso compartilhar alguns exercícios para você praticar.');
END $$;
