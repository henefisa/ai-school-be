import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { RelationshipToStudent } from 'src/shared/constants';

export class CreateParentDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsEnum(RelationshipToStudent)
  relationshipToStudent?: RelationshipToStudent;

  @IsOptional()
  @IsString()
  contactNumber1?: string;

  @IsOptional()
  @IsString()
  contactNumber2?: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  occupation?: string;
}
