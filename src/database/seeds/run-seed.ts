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
import { ClassAssignment } from '../../typeorm/entities/class-assignment.entity';
import { Enrollment } from '../../typeorm/entities/enrollment.entity';
import { Attendance } from '../../typeorm/entities/attendance.entity';
import { Grade } from '../../typeorm/entities/grade.entity';

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
    ClassAssignment,
    Enrollment,
    Attendance,
    Grade,
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
    { name: 'Computer Science' },
    { name: 'Mathematics' },
    { name: 'Physics' },
    { name: 'English' },
    { name: 'History' },
  ];

  for (const data of departmentData) {
    const department = departmentRepository.create(data);
    await departmentRepository.save(department);
    seedData.departments.push(department);
  }

  console.log(`Created ${departmentData.length} departments`);
  return seedData.departments;
}

async function seedRooms(): Promise<Room[]> {
  const roomRepository = AppDataSource.getRepository(Room);
  console.log('Seeding rooms...');

  const roomData = [
    {
      roomNumber: '101',
      building: 'Main Building',
      capacity: 30,
      roomType: RoomType.ClassRoom,
      hasProjector: true,
      hasWhiteboard: true,
    },
    {
      roomNumber: '102',
      building: 'Main Building',
      capacity: 25,
      roomType: RoomType.ClassRoom,
      hasProjector: true,
      hasWhiteboard: true,
    },
    {
      roomNumber: '201',
      building: 'Science Building',
      capacity: 20,
      roomType: RoomType.Lab,
      hasProjector: true,
      hasWhiteboard: true,
    },
    {
      roomNumber: '301',
      building: 'Arts Building',
      capacity: 40,
      roomType: RoomType.Auditorium,
      hasProjector: true,
      hasWhiteboard: false,
    },
    {
      roomNumber: 'O101',
      building: 'Admin Building',
      capacity: 5,
      roomType: RoomType.Office,
      hasProjector: false,
      hasWhiteboard: true,
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
  console.log('Seeding teachers...');

  const teacherData = [
    {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@school.edu',
      gender: Gender.Male,
      contactNumber: '123-456-7890',
      hireDate: new Date(2020, 0, 15),
      salary: 65000,
      dob: new Date(1980, 5, 10),
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@school.edu',
      gender: Gender.Female,
      contactNumber: '123-456-7891',
      hireDate: new Date(2018, 8, 1),
      salary: 72000,
      dob: new Date(1975, 2, 15),
    },
    {
      firstName: 'Robert',
      lastName: 'Williams',
      email: 'robert.williams@school.edu',
      gender: Gender.Male,
      contactNumber: '123-456-7892',
      hireDate: new Date(2019, 5, 10),
      salary: 68000,
      dob: new Date(1982, 11, 5),
    },
    {
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@school.edu',
      gender: Gender.Female,
      contactNumber: '123-456-7893',
      hireDate: new Date(2021, 7, 20),
      salary: 61000,
      dob: new Date(1985, 3, 25),
    },
  ];

  for (const [index, data] of teacherData.entries()) {
    const department =
      seedData.departments[index % seedData.departments.length];

    // Create teacher
    const teacher = teacherRepository.create({
      ...data,
      departmentId: department.id,
    });
    await teacherRepository.save(teacher);

    // Create associated user account
    const user = userRepository.create({
      email: data.email,
      username: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}`,
      password: 'password123',
      role: Role.Teacher,
      teacherId: teacher.id,
      isActive: true,
    });
    await userRepository.save(user);

    // Update the teacher with user reference
    teacher.user = user;
    await teacherRepository.save(teacher);

    seedData.teachers.push(teacher);
    seedData.users.push(user);
  }

  // Assign departments to teachers using many-to-many relationship
  for (let i = 0; i < seedData.teachers.length; i++) {
    const teacher = seedData.teachers[i];
    // Assign primary department and one additional department
    const primaryDeptIndex = i % seedData.departments.length;
    const secondaryDeptIndex = (i + 1) % seedData.departments.length;

    teacher.departments = [
      seedData.departments[primaryDeptIndex],
      seedData.departments[secondaryDeptIndex],
    ];

    await teacherRepository.save(teacher);
  }

  console.log(`Created ${teacherData.length} teachers with user accounts`);
  return seedData.teachers;
}

async function seedCourses(): Promise<Course[]> {
  const courseRepository = AppDataSource.getRepository(Course);
  console.log('Seeding courses...');

  const courseData = [
    {
      name: 'Introduction to Computer Science',
      description:
        'Fundamental concepts of computer programming and software development',
      credits: 3,
      required: true,
      departmentId: seedData.departments[0].id, // Computer Science
    },
    {
      name: 'Data Structures and Algorithms',
      description: 'Advanced data structures and algorithm design techniques',
      credits: 4,
      required: true,
      departmentId: seedData.departments[0].id, // Computer Science
    },
    {
      name: 'Calculus I',
      description: 'Introduction to differential and integral calculus',
      credits: 4,
      required: true,
      departmentId: seedData.departments[1].id, // Mathematics
    },
    {
      name: 'Physics for Scientists and Engineers',
      description: 'Mechanics, waves, thermodynamics, and related topics',
      credits: 4,
      required: true,
      departmentId: seedData.departments[2].id, // Physics
    },
    {
      name: 'English Composition',
      description: 'Principles of effective writing and critical thinking',
      credits: 3,
      required: true,
      departmentId: seedData.departments[3].id, // English
    },
    {
      name: 'World History',
      description: 'Survey of major historical events and developments',
      credits: 3,
      required: false,
      departmentId: seedData.departments[4].id, // History
    },
  ];

  for (const data of courseData) {
    const department = seedData.departments.find(
      (d) => d.id === data.departmentId,
    );

    const course = courseRepository.create({
      ...data,
      department: department,
    });
    await courseRepository.save(course);
    seedData.courses.push(course);
  }

  console.log(`Created ${courseData.length} courses`);
  return seedData.courses;
}

async function seedClasses(): Promise<ClassRoom[]> {
  const classRepository = AppDataSource.getRepository(ClassRoom);
  const classAssignmentRepository =
    AppDataSource.getRepository(ClassAssignment);
  console.log('Seeding classes...');

  // The current semester with fallback
  const currentSemester =
    seedData.semesters.find((s) => s.currentSemester === true) ||
    seedData.semesters[0]; // Fallback to first semester if none is current

  // Create multiple classes for each course
  for (const course of seedData.courses) {
    // Morning class
    const morningClass = classRepository.create({
      name: `${course.name} - Morning`,
      courseId: course.id,
      semesterId: currentSemester.id,
      startTime: new Date(2024, 0, 1, 9, 0), // 9:00 AM
      endTime: new Date(2024, 0, 1, 10, 30), // 10:30 AM
      dayOfWeek: DayOfWeek.Monday,
      roomId: seedData.rooms[0].id,
      maxEnrollment: 25,
      course: course,
      semester: currentSemester,
      room: seedData.rooms[0],
    });
    await classRepository.save(morningClass);

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
      course: course,
      semester: currentSemester,
      room: seedData.rooms[1],
    });
    await classRepository.save(afternoonClass);

    seedData.classes.push(morningClass, afternoonClass);

    // Assign teachers to classes
    const departmentId = course.departmentId;
    const eligibleTeachers = seedData.teachers.filter((teacher) =>
      teacher.departments.some((dept) => dept.id === departmentId),
    );

    if (eligibleTeachers.length > 0) {
      // Assign for morning class
      const morningTeacher = eligibleTeachers[0];
      const morningAssignment = classAssignmentRepository.create({
        teacherId: morningTeacher.id,
        classId: morningClass.id,
        teacher: morningTeacher,
        classRoom: morningClass,
      });
      await classAssignmentRepository.save(morningAssignment);

      // Assign for afternoon class (use a different teacher if available)
      const afternoonTeacher =
        eligibleTeachers.length > 1 ? eligibleTeachers[1] : eligibleTeachers[0];
      const afternoonAssignment = classAssignmentRepository.create({
        teacherId: afternoonTeacher.id,
        classId: afternoonClass.id,
        teacher: afternoonTeacher,
        classRoom: afternoonClass,
      });
      await classAssignmentRepository.save(afternoonAssignment);
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
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      country: 'USA',
    },
    {
      addressLine1: '456 Oak Ave',
      addressLine2: undefined,
      city: 'Chicago',
      country: 'USA',
    },
    {
      addressLine1: '789 Pine Rd',
      addressLine2: 'Suite 101',
      city: 'Los Angeles',
      country: 'USA',
    },
    {
      addressLine1: '101 Maple Dr',
      addressLine2: undefined,
      city: 'Houston',
      country: 'USA',
    },
    {
      addressLine1: '202 Cedar Ln',
      addressLine2: 'Unit 7',
      city: 'Miami',
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
    },
    {
      firstName: 'Jennifer',
      lastName: 'Wilson',
      relationshipToStudent: RelationshipToStudent.Mother,
      contactNumber1: '555-234-5678',
      contactNumber2: undefined,
      email: 'jennifer.wilson@example.com',
      occupation: 'Doctor',
    },
    {
      firstName: 'David',
      lastName: 'Taylor',
      relationshipToStudent: RelationshipToStudent.Father,
      contactNumber1: '555-345-6789',
      contactNumber2: undefined,
      email: 'david.taylor@example.com',
      occupation: 'Accountant',
    },
  ];

  for (const data of parentData) {
    const parent = parentRepository.create(data);
    await parentRepository.save(parent);
    seedData.parents.push(parent);

    // Assign an address to each parent
    const address = seedData.addresses[seedData.parents.indexOf(parent)];

    const parentAddress = parentAddressRepository.create({
      parent: parent,
      address: address,
      addressType: 'Home',
    });

    await parentAddressRepository.save(parentAddress);
    seedData.parentAddresses.push(parentAddress);
  }

  console.log(`Created ${parentData.length} parents with addresses`);
  return seedData.parents;
}

async function seedStudents(): Promise<Student[]> {
  const studentRepository = AppDataSource.getRepository(Student);
  const userRepository = AppDataSource.getRepository(User);
  const studentAddressRepository = AppDataSource.getRepository(StudentAddress);
  console.log('Seeding students...');

  const studentData = [
    {
      firstName: 'Alex',
      lastName: 'Brown',
      email: 'alex.brown@student.edu',
      gender: Gender.Male,
      contactNumber: '555-111-2222',
      dob: new Date(2000, 5, 15),
      enrollmentDate: new Date(2022, 8, 1),
      parentId: seedData.parents[0].id,
    },
    {
      firstName: 'Jessica',
      lastName: 'Wilson',
      email: 'jessica.wilson@student.edu',
      gender: Gender.Female,
      contactNumber: '555-222-3333',
      dob: new Date(2001, 2, 22),
      enrollmentDate: new Date(2022, 8, 1),
      parentId: seedData.parents[1].id,
    },
    {
      firstName: 'Ethan',
      lastName: 'Taylor',
      email: 'ethan.taylor@student.edu',
      gender: Gender.Male,
      contactNumber: '555-333-4444',
      dob: new Date(2000, 11, 7),
      enrollmentDate: new Date(2022, 8, 1),
      parentId: seedData.parents[2].id,
    },
    {
      firstName: 'Olivia',
      lastName: 'Brown',
      email: 'olivia.brown@student.edu',
      gender: Gender.Female,
      contactNumber: '555-444-5555',
      dob: new Date(2001, 7, 30),
      enrollmentDate: new Date(2023, 8, 1),
      parentId: seedData.parents[0].id,
    },
  ];

  for (const data of studentData) {
    // Get parent
    const parent = seedData.parents.find((p) => p.id === data.parentId);

    // Create student
    const student = studentRepository.create({
      ...data,
      parent: parent,
    });
    await studentRepository.save(student);

    // Create associated user account
    const user = userRepository.create({
      email: data.email,
      username: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}`,
      password: 'password123',
      role: Role.Student,
      studentId: student.id,
      isActive: true,
    });
    await userRepository.save(user);

    // Update the student with user reference
    student.user = user;
    await studentRepository.save(student);

    // Assign an address to each student
    const address =
      seedData.addresses[studentData.indexOf(data) % seedData.addresses.length];

    // Using student and address objects directly instead of IDs
    const studentAddress = studentAddressRepository.create({
      student: student,
      address: address,
      addressType: 'Home',
    });

    await studentAddressRepository.save(studentAddress);

    seedData.students.push(student);
    seedData.users.push(user);
    seedData.studentAddresses.push(studentAddress);
  }

  console.log(
    `Created ${studentData.length} students with user accounts and addresses`,
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
    // Initialize connection
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Seed basic entities first
    await seedAdminUser();
    await seedDepartments();
    await seedRooms();
    await seedSemesters();
    await seedAddresses();
    await seedParents();

    // Seed entities with dependencies
    await seedTeachers();
    await seedCourses();
    await seedClasses();
    await seedStudents();
    await seedEnrollments();

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:');
    if (error instanceof Error) {
      console.error(error.stack);
    } else {
      console.error(error);
    }
    process.exit(1);
  } finally {
    // Close connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the seed script
void main();
