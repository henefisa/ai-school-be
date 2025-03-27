import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as {
      message: string;
      errors?: unknown[];
    };

    return response.status(status ?? 500).json({
      statusCode: status,
      message: exceptionResponse.message,
      timestamp: new Date().toISOString(),
      path: request.url,
      errors: exceptionResponse.errors,
    });
  }
}
