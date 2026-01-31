import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, COLLECTIONS } from '../lib/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const usersRef = db.collection(COLLECTIONS.users);
    const existing = await usersRef.where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const docRef = await usersRef.add({
      email,
      password: hashed,
      avatar: null,
      language: 'zh',
      theme: 'classic',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const user = {
      id: docRef.id,
      email,
      avatar: null,
      language: 'zh',
      theme: 'classic',
    };
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ user, token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const usersRef = db.collection(COLLECTIONS.users);
    const snap = await usersRef.where('email', '==', email).limit(1).get();
    if (snap.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const doc = snap.docs[0];
    const data = doc.data();
    const ok = await bcrypt.compare(password, data.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { userId: doc.id, email: data.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      user: {
        id: doc.id,
        email: data.email,
        avatar: data.avatar ?? null,
        language: data.language ?? null,
        theme: data.theme ?? null,
      },
      token,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Login failed' });
  }
});
