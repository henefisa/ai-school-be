import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when a user is not found
 */
export class UserNotFoundException extends BaseException {
  constructor(userId: string) {
    super(
      `User with ID ${userId} not found`,
      HttpStatus.NOT_FOUND,
      'User Not Found',
    );
  }
}

/**
 * Exception thrown when a user with the given email already exists
 */
export class UserEmailExistsException extends BaseException {
  constructor(email: string) {
    super(
      `User with email ${email} already exists`,
      HttpStatus.CONFLICT,
      'Email Already Exists',
    );
  }
}

/**
 * Exception thrown when a user is not active
 */
export class UserInactiveException extends BaseException {
  constructor(userId: string) {
    super(
      `User with ID ${userId} is not active`,
      HttpStatus.FORBIDDEN,
      'User Inactive',
    );
  }
}

/**
 * Exception thrown when a user's role is invalid for an operation
 */
export class UserInvalidRoleException extends BaseException {
  constructor(role: string) {
    super(
      `User role ${role} is invalid for this operation`,
      HttpStatus.FORBIDDEN,
      'Invalid Role',
    );
  }
}
