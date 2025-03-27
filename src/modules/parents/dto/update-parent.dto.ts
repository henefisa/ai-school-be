import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { RelationshipToStudent } from 'src/shared/constants';

export class UpdateParentDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(RelationshipToStudent)
  relationshipToStudent?: RelationshipToStudent;

  @IsOptional()
  @IsString()
  contactNumber1?: string;

  @IsOptional()
  @IsString()
  contactNumber2?: string;

  @IsOptional()
  @IsEmail()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  occupation?: string;
}
