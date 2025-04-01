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
  const teacherAddressRepository = AppDataSource.getRepository(TeacherAddress);
  console.log('Seeding teachers...');

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
      teacher: teacher,
    });
    await userRepository.save(user);

    // Update the teacher object
    teacher.user = user;

    // Also set the teacher's salary
    await teacherRepository.update(teacher.id, { salary: data.salary });

    // Initialize departments array and add the department
    const department = seedData.departments.find(
      (dept) => dept.id === data.departmentId,
    );
    if (department) {
      teacher.departments = [department];
    }

    // Assign an address to each teacher
    const addressIndex = seedData.teachers.length % seedData.addresses.length;
    const address = seedData.addresses[addressIndex];

    const teacherAddress = teacherAddressRepository.create({
      teacherId: teacher.id,
      addressId: address.id,
      addressType: 'Primary',
      teacher: teacher,
      address: address,
    });

    await teacherAddressRepository.save(teacherAddress);

    seedData.teachers.push(teacher);
  }

  console.log(
    `Created ${teacherData.length} teachers with user accounts and addresses`,
  );
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
      address: '123 Main St, Apt 4B',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    {
      address: '456 Oak Ave',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA',
    },
    {
      address: '789 Pine Rd, Suite 101',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'USA',
    },
    {
      address: '101 Maple Dr',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'USA',
    },
    {
      address: '202 Cedar Ln, Unit 7',
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
    `Created ${parentData.length} parents with addresses and emergency contacts`,
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
