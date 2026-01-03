# TypeORM Explained - Complete Guide

## What is TypeORM?

**TypeORM** is an **Object-Relational Mapping (ORM)** library for TypeScript and JavaScript. It allows you to work with databases using **objects and classes** instead of writing raw SQL queries.

### Simple Analogy

Think of TypeORM as a **translator** between:
- **Your Code** (JavaScript/TypeScript objects)
- **Database** (SQL tables and rows)

Instead of writing SQL like:
```sql
SELECT * FROM users WHERE id = 1;
```

You write TypeScript like:
```typescript
const user = await User.findOne({ where: { id: 1 } });
```

---

## Why Use TypeORM?

### Without TypeORM (Raw SQL):
```typescript
// You have to write SQL queries manually
const result = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
const user = result.rows[0];

// Create user
await db.query(
  'INSERT INTO users (name, email) VALUES ($1, $2)',
  [name, email]
);

// Update user
await db.query(
  'UPDATE users SET name = $1 WHERE id = $2',
  [newName, userId]
);
```

### With TypeORM:
```typescript
// Find user
const user = await User.findOne({ where: { id: userId } });

// Create user
const user = User.create({ name, email });
await user.save();

// Update user
user.name = newName;
await user.save();
```

### Benefits:
- ✅ **Type Safety**: TypeScript knows the structure of your data
- ✅ **Less Code**: No need to write SQL queries
- ✅ **Relationships**: Easy to work with related data
- ✅ **Migrations**: Manage database schema changes
- ✅ **Cross-Database**: Works with PostgreSQL, MySQL, SQLite, etc.

---

## Core Concepts

### 1. Entity

An **Entity** is a class that represents a database table.

**Example from our codebase:**

```typescript
// This class represents the "users" table in the database
@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;  // Maps to "id" column in database

  @Column('varchar')
  name: string;  // Maps to "name" column

  @Column('varchar')
  email: string;  // Maps to "email" column
}
```

**What happens:**
- TypeORM creates a table called `users` in PostgreSQL
- Each property becomes a column
- Each instance of `User` represents a row

### 2. Decorators

Decorators are special annotations that tell TypeORM how to map your class to the database.

#### Common Decorators:

**`@Entity()`**
- Marks a class as a database table
```typescript
@Entity()
class User { ... }
// Creates "users" table
```

**`@Column()`**
- Marks a property as a database column
```typescript
@Column('varchar')
name: string;
// Creates "name" column of type VARCHAR
```

**`@PrimaryGeneratedColumn()`**
- Auto-incrementing primary key
```typescript
@PrimaryGeneratedColumn()
id: number;
// Creates "id" column, auto-increments
```

**`@CreateDateColumn()`**
- Automatically sets creation timestamp
```typescript
@CreateDateColumn()
createdAt: Date;
// Auto-filled when entity is created
```

**`@UpdateDateColumn()`**
- Automatically updates timestamp on save
```typescript
@UpdateDateColumn()
updatedAt: Date;
// Auto-updated when entity is modified
```

### 3. Relationships

TypeORM makes it easy to work with related data.

#### One-to-Many Relationship

**Example: One Project has Many Issues**

```typescript
// In Project entity
@OneToMany(
  () => Issue,           // Related entity
  issue => issue.project // Property in Issue that references Project
)
issues: Issue[];  // Array of issues

// In Issue entity
@ManyToOne(
  () => Project,
  project => project.issues
)
project: Project;  // Single project

@Column('integer')
projectId: number;  // Foreign key
```

**What this means:**
- One project can have many issues
- Each issue belongs to one project
- TypeORM automatically handles the foreign key (`projectId`)

#### Many-to-Many Relationship

**Example: Many Issues can have Many Users (assignees)**

```typescript
// In Issue entity
@ManyToMany(
  () => User,
  user => user.issues
)
@JoinTable()  // Issue owns the relationship
users: User[];  // Array of assigned users

// In User entity
@ManyToMany(
  () => Issue,
  issue => issue.users
)
issues: Issue[];  // Array of assigned issues
```

**What this means:**
- An issue can have multiple assignees
- A user can be assigned to multiple issues
- TypeORM creates a join table (`issue_users`) automatically

---

## How TypeORM Works in This Codebase

### Step 1: Define Entities

**File: `api/src/entities/User.ts`**

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  name: string;

  @Column('varchar')
  email: string;
}
```

### Step 2: Configure Connection

**File: `api/src/database/createConnection.ts`**

```typescript
import { DataSource } from 'typeorm';
import * as entities from 'entities';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'asutoshbhere',
  database: 'jira_development',
  entities: Object.values(entities),  // Register all entities
  synchronize: true,  // Auto-create/update tables
});

