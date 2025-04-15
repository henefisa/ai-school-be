import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from 'src/typeorm/entities/teacher.entity';
import { User } from 'src/typeorm/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AddressesModule } from '../addresses/addresses.module';
import { DepartmentsModule } from '../departments/departments.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { nanoid } from 'nanoid';
import * as path from 'path';
import { ServeStaticModule } from '../serve-static/serve-static.module';
import { DEFAULT_MAX_FILE_SIZE } from '../serve-static/serve-static.constants';

// Define the uploads directory path
const uploadsDir = path.join(process.cwd(), 'uploads/teachers');

@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher, User]),
    UsersModule,
    AddressesModule,
    DepartmentsModule,
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
  providers: [TeachersService],
  controllers: [TeachersController],
  exports: [TeachersService],
})
export class TeachersModule {}
