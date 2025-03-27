import { IsUUID } from 'class-validator';

export class RegisterEnrollmentDto {
  @IsUUID()
  classId: string;
}
