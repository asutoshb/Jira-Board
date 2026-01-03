# Module 1: Database & Connection Setup - Complete Implementation Guide

This guide provides step-by-step instructions and complete code for implementing Module 1.

---

## Overview

Module 1 establishes the foundation of the application by:
1. Setting up the database connection using TypeORM
2. Defining all entity models (Project, Issue, User, Comment)
3. Creating database seeding logic for guest accounts

---

## Step 1: Create Constants Files

First, we need to define the enums that entities will use.

### File: `api/src/constants/issues.ts`

```typescript
/**
 * Issue Type Enum
 * Defines the types of issues that can be created
 */
export enum IssueType {
  TASK = 'task',    // Regular task
  BUG = 'bug',      // Software bug
  STORY = 'story',  // User story
}

/**
 * Issue Status Enum
 * Represents the Kanban board columns
 */
export enum IssueStatus {
  BACKLOG = 'backlog',        // Not yet selected for work
  SELECTED = 'selected',      // Selected but not started
  INPROGRESS = 'inprogress',  // Currently being worked on
  DONE = 'done',              // Completed
}

/**
 * Issue Priority Enum
 * Priority levels from highest (5) to lowest (1)
 */
export enum IssuePriority {
  HIGHEST = '5',
  HIGH = '4',
  MEDIUM = '3',
  LOW = '2',
  LOWEST = '1',
}
```

### File: `api/src/constants/projects.ts`

```typescript
/**
 * Project Category Enum
 * Categories for different types of projects
 */
export enum ProjectCategory {
  SOFTWARE = 'software',
  MARKETING = 'marketing',
  BUSINESS = 'business',
}
```

---

## Step 2: Create Entity Models

### File: `api/src/entities/Project.ts`

```typescript
import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import is from 'utils/validation';
import { ProjectCategory } from 'constants/projects';
import { Issue, User } from '.';

/**
 * Project Entity
 * Represents a project that contains issues and users
 * 
 * Relationships:
 * - One Project has Many Issues
 * - One Project has Many Users
 */
@Entity()
class Project extends BaseEntity {
  /**
   * Validation rules for Project fields
   * Used by the validation utility to validate input
   */
  static validations = {
    name: [is.required(), is.maxLength(100)],
    url: is.url(),
    category: [is.required(), is.oneOf(Object.values(ProjectCategory))],
  };

  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  url: string | null;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('varchar')
  category: ProjectCategory;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  /**
   * One-to-Many relationship with Issues
   * A project can have many issues
   */
  @OneToMany(
    () => Issue,
    issue => issue.project,
  )
  issues: Issue[];

  /**
   * One-to-Many relationship with Users
   * A project can have many users (team members)
   */
  @OneToMany(
    () => User,
    user => user.project,
  )
  users: User[];
}

export default Project;
```

### File: `api/src/entities/User.ts`

```typescript
import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';

import is from 'utils/validation';
import { Comment, Issue, Project } from '.';

/**
 * User Entity
 * Represents a user/team member in the system
 * 
 * Relationships:
 * - Many Users belong to One Project
 * - One User has Many Comments
 * - Many Users can be assigned to Many Issues (Many-to-Many)
 */
@Entity()
class User extends BaseEntity {
  /**
   * Validation rules for User fields
   */
  static validations = {
    name: [is.required(), is.maxLength(100)],
    email: [is.required(), is.email(), is.maxLength(200)],
  };

  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  name: string;

  @Column('varchar')
  email: string;

  @Column('varchar', { length: 2000 })
  avatarUrl: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  /**
   * One-to-Many relationship with Comments
   * A user can write many comments
   */
  @OneToMany(
    () => Comment,
    comment => comment.user,
  )
  comments: Comment[];

  /**
   * Many-to-Many relationship with Issues
   * A user can be assigned to many issues
   * An issue can have many assignees (users)
   */
  @ManyToMany(
    () => Issue,
    issue => issue.users,
  )
  issues: Issue[];

  /**
   * Many-to-One relationship with Project
   * Many users belong to one project
   */
  @ManyToOne(
    () => Project,
    project => project.users,
  )
  project: Project;

  /**
   * RelationId decorator automatically creates a projectId column
   * This is the foreign key to the Project table
   */
  @RelationId((user: User) => user.project)
  projectId: number;
}

export default User;
```

