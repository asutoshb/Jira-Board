import { DataSource } from 'typeorm';

import * as entities from 'entities';

// Create and export DataSource for TypeORM 0.3.x
const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT) || 5432;
const username = process.env.DB_USERNAME || 'asutoshbhere';
const database = process.env.DB_DATABASE || 'jira_development';

const dataSource = new DataSource({
  type: 'postgres',
  host,
  port,
  username,
  database,
  entities: Object.values(entities),
  synchronize: true,
  logging: false,
  // Only add password if explicitly set
  ...(process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== ''
    ? { password: process.env.DB_PASSWORD }
    : {}),
  // Connection pool configuration
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
  },
});

const createDatabaseConnection = (): Promise<DataSource> => {
  return dataSource.initialize();
};

export default createDatabaseConnection;
export { dataSource };
