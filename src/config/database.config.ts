import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Builds the TypeORM connection options from environment variables (.env).
 * No credentials are hardcoded here: they all come from the environment.
 */
export function buildDatabaseConfig(
  config: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: Number(config.get<string>('DB_PORT', '3306')),
    username: config.getOrThrow<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD', ''),
    database: config.getOrThrow<string>('DB_NAME'),
    // Entities registered with TypeOrmModule.forFeature() are loaded automatically
    autoLoadEntities: true,
    // Auto-create/update tables in development only (DB_SYNC=true)
    synchronize: config.get<string>('DB_SYNC', 'false') === 'true',
  };
}