### File: `api/src/entities/Issue.ts`

```typescript
import striptags from 'striptags';
import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  RelationId,
  BeforeUpdate,
  BeforeInsert,
} from 'typeorm';

import is from 'utils/validation';
import { IssueType, IssueStatus, IssuePriority } from 'constants/issues';
import { Comment, Project, User } from '.';

/**
 * Issue Entity
 * Represents a work item (task, bug, or story) in a project
 * 
 * Relationships:
 * - Many Issues belong to One Project
 * - One Issue has Many Comments
 * - Many Issues can have Many Users (assignees) - Many-to-Many
 */
@Entity()
class Issue extends BaseEntity {
  /**
   * Validation rules for Issue fields
   */
  static validations = {
    title: [is.required(), is.maxLength(200)],
    type: [is.required(), is.oneOf(Object.values(IssueType))],
    status: [is.required(), is.oneOf(Object.values(IssueStatus))],
    priority: [is.required(), is.oneOf(Object.values(IssuePriority))],
    listPosition: is.required(),
    reporterId: is.required(),
  };

  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  title: string;

  @Column('varchar')
  type: IssueType;

  @Column('varchar')
  status: IssueStatus;

  @Column('varchar')
  priority: IssuePriority;

  /**
   * List position determines the order of issues within a status column
   * Lower numbers appear first (top of column)
   */
  @Column('double precision')
  listPosition: number;

  /**
   * Description stored as HTML (from rich text editor)
   */
  @Column('text', { nullable: true })
  description: string | null;

  /**
   * Plain text version of description (auto-generated)
   * Used for full-text search
   */
  @Column('text', { nullable: true })
  descriptionText: string | null;

  /**
   * Time estimate in hours
   */
  @Column('integer', { nullable: true })
  estimate: number | null;

  /**
   * Time already spent in hours
   */
  @Column('integer', { nullable: true })
  timeSpent: number | null;

  /**
   * Time remaining in hours
   */
  @Column('integer', { nullable: true })
  timeRemaining: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  /**
   * ID of the user who created/reported this issue
   */
  @Column('integer')
  reporterId: number;

  /**
   * Many-to-One relationship with Project
   * Many issues belong to one project
   */
  @ManyToOne(
    () => Project,
    project => project.issues,
  )
  project: Project;

  @Column('integer')
  projectId: number;

  /**
   * One-to-Many relationship with Comments
   * One issue can have many comments
   */
  @OneToMany(
    () => Comment,
    comment => comment.issue,
  )
  comments: Comment[];

  /**
   * Many-to-Many relationship with Users (assignees)
   * An issue can have multiple assignees
   * A user can be assigned to multiple issues
   * 
   * @JoinTable() means Issue owns the relationship
   * (the join table will be named issue_users)
   */
  @ManyToMany(
    () => User,
    user => user.issues,
  )
  @JoinTable()
  users: User[];

  /**
   * RelationId automatically creates userIds array
   * Contains the IDs of assigned users
   */
  @RelationId((issue: Issue) => issue.users)
  userIds: number[];

  /**
   * Lifecycle hook: Before Insert or Update
   * Automatically generates plain text version of description
   * This is used for full-text search functionality
   */
  @BeforeInsert()
  @BeforeUpdate()
  setDescriptionText = (): void => {
    if (this.description) {
      this.descriptionText = striptags(this.description);
    }
  };
}

export default Issue;
```

### File: `api/src/entities/Comment.ts`

