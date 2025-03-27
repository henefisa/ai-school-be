import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth';
import { SharedModule } from './shared/shared.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { HttpMiddleware } from './shared/middlewares/http.middleware';
import { UsersModule } from './modules/users/users.module';
import { User } from './typeorm/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        namingStrategy: new SnakeNamingStrategy(),
        database: configService.get('DB_DATABASE'),
        entities: [User],
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
    }),
    SharedModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
