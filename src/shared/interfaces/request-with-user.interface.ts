import { Request } from 'express';
import { User } from 'src/typeorm/entities/user.entity';

export interface RequestWithUser extends Request {
  user: User;
}
