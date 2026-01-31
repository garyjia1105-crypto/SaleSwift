import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db, COLLECTIONS } from '../lib/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

export const interactionsRouter = Router();
interactionsRouter.use(authMiddleware);

function toInteraction(
  id: string,
  data: FirebaseFirestore.DocumentData
): {
  id: string;
  customerId?: string;
  date: string;
  rawInput: string;
  customerProfile: unknown;
  intelligence: unknown;
  metrics: unknown;
  suggestions: string[];
} {
  const ts = data.createdAt;
  return {
    id,
    customerId: data.customerId ?? undefined,
    date: data.date ?? '',
    rawInput: data.rawInput ?? '',
    customerProfile: data.customerProfile ?? {},
    intelligence: data.intelligence ?? {},
    metrics: data.metrics ?? {},
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
  };
}

interactionsRouter.get('/', async (req: any, res) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    let q = db.collection(COLLECTIONS.interactions).where('userId', '==', req.user.id);
    if (customerId) {
      q = q.where('customerId', '==', customerId);
    }
    const snap = await q.get();
    const list = snap.docs
      .map((d) => toInteraction(d.id, d.data()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return res.json(list);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to list interactions' });
  }
});

interactionsRouter.post('/', async (req: any, res) => {
  try {
    const { customerId, date, rawInput, customerProfile, intelligence, metrics, suggestions } = req.body;
    if (!customerProfile || !intelligence || !metrics || !Array.isArray(suggestions)) {
      return res.status(400).json({ error: 'customerProfile, intelligence, metrics, suggestions required' });
    }
    const ref = await db.collection(COLLECTIONS.interactions).add({
      userId: req.user.id,
      customerId: customerId || null,
      date: date || new Date().toISOString(),
      rawInput: rawInput ?? '',
      customerProfile,
      intelligence,
      metrics,
      suggestions,
      createdAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    return res.status(201).json(toInteraction(ref.id, doc.data()!));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to create interaction' });
  }
});

interactionsRouter.get('/:id', async (req: any, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.interactions).doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.id) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    return res.json(toInteraction(doc.id, doc.data()!));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to get interaction' });
  }
});

interactionsRouter.delete('/:id', async (req: any, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.interactions).doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.id) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    await db.collection(COLLECTIONS.interactions).doc(req.params.id).delete();
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to delete interaction' });
  }
});
