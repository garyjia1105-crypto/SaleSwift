import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db, COLLECTIONS } from '../lib/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

export const usersRouter = Router();
usersRouter.use(authMiddleware);

usersRouter.get('/me', async (req: any, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.users).doc(req.user.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    const d = doc.data()!;
    return res.json({
      id: doc.id,
      email: d.email,
      avatar: d.avatar ?? null,
      language: d.language ?? null,
      theme: d.theme ?? null,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

usersRouter.patch('/me', async (req: any, res) => {
  try {
    const { avatar, language, theme } = req.body;
    const data: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (avatar !== undefined) data.avatar = avatar;
    if (language !== undefined) data.language = language;
    if (theme !== undefined) data.theme = theme;
    const ref = db.collection(COLLECTIONS.users).doc(req.user.id);
    await ref.update(data);
    const doc = await ref.get();
    const d = doc.data()!;
    return res.json({
      id: doc.id,
      email: d.email,
      avatar: d.avatar ?? null,
      language: d.language ?? null,
      theme: d.theme ?? null,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});
