#!/usr/bin/env ts-node
import 'reflect-metadata';
import * as path from 'path';
import * as tsconfig from 'tsconfig-paths';

// Register path mapping for ts-node
const projectRoot = path.resolve(__dirname, '../../..');
tsconfig.register({
  baseUrl: projectRoot,
  paths: { 'src/*': ['src/*'] },
});

import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../../typeorm/entities/user.entity';
import * as fs from 'fs';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import {
  Role,
  Gender,
  RelationshipToStudent,
  RoomType,
  DayOfWeek,
} from '../../shared/constants';
import { Student } from '../../typeorm/entities/student.entity';
import { Teacher } from '../../typeorm/entities/teacher.entity';
import { Department } from '../../typeorm/entities/department.entity';
import { Course } from '../../typeorm/entities/course.entity';
import { Room } from '../../typeorm/entities/room.entity';
import { Semester } from '../../typeorm/entities/semester.entity';
import { ClassRoom } from '../../typeorm/entities/class.entity';
import { Address } from '../../typeorm/entities/address.entity';
import { Parent } from '../../typeorm/entities/parent.entity';
import { StudentAddress } from '../../typeorm/entities/student-address.entity';
import { ParentAddress } from '../../typeorm/entities/parent-address.entity';
import { TeacherAddress } from '../../typeorm/entities/teacher-address.entity';
import { ClassAssignment } from '../../typeorm/entities/class-assignment.entity';
import { Enrollment } from '../../typeorm/entities/enrollment.entity';
import { Attendance } from '../../typeorm/entities/attendance.entity';
import { Grade } from '../../typeorm/entities/grade.entity';
import { EmergencyContact } from '../../typeorm/entities/emergency-contact.entity';
import * as argon2 from 'argon2';

// Load environment variables with more debugging
const envPath = path.resolve(process.cwd(), '.env');
console.log('Looking for .env file at:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));

config({ path: envPath });

// Debug environment variables
console.log('Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_NAME:', process.env.DB_NAME);

// Create a data source with explicit configuration
const dbConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'school_management',
  entities: [
    User,
    Student,
    Teacher,
    Department,
    Course,
    Room,
    Semester,
    ClassRoom,
    Address,
    Parent,
    StudentAddress,
    ParentAddress,
    TeacherAddress,
    ClassAssignment,
    Enrollment,
    Attendance,
    Grade,
    EmergencyContact,
  ],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: true,
  logger: 'advanced-console' as const,
  namingStrategy: new SnakeNamingStrategy(),
};

console.log('Database configuration:', {
  ...dbConfig,
  password: '******', // Don't log the actual password
});

const AppDataSource = new DataSource(dbConfig);

// This will store created data for establishing relationships
interface SeedData {
  users: User[];
  students: Student[];
  teachers: Teacher[];
  departments: Department[];
  courses: Course[];
  rooms: Room[];
  semesters: Semester[];
  classes: ClassRoom[];
  addresses: Address[];
  parents: Parent[];
  studentAddresses: StudentAddress[];
  parentAddresses: ParentAddress[];
  teacherAddresses: TeacherAddress[];
  emergencyContacts: EmergencyContact[];
}

// Create empty seed data object
const seedData: SeedData = {
  users: [],
  students: [],
  teachers: [],
  departments: [],
  courses: [],
  rooms: [],
  semesters: [],
  classes: [],
  addresses: [],
  parents: [],
  studentAddresses: [],
  parentAddresses: [],
  teacherAddresses: [],
  emergencyContacts: [],
};

async function seedAdminUser(): Promise<User> {
  const userRepository = AppDataSource.getRepository(User);

  console.log('Seeding admin user...');

  const adminEmail = 'admin@example.com';
  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists:', {
      email: existingAdmin.email,
      role: existingAdmin.role,
    });
    return existingAdmin;
  }

  const adminUser = userRepository.create({
    email: adminEmail,
    username: 'admin',
    password: 'admin123',
    role: Role.Admin,
    isActive: true,
  });

  await userRepository.save(adminUser);
  console.log('Admin user created successfully:', {
    email: adminUser.email,
    role: adminUser.role,
  });

  seedData.users.push(adminUser);
  return adminUser;
}

