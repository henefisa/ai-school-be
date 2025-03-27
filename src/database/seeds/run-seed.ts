import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../../typeorm/entities/user.entity';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import * as path from 'path';

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
  entities: [User],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: true,
  logger: 'advanced-console' as const,
};

console.log('Database configuration:', {
  ...dbConfig,
  password: '******', // Don't log the actual password
});

const AppDataSource = new DataSource(dbConfig);

async function seedAdminUser(): Promise<void> {
  const userRepository = AppDataSource.getRepository(User);

  console.log('Starting database seeding...');

  const adminEmail = 'admin@example.com';
  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists:', {
      email: existingAdmin.email,
      role: existingAdmin.role,
    });
    return;
  }

  const hashedPassword = await argon2.hash('admin123');
  const adminUser = userRepository.create({
    email: adminEmail,
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    phoneNumber: '1234567890',
    address: 'Admin Address',
    isActive: true,
  });

  await userRepository.save(adminUser);
  console.log('Admin user created successfully:', {
    email: adminUser.email,
    role: adminUser.role,
  });
}

async function main() {
  try {
    // Initialize connection
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Run seed operations
    await seedAdminUser();

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
