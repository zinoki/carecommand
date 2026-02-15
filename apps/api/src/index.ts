import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { sessionMiddleware } from './lib/session.js';
import { apiRouter } from './api/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Allow localhost and ngrok origins for sharing with teammates
const isNgrokOrigin = (origin?: string) =>
  origin && /^https:\/\/[a-z0-9-]+\.(ngrok-free\.app|ngrok\.io)$/.test(origin);
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
      if (!origin || origin === allowed || origin === 'http://localhost:5173' || isNgrokOrigin(origin))
        cb(null, true);
      else cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(requestLogger);

app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
