import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, COLLECTIONS } from '../lib/firebase.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export interface JwtPayload {
  userId: string;
  email: string;
}

export async function authMiddleware(
  req: Request & { user?: { id: string; email: string } },
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userDoc = await db.collection(COLLECTIONS.users).doc(payload.userId).get();
    if (!userDoc.exists) return res.status(401).json({ error: 'User not found' });
    const data = userDoc.data()!;
    req.user = { id: userDoc.id, email: data.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