await dataSource.initialize();
```

**What happens:**
- TypeORM connects to PostgreSQL
- Reads all entity classes
- Creates/updates database tables automatically
- Sets up relationships

### Step 3: Use Entities in Code

**Example: Create a User**

```typescript
import { User } from 'entities';

// Create new user
const user = User.create({
  name: 'John Doe',
  email: 'john@example.com'
});

// Save to database
await user.save();
// TypeORM executes: INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com')
```

**Example: Find Users**

```typescript
// Find all users
const users = await User.find();
// TypeORM executes: SELECT * FROM users

// Find one user
const user = await User.findOne({ where: { id: 1 } });
// TypeORM executes: SELECT * FROM users WHERE id = 1

// Find with relations
const user = await User.findOne({
  where: { id: 1 },
  relations: ['project', 'issues']
});
// TypeORM executes JOIN queries automatically
```

**Example: Update User**

```typescript
const user = await User.findOne({ where: { id: 1 } });
user.name = 'Jane Doe';
await user.save();
// TypeORM executes: UPDATE users SET name = 'Jane Doe' WHERE id = 1
```

**Example: Delete User**

```typescript
const user = await User.findOne({ where: { id: 1 } });
await user.remove();
// TypeORM executes: DELETE FROM users WHERE id = 1
```

---

## Real Examples from This Codebase

### Example 1: Creating a Guest Account

**File: `api/src/database/createGuestAccount.ts`**

```typescript
import { User } from 'entities';
import { createEntity } from 'utils/typeorm';

// Create user using TypeORM
const user = await createEntity(User, {
  email: 'rick@jira.guest',
  name: 'Pickle Rick',
  avatarUrl: 'https://...'
});

// Behind the scenes, TypeORM executes:
// INSERT INTO users (email, name, avatarUrl) 
// VALUES ('rick@jira.guest', 'Pickle Rick', 'https://...')
```

### Example 2: Finding Project with Relations

**File: `api/src/controllers/projects.ts`**

```typescript
import { Project } from 'entities';

const project = await findEntityOrThrow(Project, projectId, {
  relations: ['users', 'issues']  // Load related data
});

// Behind the scenes, TypeORM executes:
// SELECT * FROM projects WHERE id = ?
// SELECT * FROM users WHERE projectId = ?
// SELECT * FROM issues WHERE projectId = ?
// All automatically joined!
```

### Example 3: Query Builder (Complex Queries)

**File: `api/src/controllers/issues.ts`**

```typescript
import { Issue } from 'entities';

const issues = await Issue.createQueryBuilder('issue')
  .select()
  .where('issue.projectId = :projectId', { projectId })
  .andWhere('issue.title ILIKE :searchTerm', { searchTerm: `%${term}%` })
  .getMany();

// Behind the scenes, TypeORM executes:
// SELECT * FROM issues 
// WHERE projectId = ? AND title ILIKE ?
```

---

## TypeORM vs Raw SQL Comparison

### Scenario: Get Project with Users and Issues

#### Raw SQL Approach:
```typescript
// Multiple queries needed
const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
const project = projectResult.rows[0];

const usersResult = await db.query('SELECT * FROM users WHERE projectId = $1', [id]);
project.users = usersResult.rows;

const issuesResult = await db.query('SELECT * FROM issues WHERE projectId = $1', [id]);
project.issues = issuesResult.rows;

// Manual mapping, error-prone
```

#### TypeORM Approach:
```typescript
// Single call, automatic mapping
const project = await Project.findOne({
  where: { id },
  relations: ['users', 'issues']
});

// TypeORM handles:
// - Multiple queries
// - Joins
// - Mapping to objects
// - Type safety
```

---

## Key TypeORM Methods

### Finding Data

```typescript
// Find all
const users = await User.find();

// Find one
const user = await User.findOne({ where: { id: 1 } });

// Find with conditions
const users = await User.find({ 
  where: { email: 'john@example.com' } 
});

// Find with relations
const user = await User.findOne({
  where: { id: 1 },
  relations: ['project', 'issues']
});
```

### Creating Data

```typescript
// Method 1: Create and save
const user = User.create({ name: 'John', email: 'john@example.com' });
await user.save();

// Method 2: Create directly
const user = await User.save({ name: 'John', email: 'john@example.com' });
```

### Updating Data

```typescript
// Method 1: Find, modify, save
const user = await User.findOne({ where: { id: 1 } });
user.name = 'Jane';
await user.save();

