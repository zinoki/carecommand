import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const start = Date.now();
  req.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        level: 'info',
        method: req.method,
        path: req.path,
        status: (req as any).statusCode,
        duration,
        timestamp: new Date().toISOString(),
      })
    );
  });
  next();
}
