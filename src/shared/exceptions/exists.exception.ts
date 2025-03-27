import { BadRequestException } from '@nestjs/common';
import { EntityName, ERROR_MESSAGES } from '../error-messages';

export class ExistsException extends BadRequestException {
  constructor(entityName: EntityName) {
    super(ERROR_MESSAGES.exists(entityName));
  }
}
