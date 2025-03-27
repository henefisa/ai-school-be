import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import * as argon2 from 'argon2';

/**
 * Enum defining the possible roles for users in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
}

/**
 * Entity representing a user in the system
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column()
  phoneNumber: string;

  @Column()
  address: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Hashes the password before inserting the user into the database
   */
  @BeforeInsert()
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await argon2.hash(this.password);
    }
  }

  /**
   * Validates a password against the user's hashed password
   * @param password - The password to validate
   * @returns Promise<boolean> - True if the password matches, false otherwise
   */
  async validatePassword(password: string): Promise<boolean> {
    return argon2.verify(this.password, password);
  }
}
