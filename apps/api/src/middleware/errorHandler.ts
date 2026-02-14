import { Request, Response, NextFunction } from 'express';
import { scrubMessage } from '../utils/logScrubber.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(
    JSON.stringify({
      level: 'error',
      message: scrubMessage(err.message),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    })
  );
  const status = (err as any).status ?? 500;
  const message = status >= 500 ? 'Internal server error' : err.message;
  res.status(status).json({ error: message });
}