```typescript
import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

import is from 'utils/validation';
import { Issue, User } from '.';

/**
 * Comment Entity
 * Represents a comment on an issue
 * 
 * Relationships:
 * - Many Comments belong to One Issue
 * - Many Comments belong to One User (author)
 */
@Entity()
class Comment extends BaseEntity {
  /**
   * Validation rules for Comment fields
   */
  static validations = {
    body: [is.required(), is.maxLength(50000)],
  };

  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Comment body stored as HTML (from rich text editor)
   */
  @Column('text')
  body: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  /**
   * Many-to-One relationship with User
   * Many comments belong to one user (author)
   */
  @ManyToOne(
    () => User,
    user => user.comments,
  )
  user: User;

  @Column('integer')
  userId: number;

  /**
   * Many-to-One relationship with Issue
   * Many comments belong to one issue
   * 
   * onDelete: 'CASCADE' means if an issue is deleted,
   * all its comments are automatically deleted
   */
  @ManyToOne(
    () => Issue,
    issue => issue.comments,
    { onDelete: 'CASCADE' },
  )
  issue: Issue;

  @Column('integer')
  issueId: number;
}

export default Comment;
```

### File: `api/src/entities/index.ts`

```typescript
/**
 * Central export file for all entities
 * This makes it easy to import entities from a single location
 */
export { default as Comment } from './Comment';
export { default as Issue } from './Issue';
export { default as Project } from './Project';
export { default as User } from './User';
```

---

## Step 3: Create Database Connection

### File: `api/src/database/createConnection.ts`

```typescript
import { DataSource } from 'typeorm';

import * as entities from 'entities';

/**
 * Database Connection Configuration
 * 
 * This file sets up the TypeORM DataSource for connecting to PostgreSQL
 * 
 * Key points:
 * - Uses DataSource (TypeORM 0.3.x API)
 * - Reads configuration from environment variables
 * - Registers all entities
 * - Enables synchronize for auto schema creation (development only)
 * - Configures connection pool
 */

// Read database configuration from environment variables
const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT) || 5432;
const username = process.env.DB_USERNAME || 'asutoshbhere';
const database = process.env.DB_DATABASE || 'jira_development';

/**
 * Create DataSource instance
 * This is the modern TypeORM way (0.3.x) instead of createConnection
 */
const dataSource = new DataSource({
  type: 'postgres',
  host,
  port,
  username,
  database,
  // Register all entities
  entities: Object.values(entities),
  // Auto-create/update database schema (development only!)
  // In production, use migrations instead
  synchronize: true,
  // Set to true to see SQL queries in console
  logging: false,
  // Only add password if explicitly set
  // Empty password means trust authentication (peer auth on Unix socket)
  ...(process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== ''
    ? { password: process.env.DB_PASSWORD }
    : {}),
  // Connection pool configuration
  extra: {
    max: 10, // Maximum number of connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  },
});

/**
 * Initialize database connection
 * This function is called when the server starts
 * 
 * @returns Promise<DataSource> - The initialized DataSource
 */
const createDatabaseConnection = (): Promise<DataSource> => {
  return dataSource.initialize();
};

export default createDatabaseConnection;
export { dataSource };
```

---

## Step 4: Create Guest Account Seeder

### File: `api/src/database/createGuestAccount.ts`

