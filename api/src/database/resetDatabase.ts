import { DataSource } from 'typeorm';

const resetDatabase = async (): Promise<void> => {
  // Updated for TypeORM 0.3.x - use DataSource
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'asutoshbhere',
    database: process.env.DB_DATABASE || 'jira_development',
    ...(process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== ''
      ? { password: process.env.DB_PASSWORD }
      : {}),
  });

  await dataSource.initialize();
  await dataSource.dropDatabase();
  await dataSource.synchronize();
  await dataSource.destroy();
};

export default resetDatabase;
