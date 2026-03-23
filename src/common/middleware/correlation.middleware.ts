import { randomUUID } from 'node:crypto';

import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Propagates or generates X-Request-Id for tracing and structured logs (pino-http uses req.id).
 */
export function applyCorrelationMiddleware(app: INestApplication): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const fromHeader =
      (typeof req.headers['x-request-id'] === 'string' &&
        req.headers['x-request-id'].trim()) ||
      (typeof req.headers['x-correlation-id'] === 'string' &&
        req.headers['x-correlation-id'].trim());
    const id = fromHeader || randomUUID();
    (req as Request & { id: string }).id = id;
    res.setHeader('X-Request-Id', id);
    next();
  });
}
