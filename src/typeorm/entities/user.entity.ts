import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from '../../shared/constants';
import { Student } from './student.entity';
import { Teacher } from './teacher.entity';
import * as argon2 from 'argon2';

/**
 * User entity representing system users with authentication and role-based capabilities
 */
@Entity('users')
export class User extends BaseEntity {
  @Column({ nullable: true })
  email: string;

  @Column()
  username: string;

  @Column({ select: false })
  password: string;

  @Column({ enum: Role, type: 'enum' })
  role: Role;

  @Column({ nullable: true, type: 'uuid' })
  teacherId: string;

  @Column({ nullable: true, type: 'uuid' })
  studentId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'timestamptz' })
  lastLogin: Date;

  @OneToOne(() => Student, (student) => student.user)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @OneToOne(() => Teacher, (teacher) => teacher.user)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  /**
   * Hashes password before inserting into database
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
   * @returns True if the password matches, false otherwise
   */
  async validatePassword(password: string): Promise<boolean> {
    return argon2.verify(this.password, password);
  }
}
