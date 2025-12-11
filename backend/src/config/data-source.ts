import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * TypeORM DataSource configuration for CLI operations (migrations)
 * This file is used by TypeORM CLI commands and is separate from NestJS app config
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'ideahub',
  password: process.env.DATABASE_PASSWORD || 'ideahub_secret',
  database: process.env.DATABASE_NAME || 'ideahub',

  // Entity paths - using glob pattern for all entities
  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],

  // Migration configuration
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],

  // CRITICAL: Always false for CLI - migrations handle schema changes
  synchronize: false,

  // Logging for debugging migrations
  logging: process.env.NODE_ENV !== 'production',
};

// Export DataSource instance for TypeORM CLI
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
