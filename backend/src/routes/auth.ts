import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
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
      authProvider: 'email',
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

authRouter.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: 'idToken required' });
    }
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    const email = payload.email;
    const displayName = payload.name ?? email.split('@')[0];
    const picture = payload.picture ?? null;
    const usersRef = db.collection(COLLECTIONS.users);
    const snap = await usersRef.where('email', '==', email).limit(1).get();
    let docId: string;
    if (snap.empty) {
      const docRef = await usersRef.add({
        email,
        displayName,
        avatar: picture,
        language: 'zh',
        theme: 'classic',
        authProvider: 'google',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      docId = docRef.id;
    } else {
      const doc = snap.docs[0];
      docId = doc.id;
      const data = doc.data();
      await doc.ref.update({
        displayName: data.displayName ?? displayName,
        avatar: data.avatar ?? picture,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    const userSnap = await usersRef.doc(docId).get();
    const userData = userSnap.data()!;
    const token = jwt.sign(
      { userId: docId, email: userData.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      user: {
        id: docId,
        email: userData.email,
        avatar: userData.avatar ?? null,
        language: userData.language ?? 'zh',
        theme: userData.theme ?? 'classic',
      },
      token,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Google login failed' });
  }
});
