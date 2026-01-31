import 'dotenv/config';
import './lib/firebase.js';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { customersRouter } from './routes/customers.js';
import { interactionsRouter } from './routes/interactions.js';
import { schedulesRouter } from './routes/schedules.js';
import { coursePlansRouter } from './routes/coursePlans.js';
import { aiRouter } from './routes/ai.js';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/course-plans', coursePlansRouter);
app.use('/api/ai', aiRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
