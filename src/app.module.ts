import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { buildDatabaseConfig } from './config/database.config.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    // Loads variables from .env and makes ConfigService available everywhere
    ConfigModule.forRoot({ isGlobal: true }),
    // MySQL connection through TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildDatabaseConfig,
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