```typescript
import { Comment, Issue, Project, User } from 'entities';
import { ProjectCategory } from 'constants/projects';
import { IssueType, IssueStatus, IssuePriority } from 'constants/issues';
import { createEntity } from 'utils/typeorm';

/**
 * Guest Account Seeder
 * 
 * This file creates sample data for guest users:
 * - 3 users (Pickle Rick, Baby Yoda, Lord Gaben)
 * - 1 project (singularity 1.0)
 * - 8 sample issues with various types, statuses, and priorities
 * - Comments on issues
 * 
 * This is called when a guest user first visits the app
 */

/**
 * Seed Users
 * Creates 3 guest users with avatars
 */
const seedUsers = (): Promise<User[]> => {
  const users = [
    createEntity(User, {
      email: 'rick@jira.guest',
      name: 'Pickle Rick',
      avatarUrl: 'https://i.ibb.co/7JM1P2r/picke-rick.jpg',
    }),
    createEntity(User, {
      email: 'yoda@jira.guest',
      name: 'Baby Yoda',
      avatarUrl: 'https://i.ibb.co/6n0hLML/baby-yoda.jpg',
    }),
    createEntity(User, {
      email: 'gaben@jira.guest',
      name: 'Lord Gaben',
      avatarUrl: 'https://i.ibb.co/6RJ5hq6/gaben.jpg',
    }),
  ];
  return Promise.all(users);
};

/**
 * Seed Project
 * Creates a project and assigns users to it
 */
const seedProject = (users: User[]): Promise<Project> =>
  createEntity(Project, {
    name: 'singularity 1.0',
    url: 'https://www.atlassian.com/software/jira',
    description:
      'Plan, track, and manage your agile and software development projects in Jira. Customize your workflow, collaborate, and release great software.',
    category: ProjectCategory.SOFTWARE,
    users, // Assign all users to the project
  });

/**
 * Seed Issues
 * Creates 8 sample issues with different types, statuses, and priorities
 * These issues demonstrate various features of the application
 */
const seedIssues = (project: Project): Promise<Issue[]> => {
  const { users } = project;

  const issues = [
    // Issue 1: Task in Backlog
    createEntity(Issue, {
      title: 'This is an issue of type: Task.',
      type: IssueType.TASK,
      status: IssueStatus.BACKLOG,
      priority: IssuePriority.HIGH,
      listPosition: 1,
      description: `<p>Your teams can collaborate in Jira applications by breaking down pieces of work into issues. Issues can represent tasks, software bugs, feature requests or any other type of project work.</p><p><br></p><h3>Jira Software&nbsp;(software projects) issue types:</h3><p><br></p><h1><strong>Bug </strong><span style="background-color: initial;">🐞</span></h1><p>A bug is a problem which impairs or prevents the functions of a product.</p><p><br></p><h1><strong>Story </strong><span style="color: rgb(51, 51, 51);">📗</span></h1><p>A user story is the smallest unit of work that needs to be done.</p><p><br></p><h1><strong>Task </strong><span style="color: rgb(51, 51, 51);">🗳</span></h1><p>A task represents work that needs to be done.</p>`,
      estimate: 8,
      timeSpent: 4,
      reporterId: users[1].id, // Baby Yoda reported
      project,
      users: [users[0]], // Pickle Rick assigned
    }),

    // Issue 2: Task in Backlog
    createEntity(Issue, {
      title: "Click on an issue to see what's behind it.",
      type: IssueType.TASK,
      status: IssueStatus.BACKLOG,
      priority: IssuePriority.LOW,
      listPosition: 2,
      description: `<h2>Key terms to know</h2><p><br></p><h3>Issues</h3><p>A Jira 'issue' refers to a single work item of any type or size that is tracked from creation to completion.</p>`,
      estimate: 5,
      timeSpent: 2,
      reporterId: users[2].id, // Lord Gaben reported
      project,
      users: [users[0]], // Pickle Rick assigned
    }),

    // Issue 3: Story in Backlog
    createEntity(Issue, {
      title: 'Try dragging issues to different columns to transition their status.',
      type: IssueType.STORY,
      status: IssueStatus.BACKLOG,
      priority: IssuePriority.MEDIUM,
      listPosition: 3,
      description: `<p>An issue's status indicates its current place in the project's workflow.</p>`,
      estimate: 15,
      timeSpent: 12,
      reporterId: users[1].id, // Baby Yoda reported
      project,
      // No assignees
    }),

    // Issue 4: Story in Backlog
    createEntity(Issue, {
      title: 'You can use rich text with images in issue descriptions.',
      type: IssueType.STORY,
      status: IssueStatus.BACKLOG,
      priority: IssuePriority.LOWEST,
      listPosition: 4,
      description: `<h1>Rich text content with emojis</h1>`,
      estimate: 4,
      timeSpent: 4,
      reporterId: users[0].id, // Pickle Rick reported
      project,
      users: [users[2]], // Lord Gaben assigned
    }),

    // Issue 5: Task in Selected
    createEntity(Issue, {
      title: 'Each issue can be assigned priority from lowest to highest.',
      type: IssueType.TASK,
      status: IssueStatus.SELECTED,
      priority: IssuePriority.HIGHEST,
      listPosition: 5,
      description: `<p>An issue's priority indicates its relative importance.</p>`,
      estimate: 4,
      timeSpent: 1,
      reporterId: users[2].id, // Lord Gaben reported
      project,
      // No assignees
    }),

    // Issue 6: Story in Selected
    createEntity(Issue, {
      title: 'Each issue has a single reporter but can have multiple assignees.',
      type: IssueType.STORY,
      status: IssueStatus.SELECTED,
      priority: IssuePriority.HIGH,
      listPosition: 6,
      description: `<h2>Try assigning users to this issue.</h2>`,
      estimate: 6,
      timeSpent: 3,
      reporterId: users[1].id, // Baby Yoda reported
      project,
      users: [users[1], users[2]], // Baby Yoda and Lord Gaben assigned
    }),

    // Issue 7: Task in In Progress
    createEntity(Issue, {
      title: 'You can track how many hours were spent working on an issue, and how many hours remain.',
      type: IssueType.TASK,
      status: IssueStatus.INPROGRESS,
      priority: IssuePriority.LOWEST,
      listPosition: 7,
      description: `<p>Before you start work on an issue, you can set a time estimate.</p>`,
      estimate: 12,
      timeSpent: 11,
      reporterId: users[0].id, // Pickle Rick reported
      project,
      // No assignees
    }),

    // Issue 8: Task in Done
    createEntity(Issue, {
      title: 'Try leaving a comment on this issue.',
      type: IssueType.TASK,
      status: IssueStatus.DONE,
      priority: IssuePriority.MEDIUM,
      listPosition: 7,
      description: `<p>Adding comments to an issue is a useful way to record additional detail.</p>`,
      estimate: 10,
      timeSpent: 2,
      reporterId: users[0].id, // Pickle Rick reported
      project,
      users: [users[1]], // Baby Yoda assigned
    }),
  ];
  return Promise.all(issues);
};