async function seedDepartments(): Promise<Department[]> {
  const departmentRepository = AppDataSource.getRepository(Department);
  console.log('Seeding departments...');

  const departmentData = [
    {
      name: 'Computer Science',
      code: 'CS',
      description:
        'The study of computers and computational systems including algorithms, data structures, and software development.',
      location: 'Tech Building, 3rd Floor',
      email: 'cs@school.edu',
      phoneNumber: '555-123-4567',
    },
    {
      name: 'Mathematics',
      code: 'MATH',
      description:
        'The study of numbers, quantities, and shapes, including algebra, calculus, and statistical analysis.',
      location: 'Science Building, 2nd Floor',
      email: 'math@school.edu',
      phoneNumber: '555-123-4568',
    },
    {
      name: 'Physics',
      code: 'PHYS',
      description:
        'The study of matter, energy, and the interactions between them, including mechanics, thermodynamics, and quantum physics.',
      location: 'Science Building, 1st Floor',
      email: 'physics@school.edu',
      phoneNumber: '555-123-4569',
    },
    {
      name: 'English',
      code: 'ENGL',
      description:
        'The study of language, literature, and writing, including composition, rhetoric, and literary analysis.',
      location: 'Liberal Arts Building, 2nd Floor',
      email: 'english@school.edu',
      phoneNumber: '555-123-4570',
    },
    {
      name: 'History',
      code: 'HIST',
      description:
        'The study of past events and their significance, including world history, cultural studies, and historical analysis.',
      location: 'Liberal Arts Building, 3rd Floor',
      email: 'history@school.edu',
      phoneNumber: '555-123-4571',
    },
  ];

  // Clear existing departments array
  seedData.departments = [];

  for (const data of departmentData) {
    // Check if department with this code already exists
    const existingDepartment = await departmentRepository.findOne({
      where: { code: data.code },
    });

    if (existingDepartment) {
      console.log(`Department with code ${data.code} already exists, skipping`);
      // Add to seedData to be used by other functions
      seedData.departments.push(existingDepartment);
      continue;
    }

    // Create new department
    try {
      const department = departmentRepository.create(data);
      await departmentRepository.save(department);
      seedData.departments.push(department);
      console.log(
        `Created department: ${department.name} (${department.code})`,
      );
    } catch (error: unknown) {
      console.error(
        `Error creating department with code ${data.code}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  console.log(`Using ${seedData.departments.length} departments for seeding`);
  return seedData.departments;
}

async function seedRooms(): Promise<Room[]> {
  const roomRepository = AppDataSource.getRepository(Room);
  console.log('Seeding rooms...');

  const roomData = [
    {
      roomNumber: '101',
      building: 'Main Building',
      name: 'Main Lecture Hall',
      capacity: 30,
      roomType: RoomType.ClassRoom,
      hasProjector: true,
      hasWhiteboard: true,
      features: ['Smart Board', 'Audio System', 'Climate Control'],
      operationalHours: {
        monday: [{ start: '08:00', end: '17:00' }],
        tuesday: [{ start: '08:00', end: '17:00' }],
        wednesday: [{ start: '08:00', end: '17:00' }],
        thursday: [{ start: '08:00', end: '17:00' }],
        friday: [{ start: '08:00', end: '17:00' }],
      },
      status: 'ACTIVE',
      location: 'First floor, near entrance',
      description: 'Primary lecture hall for large classes',
      notes: 'Accessible by elevator',
    },
    {
      roomNumber: '102',
      building: 'Main Building',
      name: 'Secondary Lecture Room',
      capacity: 25,
      roomType: RoomType.ClassRoom,
      hasProjector: true,
      hasWhiteboard: true,
      features: ['Smart Board', 'Video Conferencing'],
      operationalHours: {
        monday: [{ start: '08:00', end: '17:00' }],
        tuesday: [{ start: '08:00', end: '17:00' }],
        wednesday: [{ start: '08:00', end: '17:00' }],
        thursday: [{ start: '08:00', end: '17:00' }],
        friday: [{ start: '08:00', end: '17:00' }],
      },
      status: 'ACTIVE',
      location: 'First floor, east wing',
      description: 'Mid-sized classroom for lectures',
    },
    {
      roomNumber: '201',
      building: 'Science Building',
      name: 'Computer Science Lab',
      capacity: 20,
      roomType: RoomType.Lab,
      hasProjector: true,
      hasWhiteboard: true,
      features: ['Computers', 'Specialized Software', 'Server Access'],
      operationalHours: {
        monday: [{ start: '09:00', end: '18:00' }],
        tuesday: [{ start: '09:00', end: '18:00' }],
        wednesday: [{ start: '09:00', end: '18:00' }],
        thursday: [{ start: '09:00', end: '18:00' }],
        friday: [{ start: '09:00', end: '16:00' }],
      },
      status: 'ACTIVE',
      location: 'Second floor, north wing',
      description: 'Specialized lab for computer science classes',
      notes: 'Contains 20 workstations with dual monitors',
    },
    {
      roomNumber: '301',
      building: 'Arts Building',
      name: 'Main Auditorium',
      capacity: 40,
      roomType: RoomType.Auditorium,
      hasProjector: true,
      hasWhiteboard: false,
      features: ['Theater Seating', 'Advanced Audio System', 'Stage Lighting'],
      operationalHours: {
        monday: [{ start: '08:00', end: '20:00' }],
        tuesday: [{ start: '08:00', end: '20:00' }],
        wednesday: [{ start: '08:00', end: '20:00' }],
        thursday: [{ start: '08:00', end: '20:00' }],
        friday: [{ start: '08:00', end: '20:00' }],
        saturday: [{ start: '10:00', end: '16:00' }],
      },
      status: 'ACTIVE',
      location: 'Third floor, central area',
      description: 'Large auditorium for presentations and events',
      notes: 'Requires reservation 48 hours in advance for non-class events',
    },
    {
      roomNumber: 'O101',
      building: 'Admin Building',
      name: 'Faculty Office',
      capacity: 5,
      roomType: RoomType.Office,
      hasProjector: false,
      hasWhiteboard: true,
      features: ['Office Furniture', 'Conference Table'],
      operationalHours: {
        monday: [{ start: '09:00', end: '16:00' }],
        tuesday: [{ start: '09:00', end: '16:00' }],
        wednesday: [{ start: '09:00', end: '16:00' }],
        thursday: [{ start: '09:00', end: '16:00' }],
        friday: [{ start: '09:00', end: '15:00' }],
      },
      status: 'ACTIVE',
      location: 'First floor, admin wing',
      description: 'Office space for faculty meetings',
    },
  ];

  for (const data of roomData) {
    const room = roomRepository.create(data);
    await roomRepository.save(room);
    seedData.rooms.push(room);
  }

  console.log(`Created ${roomData.length} rooms`);
  return seedData.rooms;
}

async function seedSemesters(): Promise<Semester[]> {
  const semesterRepository = AppDataSource.getRepository(Semester);
  console.log('Seeding semesters...');

  const semesterData = [
    {
      name: 'Fall 2023',
      startDate: new Date(2023, 8, 1), // September 1, 2023
      endDate: new Date(2023, 11, 31), // December 31, 2023
      currentSemester: false,
    },
    {
      name: 'Spring 2024',
      startDate: new Date(2024, 0, 15), // January 15, 2024
      endDate: new Date(2024, 4, 31), // May 31, 2024
      currentSemester: true,
    },
    {
      name: 'Summer 2024',
      startDate: new Date(2024, 5, 1), // June 1, 2024
      endDate: new Date(2024, 7, 31), // August 31, 2024
      currentSemester: false,
    },
  ];

  for (const data of semesterData) {
    const semester = semesterRepository.create(data);
    await semesterRepository.save(semester);
    seedData.semesters.push(semester);
  }

  console.log(`Created ${semesterData.length} semesters`);
  return seedData.semesters;
}

async function seedTeachers(): Promise<Teacher[]> {
  const teacherRepository = AppDataSource.getRepository(Teacher);
  const userRepository = AppDataSource.getRepository(User);
  const teacherAddressRepository = AppDataSource.getRepository(TeacherAddress);
  console.log('Seeding teachers...');

  // Clear existing teachers array
  seedData.teachers = [];

  const teacherData = [
    {
      firstName: 'John',
      lastName: 'Smith',
      dob: new Date('1980-06-10'),
      gender: Gender.Male,
      contactNumber: '123-456-7890',
      email: 'john.smith@school.edu',
      hireDate: new Date('2020-01-15'),
      salary: 65000,
      departmentId: seedData.departments[0].id,
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      dob: new Date('1975-03-15'),
      gender: Gender.Female,
      contactNumber: '123-456-7891',
      email: 'sarah.johnson@school.edu',
      hireDate: new Date('2018-09-01'),
      salary: 72000,
      departmentId: seedData.departments[1].id,
    },
    {
      firstName: 'Robert',
      lastName: 'Williams',
      dob: new Date('1982-12-05'),
      gender: Gender.Male,
      contactNumber: '123-456-7892',
      email: 'robert.williams@school.edu',
      hireDate: new Date('2019-06-10'),
      salary: 68000,
      departmentId: seedData.departments[2].id,
    },
    {
      firstName: 'Emily',
      lastName: 'Davis',
      dob: new Date('1985-04-25'),
      gender: Gender.Female,
      contactNumber: '123-456-7893',
      email: 'emily.davis@school.edu',
      hireDate: new Date('2021-08-20'),
      salary: 61000,
      departmentId: seedData.departments[3].id,
    },
  ];

  for (const data of teacherData) {
    try {
      // Check if teacher already exists
      const existingTeacher = await teacherRepository.findOne({
        where: { email: data.email },
      });

      if (existingTeacher) {
        console.log(
          `Teacher with email ${data.email} already exists, skipping`,
        );
        seedData.teachers.push(existingTeacher);
        continue;
      }

      // Create teacher
      const teacher = teacherRepository.create(data);
      await teacherRepository.save(teacher);

      // Create a user account for the teacher
      const user = userRepository.create({
        email: teacher.email,
        username: teacher.email.split('@')[0],
        password: await argon2.hash('password'),
        role: Role.Teacher,
        teacherId: teacher.id,
        isActive: true,
      });
      await userRepository.save(user);

      // Update the teacher object
      teacher.user = user;

      // Also set the teacher's salary
      await teacherRepository.update(teacher.id, { salary: data.salary });

      // Get the department
      const department = seedData.departments.find(
        (dept) => dept.id === data.departmentId,
      );

      if (department) {
        // We need to manually insert into the teacher_departments junction table
        await AppDataSource.query(
          `INSERT INTO teacher_departments ("teacher_id", "department_id") VALUES ($1, $2)`,
          [teacher.id, department.id],
        );
        console.log(
          `Assigned teacher ${teacher.firstName} to department ${department.name}`,
        );
      }

      // Assign an address to each teacher
      const addressIndex = seedData.teachers.length % seedData.addresses.length;
      const address = seedData.addresses[addressIndex];

      const teacherAddress = teacherAddressRepository.create({
        teacherId: teacher.id,
        addressId: address.id,
        addressType: 'Primary',
      });

      await teacherAddressRepository.save(teacherAddress);

      seedData.teachers.push(teacher);
      console.log(`Created teacher: ${teacher.firstName} ${teacher.lastName}`);
    } catch (error: unknown) {
      console.error(
        `Error creating teacher ${data.firstName} ${data.lastName}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  console.log(`Using ${seedData.teachers.length} teachers for seeding`);
  return seedData.teachers;
}

async function updateDepartmentHeads(): Promise<void> {
  const departmentRepository = AppDataSource.getRepository(Department);
  console.log('Updating department heads...');

  // Assign department heads based on teachers
  const departmentHeadAssignments = [
    { departmentIndex: 0, teacherIndex: 0 }, // CS - John Smith
    { departmentIndex: 1, teacherIndex: 1 }, // Math - Sarah Johnson
    { departmentIndex: 2, teacherIndex: 2 }, // Physics - Robert Williams
    { departmentIndex: 3, teacherIndex: 3 }, // English - Emily Davis
    // History will have no head initially
  ];

  for (const assignment of departmentHeadAssignments) {
    const department = seedData.departments[assignment.departmentIndex];
    const teacher = seedData.teachers[assignment.teacherIndex];

    if (department && teacher) {
      console.log(
        `Setting ${teacher.firstName} ${teacher.lastName} as head of ${department.name} department`,
      );

      department.headId = teacher.id;
      department.head = teacher;

      await departmentRepository.save(department);
    }
  }

  console.log('Department heads updated successfully');
}

async function seedCourses(): Promise<Course[]> {
  const courseRepository = AppDataSource.getRepository(Course);
  console.log('Seeding courses...');

  const courseData = [
    {
      name: 'Introduction to Computer Science',
      code: 'CS101',
      description:
        'Fundamental concepts of computer programming and software development',
      credits: 3,
      required: true,
      departmentId: seedData.departments[0].id, // Computer Science
      status: 'ACTIVE',
    },
    {
      name: 'Data Structures and Algorithms',
      code: 'CS201',
      description: 'Advanced data structures and algorithm design techniques',
      credits: 4,
      required: true,
      departmentId: seedData.departments[0].id, // Computer Science
      status: 'ACTIVE',
    },
    {
      name: 'Calculus I',
      code: 'MATH101',
      description: 'Introduction to differential and integral calculus',
      credits: 4,
      required: true,
      departmentId: seedData.departments[1].id, // Mathematics
      status: 'ACTIVE',
    },
    {
      name: 'Physics for Scientists and Engineers',
      code: 'PHYS201',
      description: 'Mechanics, waves, thermodynamics, and related topics',
      credits: 4,
      required: true,
      departmentId: seedData.departments[2].id, // Physics
      status: 'ACTIVE',
    },
    {
      name: 'English Composition',
      code: 'ENGL101',
      description: 'Principles of effective writing and critical thinking',
      credits: 3,
      required: true,
      departmentId: seedData.departments[3].id, // English
      status: 'ACTIVE',
    },
    {
      name: 'World History',
      code: 'HIST101',
      description: 'Survey of major historical events and developments',
      credits: 3,
      required: false,
      departmentId: seedData.departments[4].id, // History
      status: 'ACTIVE',
    },
  ];

  for (const data of courseData) {
    // Check if course already exists by code
    const existingCourse = await courseRepository.findOne({
      where: { code: data.code },
    });

    if (existingCourse) {
      console.log(`Course with code ${data.code} already exists, skipping`);
      seedData.courses.push(existingCourse);
      continue;
    }

    // Get department ID but don't include the full department object to avoid circular reference
    const department = seedData.departments.find(
      (d) => d.id === data.departmentId,
    );

    if (!department) {
      console.log(
        `Department with ID ${data.departmentId} not found for course ${data.name}`,
      );
      continue;
    }

    try {
      const course = courseRepository.create(data);
      await courseRepository.save(course);
      seedData.courses.push(course);
      console.log(`Created course: ${course.name} (${course.code})`);
    } catch (error: unknown) {
      console.error(
        `Error creating course ${data.name}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  console.log(`Created ${seedData.courses.length} courses`);
  return seedData.courses;
}

async function seedClasses(): Promise<ClassRoom[]> {
  const classRepository = AppDataSource.getRepository(ClassRoom);
  const classAssignmentRepository =
    AppDataSource.getRepository(ClassAssignment);
  console.log('Seeding classes...');

  // Clear existing classes array
  seedData.classes = [];

  // The current semester with fallback
  const currentSemester =
    seedData.semesters.find((s) => s.currentSemester === true) ||
    seedData.semesters[0]; // Fallback to first semester if none is current

  // Create multiple classes for each course
  for (const course of seedData.courses) {
    // Morning class
    try {
      const morningClass = classRepository.create({
        name: `${course.name} - Morning`,
        courseId: course.id,
        semesterId: currentSemester.id,
        startTime: new Date(2024, 0, 1, 9, 0), // 9:00 AM
        endTime: new Date(2024, 0, 1, 10, 30), // 10:30 AM
        dayOfWeek: DayOfWeek.Monday,
        roomId: seedData.rooms[0].id,
        maxEnrollment: 25,
        // Don't include full objects to avoid circular references
      });

      await classRepository.save(morningClass);
      seedData.classes.push(morningClass);
      console.log(`Created class: ${morningClass.name}`);

      // Afternoon class
      const afternoonClass = classRepository.create({
        name: `${course.name} - Afternoon`,
        courseId: course.id,
        semesterId: currentSemester.id,
        startTime: new Date(2024, 0, 1, 14, 0), // 2:00 PM
        endTime: new Date(2024, 0, 1, 15, 30), // 3:30 PM
        dayOfWeek: DayOfWeek.Wednesday,
        roomId: seedData.rooms[1].id,
        maxEnrollment: 25,
        // Don't include full objects to avoid circular references
      });

      await classRepository.save(afternoonClass);
      seedData.classes.push(afternoonClass);
      console.log(`Created class: ${afternoonClass.name}`);

      // Assign teachers to classes
      const departmentId = course.departmentId;
      // Instead of filtering teachers with complex conditions, get teachers by department ID from database
      if (departmentId) {
        const departmentTeachers = await AppDataSource.getRepository(Teacher)
          .createQueryBuilder('teacher')
          .innerJoin('teacher.departments', 'department')
          .where('department.id = :departmentId', { departmentId })
          .getMany();

        if (departmentTeachers.length > 0) {
          // Assign for morning class
          const morningTeacher = departmentTeachers[0];
          const morningAssignment = classAssignmentRepository.create({
            teacherId: morningTeacher.id,
            classId: morningClass.id,
            // Don't include full objects to avoid circular references
          });
          await classAssignmentRepository.save(morningAssignment);
          console.log(
            `Assigned teacher ${morningTeacher.firstName} to class ${morningClass.name}`,
          );

          // Assign for afternoon class (use a different teacher if available)
          const afternoonTeacher =
            departmentTeachers.length > 1
              ? departmentTeachers[1]
              : departmentTeachers[0];
          const afternoonAssignment = classAssignmentRepository.create({
            teacherId: afternoonTeacher.id,
            classId: afternoonClass.id,
            // Don't include full objects to avoid circular references
          });
          await classAssignmentRepository.save(afternoonAssignment);
          console.log(
            `Assigned teacher ${afternoonTeacher.firstName} to class ${afternoonClass.name}`,
          );
        } else {
          console.log(`No teachers found for department ID ${departmentId}`);
        }
      }
    } catch (error: unknown) {
      console.error(
        `Error creating classes for course ${course.name}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  console.log(
    `Created ${seedData.classes.length} classes with teacher assignments`,
  );
  return seedData.classes;
}

async function seedAddresses(): Promise<Address[]> {
  const addressRepository = AppDataSource.getRepository(Address);
  console.log('Seeding addresses...');

  const addressData = [
    {
      street: '123 Main St, Apt 4B',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    {
      street: '456 Oak Ave',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA',
    },
    {
      street: '789 Pine Rd, Suite 101',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'USA',
    },
    {
      street: '101 Maple Dr',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'USA',
    },
    {
      street: '202 Cedar Ln, Unit 7',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
      country: 'USA',
    },
  ];

  for (const data of addressData) {
    const address = addressRepository.create(data);
    await addressRepository.save(address);
    seedData.addresses.push(address);
  }

  console.log(`Created ${addressData.length} addresses`);
  return seedData.addresses;
}

async function seedParents(): Promise<Parent[]> {
  const parentRepository = AppDataSource.getRepository(Parent);
  const parentAddressRepository = AppDataSource.getRepository(ParentAddress);
  const emergencyContactRepository =
    AppDataSource.getRepository(EmergencyContact);
  const userRepository = AppDataSource.getRepository(User);
  console.log('Seeding parents...');

  const parentData = [
    {
      firstName: 'Michael',
      lastName: 'Brown',
      relationshipToStudent: RelationshipToStudent.Father,
      contactNumber1: '555-123-4567',
      contactNumber2: '555-765-4321',
      email: 'michael.brown@example.com',
      occupation: 'Engineer',
      notes: 'Prefers to be contacted by email. Works evenings.',
    },
    {
      firstName: 'Jennifer',
      lastName: 'Wilson',
      relationshipToStudent: RelationshipToStudent.Mother,
      contactNumber1: '555-234-5678',
      contactNumber2: undefined,
      email: 'jennifer.wilson@example.com',
      occupation: 'Doctor',
      notes: 'Available for contact after 5 PM.',
    },
    {
      firstName: 'David',
      lastName: 'Taylor',
      relationshipToStudent: RelationshipToStudent.Father,
      contactNumber1: '555-345-6789',
      contactNumber2: undefined,
      email: 'david.taylor@example.com',
      occupation: 'Accountant',
      notes: 'Prefers phone calls over emails.',
    },
  ];

  // Emergency contact data for each parent
  const emergencyContactsData = [
    [
      {
        name: 'Sarah Brown',
        relationship: 'Wife',
        phoneNumber: '555-987-6543',
        email: 'sarah.brown@example.com',
      },
      {
        name: 'James Brown',
        relationship: 'Brother',
        phoneNumber: '555-123-9876',
        email: 'james.brown@example.com',
      },
    ],
    [
      {
        name: 'Robert Wilson',
        relationship: 'Husband',
        phoneNumber: '555-876-5432',
        email: 'robert.wilson@example.com',
      },
    ],
    [
      {
        name: 'Emma Taylor',
        relationship: 'Wife',
        phoneNumber: '555-765-4321',
        email: 'emma.taylor@example.com',
      },
      {
        name: 'Mary Taylor',
        relationship: 'Mother',
        phoneNumber: '555-234-5678',
        email: undefined,
      },
    ],
  ];

  for (let i = 0; i < parentData.length; i++) {
    const data = parentData[i];

    // Create parent
    const parent = parentRepository.create(data);
    await parentRepository.save(parent);
    seedData.parents.push(parent);

    // Create user account for parent
    const username = `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}`;
    const user = userRepository.create({
      email: data.email,
      username,
      password: await argon2.hash('password'),
      role: Role.Parent,
      parentId: parent.id,
      isActive: true,
    });

    await userRepository.save(user);
    seedData.users.push(user);

    // Assign an address to each parent
    const address = seedData.addresses[i % seedData.addresses.length];

    const parentAddress = parentAddressRepository.create({
      parent: parent,
      address: address,
      parentId: parent.id,
      addressId: address.id,
      addressType: 'Primary',
    });

    await parentAddressRepository.save(parentAddress);
    seedData.parentAddresses.push(parentAddress);

    // Create emergency contacts for this parent
    const contactsData = emergencyContactsData[i];
    for (const contactData of contactsData) {
      const emergencyContact = emergencyContactRepository.create({
        name: contactData.name,
        relationship: contactData.relationship,
        phoneNumber: contactData.phoneNumber,
        email: contactData.email,
        parentId: parent.id,
      });

      await emergencyContactRepository.save(emergencyContact);
      seedData.emergencyContacts.push(emergencyContact);
    }
  }

  console.log(
    `Created ${parentData.length} parents with user accounts, addresses and emergency contacts`,
  );
  return seedData.parents;
}

async function seedStudents(): Promise<Student[]> {
  const studentRepository = AppDataSource.getRepository(Student);
  const userRepository = AppDataSource.getRepository(User);
  const studentAddressRepository = AppDataSource.getRepository(StudentAddress);
  console.log('Seeding students...');

  // Clear the students array to prevent adding to previous attempts
  seedData.students = [];

  const studentData = [
    {
      firstName: 'Alex',
      lastName: 'Brown',
      email: 'alex.brown@student.edu',
      gender: Gender.Male,
      contactNumber: '555-111-2222',
      dob: '2000-06-15', // Changed to string for easier date parsing
      enrollmentDate: '2022-09-01', // Changed to string for easier date parsing
      parentId: seedData.parents[0].id,
    },
    {
      firstName: 'Jessica',
      lastName: 'Wilson',
      email: 'jessica.wilson@student.edu',
      gender: Gender.Female,
      contactNumber: '555-222-3333',
      dob: '2001-03-22',
      enrollmentDate: '2022-09-01',
      parentId: seedData.parents[1].id,
    },
    {
      firstName: 'Ethan',
      lastName: 'Taylor',
      email: 'ethan.taylor@student.edu',
      gender: Gender.Male,
      contactNumber: '555-333-4444',
      dob: '2000-12-07',
      enrollmentDate: '2022-09-01',
      parentId: seedData.parents[2].id,
    },
    {
      firstName: 'Olivia',
      lastName: 'Brown',
      email: 'olivia.brown@student.edu',
      gender: Gender.Female,
      contactNumber: '555-444-5555',
      dob: '2001-08-30',
      enrollmentDate: '2023-09-01',
      parentId: seedData.parents[0].id,
    },
  ];

  for (const [index, data] of studentData.entries()) {
    try {
      // Get parent
      const parent = seedData.parents.find((p) => p.id === data.parentId);

      if (!parent) {
        console.log(
          `Parent with ID ${data.parentId} not found for student ${data.firstName} ${data.lastName}`,
        );
        continue;
      }

      console.log(
        `Creating student: ${data.firstName} ${data.lastName} with parent ID: ${parent.id}`,
      );

      // Create student with parsed dates
      const student = studentRepository.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        gender: data.gender,
        contactNumber: data.contactNumber,
        dob: new Date(data.dob),
        enrollmentDate: new Date(data.enrollmentDate),
        parentId: parent.id,
        parent: parent,
      });

      await studentRepository.save(student);
      console.log(`Student saved with ID: ${student.id}`);

      // Create associated user account
      const user = userRepository.create({
        email: data.email,
        username: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}`,
        password: await argon2.hash('password'),
        role: Role.Student,
        studentId: student.id,
        isActive: true,
      });

      await userRepository.save(user);
      console.log(`User account created for student: ${user.id}`);

      // Associate student with an address (can use parent's address or a new one)
      if (seedData.addresses.length > 0) {
        const addressIndex = index % seedData.addresses.length;
        const address = seedData.addresses[addressIndex];

        console.log(`Associating student with address ID: ${address.id}`);

        const studentAddress = studentAddressRepository.create({
          studentId: student.id,
          addressId: address.id,
          addressType: 'School',
        });

        await studentAddressRepository.save(studentAddress);
        seedData.studentAddresses.push(studentAddress);
        console.log(`Student address created: ${studentAddress.id}`);
      } else {
        console.log('No addresses available to associate with student');
      }

      // Add to seed data arrays
      seedData.students.push(student);
      seedData.users.push(user);
    } catch (error) {
      console.error(
        `Error creating student ${data.firstName} ${data.lastName}:`,
        error,
      );
    }
  }

  console.log(
    `Created ${seedData.students.length} students with user accounts and addresses`,
  );
  return seedData.students;
}

async function seedEnrollments(): Promise<void> {
  const enrollmentRepository = AppDataSource.getRepository(Enrollment);
  console.log('Seeding enrollments...');

  let enrollmentCount = 0;

  // Enroll each student in multiple classes
  for (const student of seedData.students) {
    // Enroll in 3-4 classes
    const numClasses = 3 + Math.floor(Math.random() * 2); // Either 3 or 4 classes

    // Select random classes for enrollment
    const selectedClassIndices = new Set<number>();
    while (
      selectedClassIndices.size < numClasses &&
      selectedClassIndices.size < seedData.classes.length
    ) {
      const randomIndex = Math.floor(Math.random() * seedData.classes.length);
      selectedClassIndices.add(randomIndex);
    }

    // Create enrollments
    for (const classIndex of selectedClassIndices) {
      const classRoom = seedData.classes[classIndex];

      const enrollment = enrollmentRepository.create({
        studentId: student.id,
        classId: classRoom.id,
        enrollmentDate: new Date(),
        student: student,
        classRoom: classRoom,
      });

      await enrollmentRepository.save(enrollment);
      enrollmentCount++;
    }
  }

  console.log(
    `Created ${enrollmentCount} enrollments for ${seedData.students.length} students`,
  );
}

// Main seeding function
async function main() {
  try {
    console.log('Starting database connection...');
    await AppDataSource.initialize();
    console.log('Database connected successfully.');

    // Seed in appropriate order for dependencies
    await seedDepartments();
    await seedRooms();
    await seedSemesters();
    await seedAddresses(); // Seed addresses before teachers and students
    await seedTeachers();
    await updateDepartmentHeads();
    await seedCourses();
    await seedClasses();
    await seedParents();
    await seedStudents();
    await seedEnrollments();
    await seedAdminUser();

    console.log('All seed data created successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed.');
  }
}

// Run the seed script
void main();
