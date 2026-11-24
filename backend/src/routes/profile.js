import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { id, text } from '../http.js';
import { currentProfile } from '../repositories/users.js';
import { addSkill, savePhoto } from '../services/profile.js';
import { profileFields } from './accounts.js';

const upload = multer({ limits: { fileSize: 3 * 1024 * 1024, files: 1, fields: 0 } });
const kind = z.enum(['teach', 'learn']);

export function profileRoutes(db) {
  const router = Router();
  router.patch('/', async (req, res) => {
    const data = z.object({ ...profileFields, is_public: z.boolean() }).parse(req.body);
    await db.query('UPDATE users SET name=$2,department=$3,affiliation=$4,is_public=$5 WHERE id=$1',
      [req.userId, data.name, data.department, data.affiliation, data.is_public]);
    res.json(await currentProfile(db, req.userId));
  });

  router.put('/photo', upload.single('photo'), async (req, res) => {
    await savePhoto(db, req.userId, req.file);
    res.json(await currentProfile(db, req.userId));
  });

  router.post('/skills', async (req, res) => {
    const data = z.object({ kind, name: text(60) }).parse(req.body);
    await addSkill(db, req.userId, data.kind, data.name);
    res.json(await currentProfile(db, req.userId));
  });

  router.delete('/skills/:kind/:id', async (req, res) => {
    await db.query('DELETE FROM user_skills WHERE user_id=$1 AND kind=$2 AND skill_id=$3',
      [req.userId, kind.parse(req.params.kind), id.parse(req.params.id)]);
    res.json(await currentProfile(db, req.userId));
  });

  router.post('/advance', async (req, res) => {
    const { step } = z.object({ step: z.number().int().min(1).max(3) }).parse(req.body);
    await db.query('UPDATE users SET onboarding_step=onboarding_step+1 WHERE id=$1 AND onboarding_step=$2', [req.userId, step]);
    res.json(await currentProfile(db, req.userId));
  });
  return router;
}
