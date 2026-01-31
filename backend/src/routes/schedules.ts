import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db, COLLECTIONS } from '../lib/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

export const schedulesRouter = Router();
schedulesRouter.use(authMiddleware);

function toSchedule(
  id: string,
  data: FirebaseFirestore.DocumentData
): {
  id: string;
  customerId?: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  status: 'pending' | 'completed';
} {
  return {
    id,
    customerId: data.customerId ?? undefined,
    title: data.title ?? '',
    date: data.date ?? '',
    time: data.time ?? undefined,
    description: data.description ?? undefined,
    status: (data.status === 'completed' ? 'completed' : 'pending') as 'pending' | 'completed',
  };
}

schedulesRouter.get('/', async (req: any, res) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    let q = db.collection(COLLECTIONS.schedules).where('userId', '==', req.user.id);
    if (customerId) {
      q = q.where('customerId', '==', customerId);
    }
    const snap = await q.get();
    const list = snap.docs
      .map((d) => toSchedule(d.id, d.data()))
      .sort((a, b) => {
        const da = new Date(`${a.date} ${a.time || '00:00'}`).getTime();
        const db_ = new Date(`${b.date} ${b.time || '00:00'}`).getTime();
        return da - db_;
      });
    return res.json(list);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to list schedules' });
  }
});

schedulesRouter.post('/', async (req: any, res) => {
  try {
    const { customerId, title, date, time, description, status } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date required' });
    }
    const ref = await db.collection(COLLECTIONS.schedules).add({
      userId: req.user.id,
      customerId: customerId || null,
      title,
      date,
      time: time ?? null,
      description: description ?? null,
      status: status === 'completed' ? 'completed' : 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    return res.status(201).json(toSchedule(ref.id, doc.data()!));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to create schedule' });
  }
});

schedulesRouter.patch('/:id', async (req: any, res) => {
  try {
    const ref = db.collection(COLLECTIONS.schedules).doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== req.user.id) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    const { customerId, title, date, time, description, status } = req.body;
    const data: Record<string, unknown> = {};
    if (customerId !== undefined) data.customerId = customerId || null;
    if (title !== undefined) data.title = title;
    if (date !== undefined) data.date = date;
    if (time !== undefined) data.time = time;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status === 'completed' ? 'completed' : 'pending';
    await ref.update(data);
    const updated = await ref.get();
    return res.json(toSchedule(ref.id, updated.data()!));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update schedule' });
  }
});

schedulesRouter.delete('/:id', async (req: any, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.schedules).doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.id) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    await db.collection(COLLECTIONS.schedules).doc(req.params.id).delete();
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to delete schedule' });
  }
});
