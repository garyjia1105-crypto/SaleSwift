import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db, COLLECTIONS } from '../lib/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

export const customersRouter = Router();
customersRouter.use(authMiddleware);

function toCustomer(
  id: string,
  data: FirebaseFirestore.DocumentData
): {
  id: string;
  name: string;
  company: string;
  role: string;
  industry: string;
  email?: string;
  phone?: string;
  tags: string[];
  createdAt: string;
} {
  const ts = data.createdAt;
  return {
    id,
    name: data.name ?? '',
    company: data.company ?? '',
    role: data.role ?? '',
    industry: data.industry ?? '',
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt: ts?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
  };
}

customersRouter.get('/', async (req: any, res) => {
  try {
    const search = (req.query.search as string)?.trim() || '';
    const snap = await db
      .collection(COLLECTIONS.customers)
      .where('userId', '==', req.user.id)
      .get();
    let list = snap.docs
      .map((d) => toCustomer(d.id, d.data()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (search) {
      const lower = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.company.toLowerCase().includes(lower) ||
          (c.email && c.email.toLowerCase().includes(lower))
      );
    }
    return res.json(list);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to list customers' });
  }
});

customersRouter.post('/', async (req: any, res) => {
  try {
    const { name, company, role, industry, email, phone, tags } = req.body;
    if (!name || !company) {
      return res.status(400).json({ error: 'Name and company required' });
    }
    const ref = await db.collection(COLLECTIONS.customers).add({
      userId: req.user.id,
      name,
      company: company ?? '',
      role: role ?? '',
      industry: industry ?? '',
      email: email ?? null,
      phone: phone ?? null,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    return res.status(201).json(toCustomer(ref.id, doc.data()!));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to create customer' });
  }
});

customersRouter.get('/:id', async (req: any, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.customers).doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.id) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    return res.json(toCustomer(doc.id, doc.data()!));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to get customer' });
  }
});

customersRouter.patch('/:id', async (req: any, res) => {
  try {
    const ref = db.collection(COLLECTIONS.customers).doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== req.user.id) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const { name, company, role, industry, email, phone, tags } = req.body;
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (company !== undefined) data.company = company;
    if (role !== undefined) data.role = role;
    if (industry !== undefined) data.industry = industry;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : [];
    await ref.update(data);
    const updated = await ref.get();
    return res.json(toCustomer(ref.id, updated.data()!));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update customer' });
  }
});

customersRouter.delete('/:id', async (req: any, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.customers).doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.id) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    await db.collection(COLLECTIONS.customers).doc(req.params.id).delete();
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to delete customer' });
  }
});