// Method 2: Update directly
await User.update({ id: 1 }, { name: 'Jane' });
```

### Deleting Data

```typescript
// Method 1: Find and remove
const user = await User.findOne({ where: { id: 1 } });
await user.remove();

// Method 2: Delete directly
await User.delete({ id: 1 });
```

---

## Lifecycle Hooks

TypeORM allows you to run code before/after database operations.

### Example from Our Codebase:

**File: `api/src/entities/Issue.ts`**

```typescript
@BeforeInsert()
@BeforeUpdate()
setDescriptionText = (): void => {
  if (this.description) {
    // Automatically generate plain text from HTML
    this.descriptionText = striptags(this.description);
  }
};
```

**What happens:**
- Before saving an issue, TypeORM automatically:
  1. Takes the HTML description
  2. Strips HTML tags
  3. Stores plain text in `descriptionText` field
  4. This enables full-text search

**Available Hooks:**
- `@BeforeInsert()` - Before creating new record
- `@AfterInsert()` - After creating new record
- `@BeforeUpdate()` - Before updating record
- `@AfterUpdate()` - After updating record
- `@BeforeRemove()` - Before deleting record
- `@AfterRemove()` - After deleting record

---

## Synchronize vs Migrations

### Synchronize (Development Only)

```typescript
const dataSource = new DataSource({
  synchronize: true,  // Auto-create/update tables
  // ...
});
```

**What it does:**
- Automatically creates tables based on entities
- Updates tables when entities change
- **⚠️ DANGEROUS in production** - can lose data!

**Use for:**
- ✅ Development
- ✅ Learning
- ✅ Prototyping

**Don't use for:**
- ❌ Production
- ❌ Real applications with data

### Migrations (Production)

Migrations are scripts that manage database changes safely.

```typescript
// Migration file
export class CreateUsersTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE users`);
  }
}
```

**Benefits:**
- ✅ Version control for database changes
- ✅ Safe to use in production
- ✅ Can rollback changes
- ✅ Team collaboration

---

## TypeORM in This Codebase

### File Structure

```
api/src/
├── entities/           # TypeORM entities
│   ├── Project.ts      # Project table
│   ├── Issue.ts        # Issue table
│   ├── User.ts         # User table
│   ├── Comment.ts      # Comment table
│   └── index.ts        # Exports all entities
├── database/
│   ├── createConnection.ts  # TypeORM connection setup
│   └── createGuestAccount.ts # Uses entities to seed data
└── utils/
    └── typeorm.ts      # Helper functions for entities
```

### How Entities Are Used

1. **Defined** in `entities/` folder
2. **Registered** in `createConnection.ts`
3. **Used** in controllers to query database
4. **Relationships** automatically handled

---

## Common Patterns in This Codebase

### Pattern 1: BaseEntity

All entities extend `BaseEntity`:

```typescript
import { BaseEntity } from 'typeorm';

@Entity()
class User extends BaseEntity {
  // ...
}
```

**Benefits:**
- Provides methods like `find()`, `findOne()`, `save()`, `remove()`
- Can call `User.find()` directly on the class

### Pattern 2: Helper Functions

**File: `api/src/utils/typeorm.ts`**

```typescript
// Instead of writing this everywhere:
const user = await User.findOne({ where: { id: 1 } });
if (!user) throw new Error('User not found');

// We have a helper:
const user = await findEntityOrThrow(User, 1);
// Automatically throws error if not found
```

### Pattern 3: Validation on Entities

```typescript
@Entity()
class User extends BaseEntity {
  static validations = {
    name: [is.required(), is.maxLength(100)],
    email: [is.required(), is.email()],
  };
  // ...
}
```

Validation rules are defined on the entity class itself.

---

## Summary

**TypeORM is:**
- An ORM that lets you work with databases using objects
- Type-safe (TypeScript)
- Handles relationships automatically
- Reduces boilerplate SQL code

**In this codebase:**
- Entities represent database tables
- Relationships connect entities
- Controllers use entities to query data
- Database is PostgreSQL

**Key Benefits:**
- ✅ Less code
- ✅ Type safety
- ✅ Automatic relationship handling
- ✅ Easy to maintain

---

## Next Steps

Now that you understand TypeORM, you can:
1. Understand how entities work in Module 1
2. See how controllers use entities to query data
3. Understand relationships between Project, Issue, User, Comment

TypeORM is the bridge between your TypeScript code and the PostgreSQL database!