/**
 * Seed Comments
 * Creates comments on issues (one per issue)
 */
const seedComments = (issues: Issue[], users: User[]): Promise<Comment[]> => {
  const comments = [
    createEntity(Comment, {
      body: 'An old silent pond...\nA frog jumps into the pond,\nsplash! Silence again.',
      issueId: issues[0].id,
      userId: users[2].id, // Lord Gaben commented
    }),
    createEntity(Comment, {
      body: 'Autumn moonlight-\na worm digs silently\ninto the chestnut.',
      issueId: issues[1].id,
      userId: users[2].id,
    }),
    createEntity(Comment, {
      body: 'In the twilight rain\nthese brilliant-hued hibiscus -\nA lovely sunset.',
      issueId: issues[2].id,
      userId: users[2].id,
    }),
    createEntity(Comment, {
      body: 'A summer river being crossed\nhow pleasing\nwith sandals in my hands!',
      issueId: issues[3].id,
      userId: users[2].id,
    }),
    createEntity(Comment, {
      body: "Light of the moon\nMoves west, flowers' shadows\nCreep eastward.",
      issueId: issues[4].id,
      userId: users[2].id,
    }),
    createEntity(Comment, {
      body: 'In the moonlight,\nThe color and scent of the wisteria\nSeems far away.',
      issueId: issues[5].id,
      userId: users[2].id,
    }),
    createEntity(Comment, {
      body: 'O snail\nClimb Mount Fuji,\nBut slowly, slowly!',
      issueId: issues[6].id,
      userId: users[2].id,
    }),
    createEntity(Comment, {
      body: 'Everything I touch\nwith tenderness, alas,\npricks like a bramble.',
      issueId: issues[7].id,
      userId: users[2].id,
    }),
  ];
  return Promise.all(comments);
};

/**
 * Create Guest Account
 * Main function that orchestrates the seeding process
 * 
 * @returns Promise<User> - Returns the guest user (Lord Gaben)
 */
const createGuestAccount = async (): Promise<User> => {
  // Step 1: Create users
  const users = await seedUsers();
  
  // Step 2: Create project and assign users
  const project = await seedProject(users);
  
  // Step 3: Create issues
  const issues = await seedIssues(project);
  
  // Step 4: Create comments
  await seedComments(issues, project.users);
  
  // Return the guest user (Lord Gaben - users[2])
  return users[2];
};

