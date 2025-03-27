import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from 'src/typeorm/entities/student.entity';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { UsersModule } from '../users/users.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { nanoid } from 'nanoid';
import * as path from 'path';
import * as fs from 'fs';
import { Parent } from 'src/typeorm/entities/parent.entity';
import { Address } from 'src/typeorm/entities/address.entity';
import { StudentAddress } from 'src/typeorm/entities/student-address.entity';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads/students');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Parent, Address, StudentAddress]),
    UsersModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (
          _req: Express.Request,
          _file: Express.Multer.File,
          callback: (error: Error | null, destination: string) => void,
        ) => {
          callback(null, uploadsDir);
        },
        filename: (
          _req: Express.Request,
          file: Express.Multer.File,
          callback: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueSuffix = nanoid();
          const ext = path.extname(file.originalname);
          const fileName = `${uniqueSuffix}${ext}`;
          callback(null, fileName);
        },
      }),
      fileFilter: (
        _req: Express.Request,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
