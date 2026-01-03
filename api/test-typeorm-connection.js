require('dotenv').config();
const { createConnection } = require('typeorm');
const { Project, User, Issue, Comment } = require('./src/entities');

async function test() {
  try {
    console.log('Testing TypeORM connection...');
    const connection = await createConnection({
      type: 'postgres',
      username: 'asutoshbhere',
      database: 'jira_development',
      entities: [Project, User, Issue, Comment],
      synchronize: false, // Don't sync for test
    });
    console.log('✅ TypeORM connection successful!');
    await connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ TypeORM connection failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();
