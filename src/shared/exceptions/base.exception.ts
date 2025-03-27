import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base exception class for custom exceptions
 */
export class BaseException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    error?: string,
  ) {
    super(
      {
        message,
        error: error || message,
        statusCode: status,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}
