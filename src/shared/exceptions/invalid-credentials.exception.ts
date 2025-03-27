import { UnauthorizedException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../error-messages';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super(ERROR_MESSAGES.invalidCredentials());
  }
}
