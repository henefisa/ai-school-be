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
import { Parent } from 'src/typeorm/entities/parent.entity';
import { Address } from 'src/typeorm/entities/address.entity';
import { StudentAddress } from 'src/typeorm/entities/student-address.entity';
import { ParentsModule } from '../parents/parents.module';
import { ServeStaticModule } from '../serve-static/serve-static.module';
import { FileStorageService } from '../../shared/services/file-storage.service';
import { DEFAULT_MAX_FILE_SIZE } from '../serve-static/serve-static.constants';

// Define the uploads directory path
const uploadsDir = path.join(process.cwd(), 'uploads/students');

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Parent, Address, StudentAddress]),
    UsersModule,
    ParentsModule,
    ServeStaticModule,
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
        fileSize: DEFAULT_MAX_FILE_SIZE,
      },
    }),
  ],
  controllers: [StudentsController],
  providers: [StudentsService, FileStorageService],
  exports: [StudentsService],
})
export class StudentsModule {}