export default createGuestAccount;
```

---

## Step 5: Environment Configuration

### File: `api/.env`

Create a `.env` file in the `api` directory:

```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=asutoshbhere
DB_PASSWORD=
DB_DATABASE=jira_development
JWT_SECRET=development12345
PORT=3000
```

**Note**: Adjust `DB_USERNAME` and `DB_PASSWORD` based on your PostgreSQL setup.

---

## Step 6: Understanding the Code

### TypeORM Concepts

1. **Entities**: Classes decorated with `@Entity()` that represent database tables
2. **Decorators**: 
   - `@Column()`: Defines a column
   - `@PrimaryGeneratedColumn()`: Auto-incrementing primary key
   - `@CreateDateColumn()`: Auto-managed creation timestamp
   - `@UpdateDateColumn()`: Auto-managed update timestamp
3. **Relationships**:
   - `@OneToMany()`: One entity has many related entities
   - `@ManyToOne()`: Many entities belong to one entity
   - `@ManyToMany()`: Many-to-many relationship with join table
4. **Lifecycle Hooks**:
   - `@BeforeInsert()`: Runs before entity is inserted
   - `@BeforeUpdate()`: Runs before entity is updated

### Database Schema

After running this code, the following tables will be created:

```
projects
  - id (PK, auto-increment)
  - name
  - url
  - description
  - category
  - createdAt
  - updatedAt

users
  - id (PK, auto-increment)
  - name
  - email
  - avatarUrl
  - projectId (FK → projects.id)
  - createdAt
  - updatedAt

issues
  - id (PK, auto-increment)
  - title
  - type
  - status
  - priority
  - listPosition
  - description
  - descriptionText
  - estimate
  - timeSpent
  - timeRemaining
  - reporterId (FK → users.id)
  - projectId (FK → projects.id)
  - createdAt
  - updatedAt

comments
  - id (PK, auto-increment)
  - body
  - userId (FK → users.id)
  - issueId (FK → issues.id)
  - createdAt
  - updatedAt

issue_users (join table for many-to-many)
  - issueId (FK → issues.id)
  - userId (FK → users.id)
```

---

## Step 7: Testing the Connection

To test if Module 1 is working correctly:

1. **Start PostgreSQL**: Ensure your database is running
2. **Create Database**: 
   ```bash
   createdb jira_development
   ```
3. **Start the API**: 
   ```bash
   cd api
   npm start
   ```
4. **Check Console**: You should see:
   - "Connecting to database..."
   - "✅ Database connection established successfully"
   - "✅ Database connection verified"
   - "✅ Server is running on port 3000"

If you see errors, check:
- PostgreSQL is running
- Database exists
- `.env` file has correct credentials
- All dependencies are installed (`npm install`)

---

## Dependencies Required

Make sure these are in `package.json`:

```json
{
  "dependencies": {
    "typeorm": "^0.3.28",
    "pg": "^8.16.3",
    "striptags": "^3.1.1",
    "dotenv": "^8.2.0"
  }
}
```

---

## Next Steps

After completing Module 1, you'll have:
- ✅ Database connection working
- ✅ All entity models defined
- ✅ Database seeding logic ready

**Next Module**: Module 7 (Error Handling & Validation) or Module 8 (API Infrastructure) - these are needed before implementing the controllers.

---

## Common Issues & Solutions

### Issue: "Cannot find module 'entities'"
**Solution**: Make sure `tsconfig.json` has path aliases configured:
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "*": ["./*"]
    }
  }
}
```

### Issue: "Database connection timeout"
**Solution**: 
- Check PostgreSQL is running: `pg_isready`
- Verify `.env` credentials
- Try connecting with `psql` manually

### Issue: "Synchronize is not safe for production"
**Solution**: This is expected. `synchronize: true` is for development only. In production, use migrations.

---

This completes Module 1! You now have a solid foundation for the database layer.

