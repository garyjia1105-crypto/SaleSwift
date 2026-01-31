import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db, COLLECTIONS } from '../lib/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

export const coursePlansRouter = Router();
coursePlansRouter.use(authMiddleware);

function toCoursePlan(
  id: string,
  data: FirebaseFirestore.DocumentData
): {
  id: string;
  customerId: string;
  title: string;
  objective: string;
  modules: { name: string; topics: string[]; duration: string }[];
  resources: string[];
  createdAt: string;
} {
  const ts = data.createdAt;
  return {
    id,
    customerId: data.customerId ?? '',
    title: data.title ?? '',
    objective: data.objective ?? '',
    modules: Array.isArray(data.modules) ? data.modules : [],
    resources: Array.isArray(data.resources) ? data.resources : [],
    createdAt: ts?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
  };
}

coursePlansRouter.get('/', async (req: any, res) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    let q = db.collection(COLLECTIONS.coursePlans).where('userId', '==', req.user.id);
    if (customerId) {
      q = q.where('customerId', '==', customerId);
    }
    const snap = await q.get();
    const list = snap.docs
      .map((d) => toCoursePlan(d.id, d.data()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(list);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to list course plans' });
  }
});

coursePlansRouter.post('/', async (req: any, res) => {
  try {
    const { customerId, title, objective, modules, resources } = req.body;
    if (!customerId || !title || !objective) {
      return res.status(400).json({ error: 'customerId, title, objective required' });
    }
    const custSnap = await db
      .collection(COLLECTIONS.customers)
      .doc(customerId)
      .get();
    if (!custSnap.exists || custSnap.data()?.userId !== req.user.id) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const ref = await db.collection(COLLECTIONS.coursePlans).add({
      userId: req.user.id,
      customerId,
      title,
      objective: objective ?? '',
      modules: Array.isArray(modules) ? modules : [],
      resources: Array.isArray(resources) ? resources : [],
      createdAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    return res.status(201).json(toCoursePlan(ref.id, doc.data()!));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to create course plan' });
  }
});

coursePlansRouter.get('/:id', async (req: any, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.coursePlans).doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.id) {
      return res.status(404).json({ error: 'Course plan not found' });
    }
    return res.json(toCoursePlan(doc.id, doc.data()!));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to get course plan' });
  }
});

coursePlansRouter.delete('/:id', async (req: any, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.coursePlans).doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.id) {
      return res.status(404).json({ error: 'Course plan not found' });
    }
    await db.collection(COLLECTIONS.coursePlans).doc(req.params.id).delete();
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to delete course plan' });
  }
});
