import { BadRequestException as OriginalBadRequestException } from '@nestjs/common';
import { EntityName, ERROR_MESSAGES } from '../error-messages';

export class BadRequestException extends OriginalBadRequestException {
  constructor(entityName: EntityName) {
    super(ERROR_MESSAGES.badRequest(entityName));
  }
}
