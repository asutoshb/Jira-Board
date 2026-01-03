import 'module-alias/register';
import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';

import createDatabaseConnection from 'database/createConnection';
import { addRespondToResponse } from 'middleware/response';
import { authenticateUser } from 'middleware/authentication';
import { handleError } from 'middleware/errors';
import { RouteNotFoundError } from 'errors';

import { attachPublicRoutes, attachPrivateRoutes } from './routes';

const establishDatabaseConnection = async (): Promise<void> => {
  try {
    console.log('Connecting to database...');
    console.log('Host:', process.env.DB_HOST || 'localhost');
    console.log('Database:', process.env.DB_DATABASE || 'jira_development');
    console.log('Username:', process.env.DB_USERNAME || 'asutoshbhere');

    const dataSource = await createDatabaseConnection();

    console.log('✅ Database connection established successfully');
    console.log('Connected to database:', dataSource.options.database);

    // Verify connection is active
    await dataSource.query('SELECT 1');
    console.log('✅ Database connection verified');
  } catch (error) {
    console.error('❌ Database connection failed:');
    const err = error;
    console.error('Error message:', err?.message || 'Unknown error');
    console.error('Error code:', err?.code || 'N/A');
    if (err?.stack) {
      console.error('Error stack (first 10 lines):');
      console.error(
        err.stack
          .split('\n')
          .slice(0, 10)
          .join('\n'),
      );
    }
    throw error;
  }
};

const initializeExpress = (): void => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded());

  app.use(addRespondToResponse);

  attachPublicRoutes(app);

  app.use('/', authenticateUser);

  attachPrivateRoutes(app);

  app.use((req, _res, next) => next(new RouteNotFoundError(req.originalUrl)));
  app.use(handleError);

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`✅ Server is running on port ${port}`);
  });
};

const initializeApp = async (): Promise<void> => {
  try {
    await establishDatabaseConnection();
    initializeExpress();
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    process.exit(1);
  }
};

initializeApp().catch(error => {
  console.error('❌ Unhandled error during initialization:', error);
  process.exit(1);
});
