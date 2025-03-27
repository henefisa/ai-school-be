import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class HttpMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpMiddleware.name);
  use(req: Request, res: Response, next: () => void) {
    const startTime = Date.now();

    res.on('finish', () => {
      const { method, originalUrl } = req;
      const { statusCode, statusMessage } = res;
      const endTime = Date.now();

      const message = `${method} ${originalUrl} ${statusCode} ${statusMessage} ${
        endTime - startTime
      }ms`;

      if (statusCode >= 500) {
        return this.logger.error(message);
      }

      if (statusCode >= 400) {
        return this.logger.warn(message);
      }

      return this.logger.log(message);
    });

    next();
  }
}
