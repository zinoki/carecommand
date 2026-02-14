import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-in-production';

const redisClient = createClient({ url: REDIS_URL });
redisClient.connect().catch(console.error);

const store = new RedisStore({
  client: redisClient,
  prefix: 'carecommand:',
});

export const sessionMiddleware = session({
  store,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'carecommand.sid',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000, // 30 minutes
    path: '/',
  },
});
