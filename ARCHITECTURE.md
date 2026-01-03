# Jira Clone - Complete Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Application Flow](#application-flow)
5. [Module Breakdown](#module-breakdown)
6. [Detailed Module Documentation](#detailed-module-documentation)

---

## Overview

This is a simplified Jira clone - a project management tool that allows users to:
- Create and manage projects
- Create, update, and track issues (tasks, bugs, stories)
- Assign issues to team members
- Add comments to issues
- Organize issues in a Kanban board (Backlog, Selected, In Progress, Done)
- Search and filter issues
- Manage project settings

### Key Characteristics
- **Full-stack application**: React frontend + Node.js/Express backend
- **Database-driven**: PostgreSQL with TypeORM
- **RESTful API**: JSON-based API communication
- **Modern React**: Functional components with hooks, no Redux
- **Type-safe backend**: TypeScript for API
- **Custom tooling**: Webpack config, no CRA

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   App Layer  │  │  Project UI  │  │ Shared Comps  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼──────┐    │
│  │         API Layer (Custom Hooks + Utils)            │    │
│  │  - useQuery, useMutation                            │    │
│  │  - api.js (axios wrapper)                           │    │
│  │  - authToken.js                                     │    │
│  └──────┬─────────────────────────────────────────────┘    │
└─────────┼───────────────────────────────────────────────────┘
          │ HTTP/REST (JSON)
          │ Authorization: Bearer <token>
          │
┌─────────▼───────────────────────────────────────────────────┐
│                      API (Node.js/Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │ Controllers  │  │  Middleware  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼──────┐    │
│  │         Business Logic Layer                       │    │
│  │  - Validation                                       │    │
│  │  - TypeORM Utilities                               │    │
│  │  - Error Handling                                  │    │
│  └──────┬─────────────────────────────────────────────┘    │
│         │                                                    │
│  ┌──────▼─────────────────────────────────────────────┐    │
│  │         Data Access Layer (TypeORM)                 │    │
│  │  - Entities (Project, Issue, User, Comment)         │    │
│  │  - Database Connection                              │    │
│  └──────┬─────────────────────────────────────────────┘    │
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  - jira_development                                          │
│  - Tables: projects, issues, users, comments                 │
└──────────────────────────────────────────────────────────────┘
```

### Request Flow

```
User Action (Frontend)
    ↓
React Component
    ↓
Custom Hook (useQuery/useMutation)
    ↓
API Utility (api.js)
    ↓
HTTP Request (axios)
    ↓
Express Server (Backend)
    ↓
Middleware (CORS, JSON parsing, Authentication)
    ↓
Route Handler
    ↓
Controller
    ↓
TypeORM Entity Operations
    ↓
PostgreSQL Database
    ↓
Response flows back up the chain
```

---

## Technology Stack

### Frontend (Client)
- **React 16.12.0**: UI library
- **React Router DOM 5.1.2**: Client-side routing
- **Styled Components 4.4.1**: CSS-in-JS styling
- **Axios 0.19.0**: HTTP client
- **Formik 2.1.1**: Form management
- **React Beautiful DnD 12.2.0**: Drag and drop
- **Quill 1.3.7**: Rich text editor
- **Webpack 4.41.2**: Module bundler
- **Babel**: JavaScript transpiler

### Backend (API)
- **Node.js**: Runtime
- **Express 4.17.1**: Web framework
- **TypeScript 3.7.2**: Type-safe JavaScript
- **TypeORM 0.3.28**: ORM for database
- **PostgreSQL**: Relational database
- **JSON Web Token (JWT)**: Authentication
- **CORS**: Cross-origin resource sharing

---

## Application Flow

### 1. Initial Application Load

```
User visits localhost:8080
    ↓
App/index.jsx renders
    ↓
Routes.jsx checks authentication
    ↓
No token? → Redirect to /authenticate
    ↓
Authenticate.jsx component
    ↓
POST /authentication/guest
    ↓
Backend creates guest account + project + issues
    ↓
Returns authToken
    ↓
Token stored in localStorage
    ↓
Redirect to /project
```

### 2. Project Page Load

```
GET /project (with Bearer token)
    ↓
Authentication middleware validates token
    ↓
Projects controller fetches project with users & issues
    ↓
Returns project data
    ↓
Project component renders:
    - NavbarLeft (sidebar navigation)
    - Sidebar (project info)
    - Board (Kanban view)
    - Modals (IssueCreate, IssueSearch)
```

### 3. Issue Management Flow

```
User creates issue
    ↓
IssueCreate modal opens
    ↓
Form submission
    ↓
POST /issues
    ↓
Backend creates issue, calculates listPosition
    ↓
Returns created issue
    ↓
Frontend updates local state
    ↓
Board re-renders with new issue
```

### 4. Drag and Drop Flow

```
User drags issue card
    ↓
React Beautiful DnD handles drag
    ↓
On drop, calculate new status
    ↓
PUT /issues/:issueId (optimistic update)
    ↓
Backend updates issue status
    ↓
Frontend updates local state
    ↓
UI reflects new position
```

---

## Module Breakdown

The codebase is divided into **12 main modules**:

### Backend Modules (API)

1. **Module 1: Database & Connection Setup**
   - Database connection configuration
   - Entity definitions
   - Database seeding

2. **Module 2: Authentication System**
   - Guest account creation
   - JWT token generation/verification
   - Authentication middleware

3. **Module 3: Project Management**
   - Project CRUD operations
   - Project data serialization

4. **Module 4: Issue Management**
   - Issue CRUD operations
   - Issue filtering and search
   - List position calculation

5. **Module 5: Comment System**
   - Comment CRUD operations
   - Comment-user relationships

6. **Module 6: User Management**
   - User retrieval
   - User-project relationships

7. **Module 7: Error Handling & Validation**
   - Custom error classes
   - Request validation
   - Error middleware

8. **Module 8: API Infrastructure**
   - Route definitions
   - Middleware setup
   - Response formatting

### Frontend Modules (Client)

9. **Module 9: Application Core**
   - App initialization
   - Routing setup
   - Global styles

10. **Module 10: Authentication Flow**
    - Guest account creation
    - Token management
    - Route protection

11. **Module 11: Project UI Components**
    - Project page layout
    - Kanban board
    - Issue details modal
    - Issue creation/search

12. **Module 12: Shared Components & Utilities**
    - Reusable UI components
    - API hooks
    - Utility functions

---

## Detailed Module Documentation

### MODULE 1: Database & Connection Setup

**Location**: `api/src/database/`, `api/src/entities/`

**Purpose**: Establish database connection and define data models

**Files**:
- `createConnection.ts`: Database connection configuration
- `createGuestAccount.ts`: Seed data for guest users
- `entities/Project.ts`: Project entity model
- `entities/Issue.ts`: Issue entity model
- `entities/User.ts`: User entity model
- `entities/Comment.ts`: Comment entity model

**Key Concepts**:

1. **TypeORM DataSource**
   - Uses `DataSource` class (TypeORM 0.3.x)
   - Configures PostgreSQL connection
   - Sets up entity relationships
   - Enables `synchronize: true` for auto schema creation

2. **Entity Relationships**:
   ```
   Project (1) ──< (Many) Issues
   Project (1) ──< (Many) Users
   Issue (1) ──< (Many) Comments
   Issue (Many) ──< (Many) Users (assignees)
   User (1) ──< (Many) Comments
   ```

3. **Entity Decorators**:
   - `@Entity()`: Marks class as database entity
   - `@PrimaryGeneratedColumn()`: Auto-incrementing ID
   - `@Column()`: Regular column
   - `@CreateDateColumn()`: Auto-managed creation timestamp
   - `@UpdateDateColumn()`: Auto-managed update timestamp
   - `@OneToMany()`, `@ManyToOne()`, `@ManyToMany()`: Relationships
   - `@BeforeInsert()`, `@BeforeUpdate()`: Lifecycle hooks

**Database Schema**:

```sql
projects
  - id (PK)
  - name
  - url
  - description
  - category
  - createdAt
  - updatedAt

users
  - id (PK)
  - name
  - email
  - avatarUrl
  - projectId (FK → projects.id)
  - createdAt
  - updatedAt

issues
  - id (PK)
  - title
  - type (task/bug/story)
  - status (backlog/selected/inprogress/done)
  - priority (1-5)
  - listPosition
  - description (HTML)
  - descriptionText (plain text)
  - estimate
  - timeSpent
  - timeRemaining
  - reporterId (FK → users.id)
  - projectId (FK → projects.id)
  - createdAt
  - updatedAt

comments
  - id (PK)
  - body
  - userId (FK → users.id)
  - issueId (FK → issues.id)
  - createdAt
  - updatedAt

issue_users (join table)
  - issueId (FK → issues.id)
  - userId (FK → users.id)
```

---

### MODULE 2: Authentication System

**Location**: `api/src/controllers/authentication.ts`, `api/src/middleware/authentication.ts`, `api/src/utils/authToken.ts`

**Purpose**: Handle user authentication and authorization

**Flow**:
1. Guest visits app → No token in localStorage
2. Frontend calls `POST /authentication/guest`
3. Backend creates guest user + project + seed data
4. Returns JWT token
5. Frontend stores token
6. All subsequent requests include `Authorization: Bearer <token>`
7. Middleware validates token on protected routes

**Key Components**:

1. **Guest Account Creation** (`createGuestAccount.ts`):
   - Creates 3 users (Pickle Rick, Baby Yoda, Lord Gaben)
   - Creates 1 project ("singularity 1.0")
   - Creates 8 sample issues
   - Creates comments on issues
   - Returns the guest user

2. **JWT Token** (`authToken.ts`):
   - `signToken()`: Creates JWT with user ID in `sub` claim
   - `verifyToken()`: Validates and decodes JWT
   - Secret: `development12345` (from .env)

3. **Authentication Middleware**:
   - Extracts token from `Authorization` header
   - Verifies token
   - Fetches user from database
   - Attaches `currentUser` to request object
   - Throws `InvalidTokenError` if validation fails

**Security Notes**:
- No password authentication (guest mode only)
- Tokens don't expire in development
- All routes except `/authentication/guest` require authentication

---

### MODULE 3: Project Management

**Location**: `api/src/controllers/projects.ts`, `api/src/serializers/issues.ts`

**Purpose**: Handle project data retrieval and updates

**Endpoints**:
- `GET /project`: Get project with users and issues
- `PUT /project`: Update project details

**Key Features**:
- Returns project with related users and issues
- Issues are serialized (partial data) for performance
- Uses `req.currentUser.projectId` to fetch user's project
- Validates project updates

**Data Serialization**:
- Issues are serialized to include only necessary fields
- Reduces payload size
- Defined in `serializers/issues.ts`

---

### MODULE 4: Issue Management

**Location**: `api/src/controllers/issues.ts`, `api/src/constants/issues.ts`

**Purpose**: Handle issue CRUD operations, filtering, and search

**Endpoints**:
- `GET /issues`: Get all issues for project (with optional search)
- `GET /issues/:issueId`: Get single issue with users and comments
- `POST /issues`: Create new issue
- `PUT /issues/:issueId`: Update issue
- `DELETE /issues/:issueId`: Delete issue

**Key Features**:

1. **Issue Types**: Task, Bug, Story
2. **Issue Status**: Backlog, Selected, In Progress, Done
3. **Issue Priority**: Highest (5) to Lowest (1)
4. **List Position**: Calculated automatically for Kanban ordering
5. **Search**: Full-text search on title and description
6. **Filtering**: By status, assignee, etc.

**List Position Calculation**:
- When creating issue, finds minimum listPosition in same status
- Sets new issue's position to `min - 1`
- Ensures new issues appear at top of column

**Issue Description**:
- Stored as HTML (from Quill editor)
- Plain text version (`descriptionText`) auto-generated for search
- Uses `striptags` library to extract text

---

### MODULE 5: Comment System

**Location**: `api/src/controllers/comments.ts`

**Purpose**: Handle comments on issues

**Endpoints**:
- `POST /comments`: Create comment
- `PUT /comments/:commentId`: Update comment
- `DELETE /comments/:commentId`: Delete comment

**Key Features**:
- Comments belong to an issue and a user
- Cascade delete: Deleting issue deletes comments
- Rich text support (HTML from Quill editor)
- Max length: 50,000 characters

**Relationships**:
- Comment → Issue (Many-to-One)
- Comment → User (Many-to-One)

---

### MODULE 6: User Management

**Location**: `api/src/controllers/users.ts`

**Purpose**: Handle user data retrieval

**Endpoints**:
- `GET /currentUser`: Get authenticated user's data

**Key Features**:
- Returns current user based on JWT token
- Includes user's project relationship
- Used for displaying user info in UI

---

### MODULE 7: Error Handling & Validation

**Location**: `api/src/errors/`, `api/src/utils/validation.ts`

**Purpose**: Centralized error handling and input validation

**Error Classes**:
- `CustomError`: Base error class
- `RouteNotFoundError`: 404 for unknown routes
- `EntityNotFoundError`: 404 for missing entities
- `BadUserInputError`: 400 for validation failures
- `InvalidTokenError`: 401 for auth failures

**Validation System**:
- Declarative validation rules on entities
- Validators: `required`, `maxLength`, `email`, `url`, `oneOf`, etc.
- Runs before save operations
- Returns field-level error messages

**Error Middleware**:
- Catches all errors
- Formats safe errors for client
- Hides internal errors in production
- Returns consistent error response format

---

### MODULE 8: API Infrastructure

**Location**: `api/src/index.ts`, `api/src/routes.ts`, `api/src/middleware/`

**Purpose**: Express server setup and request routing

**Server Initialization Flow**:
1. Load environment variables
2. Connect to database
3. Initialize Express app
4. Apply middleware (CORS, JSON parsing, response helper)
5. Attach public routes (no auth required)
6. Apply authentication middleware
7. Attach private routes (auth required)
8. Add error handling middleware
9. Start listening on port 3000

**Middleware Stack**:
1. `cors()`: Enable CORS
2. `express.json()`: Parse JSON bodies
3. `express.urlencoded()`: Parse URL-encoded bodies
4. `addRespondToResponse`: Add `res.respond()` helper
5. `authenticateUser`: Validate JWT token (for private routes)
6. `handleError`: Catch and format errors

**Route Organization**:
- Public routes: `/authentication/guest`, test routes
- Private routes: All other routes require authentication
- 404 handler: Catches unknown routes

---

### MODULE 9: Application Core (Frontend)

**Location**: `client/src/App/`, `client/src/index.jsx`

**Purpose**: Application initialization and routing

**Files**:
- `index.jsx`: React app entry point
- `App/index.jsx`: Main app component
- `App/Routes.jsx`: Route definitions
- `App/BaseStyles.js`: Global CSS reset
- `App/NormalizeStyles.js`: CSS normalization
- `App/Toast/`: Toast notification system

**Key Features**:
- React Router for client-side routing
- Global style setup
- Toast notification system
- Error boundary handling

**Route Structure**:
- `/` → Redirects to `/project`
- `/authenticate` → Guest account creation
- `/project` → Main project page
- `/project/board` → Kanban board view
- `/project/settings` → Project settings
- `*` → 404 page

---

### MODULE 10: Authentication Flow (Frontend)

**Location**: `client/src/Auth/`, `client/src/shared/utils/authToken.js`

**Purpose**: Handle authentication on frontend

**Components**:
- `Authenticate.jsx`: Guest account creation screen

**Flow**:
1. Check localStorage for `authToken`
2. If no token, show `Authenticate` component
3. Component calls `POST /authentication/guest`
4. Stores token in localStorage
5. Redirects to `/project`

**Token Management**:
- `getStoredAuthToken()`: Read from localStorage
- `storeAuthToken()`: Save to localStorage
- `removeStoredAuthToken()`: Clear on logout/invalid token
- Token included in all API requests via `Authorization` header

---

### MODULE 11: Project UI Components

**Location**: `client/src/Project/`

**Purpose**: Main application UI

**Component Hierarchy**:

```
Project (index.jsx)
├── NavbarLeft (left sidebar navigation)
├── Sidebar (project info sidebar)
├── Board (Kanban board)
│   ├── Header (board title)
│   ├── Filters (search, assignee, status filters)
│   └── Lists (status columns)
│       └── List (Backlog/Selected/InProgress/Done)
│           └── Issue (issue card)
├── IssueDetails (modal)
│   ├── Title
│   ├── Type
│   ├── Status
│   ├── Priority
│   ├── AssigneesReporter
│   ├── Description
│   ├── Comments
│   ├── Dates
│   └── EstimateTracking
├── IssueCreate (modal)
└── IssueSearch (modal)
```

**Key Features**:

1. **Kanban Board**:
   - 4 columns: Backlog, Selected, In Progress, Done
   - Drag and drop between columns
   - Issue cards show: type icon, priority, title, assignees
   - Click card to open details modal

2. **Issue Details Modal**:
   - Full issue information
   - Editable fields (inline editing)
   - Comments section
   - Time tracking
   - Assignees management

3. **Issue Creation**:
   - Form with validation
   - Required: title, type, status, priority
   - Optional: description, estimate, assignees

4. **Issue Search**:
   - Full-text search
   - Filter by assignee
   - Filter by "My Issues"
   - Recent issues filter

**State Management**:
- Uses custom hooks (`useQuery`, `useMutation`)
- Local state updates for optimistic UI
- Cache management for API responses

---

### MODULE 12: Shared Components & Utilities

**Location**: `client/src/shared/`

**Purpose**: Reusable components and utilities

**Components** (`shared/components/`):
- `Modal`: Reusable modal dialog
- `Button`: Styled button component
- `Input`: Text input with validation
- `Select`: Dropdown select
- `DatePicker`: Date/time picker
- `TextEditor`: Rich text editor (Quill wrapper)
- `Avatar`: User avatar display
- `Spinner`: Loading spinner
- `PageLoader`: Full-page loader
- `PageError`: Error page
- `Tooltip`: Tooltip component
- `Icon`: Icon component
- And more...

**Hooks** (`shared/hooks/`):
- `useQuery`: GET request hook with caching
- `useMutation`: POST/PUT/DELETE hook
- `useMergeState`: State merge utility
- `currentUser`: Current user context
- `onEscapeKeyDown`: Keyboard event handler
- `onOutsideClick`: Click outside handler

**Utils** (`shared/utils/`):
- `api.js`: Axios wrapper with auth
- `authToken.js`: Token management
- `toast.js`: Toast notifications
- `validation.js`: Form validation
- `dateTime.js`: Date formatting
- `url.js`: URL utilities
- `styles.js`: Style utilities

**Constants** (`shared/constants/`):
- `issues.js`: Issue types, statuses, priorities
- `projects.js`: Project categories
- `keyCodes.js`: Keyboard key codes

---

## Data Flow Examples

### Example 1: Creating an Issue

```
User clicks "Create Issue"
    ↓
IssueCreate modal opens
    ↓
User fills form and submits
    ↓
IssueCreate component calls:
  const [{ isCreating }, createIssue] = useApi.post('/issues');
  createIssue(issueData);
    ↓
Frontend API utility (api.js):
  - Adds Authorization header
  - POST to http://localhost:3000/issues
    ↓
Backend Express receives request
    ↓
Authentication middleware:
  - Validates JWT token
  - Attaches currentUser to req
    ↓
Routes.ts routes to:
  app.post('/issues', issues.create);
    ↓
Issues controller (create function):
  - Calculates listPosition
  - Validates input
  - Creates issue via TypeORM
  - Returns created issue
    ↓
Response flows back:
  - Frontend receives issue data
  - Updates local state
  - Closes modal
  - Board re-renders with new issue
```

### Example 2: Drag and Drop Issue

```
User drags issue card
    ↓
React Beautiful DnD:
  - onDragStart: Sets dragging state
  - onDragEnd: Calculates new status
    ↓
Board component:
  - Calls updateLocalProjectIssues (optimistic update)
  - UI updates immediately
    ↓
PUT /issues/:issueId:
  - Sends new status and listPosition
    ↓
Backend updates issue
    ↓
Response confirms update
    ↓
If error: Revert optimistic update
```

---

## Key Design Patterns

### 1. Repository Pattern (Backend)
- TypeORM utilities act as repository layer
- `findEntityOrThrow`, `createEntity`, `updateEntity`, `deleteEntity`
- Centralizes database operations

### 2. Custom Hooks Pattern (Frontend)
- `useQuery`: Handles GET requests with caching
- `useMutation`: Handles POST/PUT/DELETE
- Encapsulates API logic

### 3. Optimistic Updates
- UI updates immediately
- API call happens in background
- Revert on error

### 4. Error Boundary Pattern
- Custom error classes
- Centralized error handling
- Consistent error responses

### 5. Validation Pattern
- Declarative validation rules
- Entity-level validation
- Field-level error messages

---

## Environment Configuration

### Backend (.env)
```
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=asutoshbhere
DB_PASSWORD=
DB_DATABASE=jira_development
JWT_SECRET=development12345
PORT=3000
```

### Frontend
- API_URL: Defaults to `http://localhost:3000`
- No .env file needed (uses webpack DefinePlugin)

---

## Development Workflow

1. **Start PostgreSQL**: Ensure database is running
2. **Start Backend**: `cd api && npm start`
3. **Start Frontend**: `cd client && npm start`
4. **Access App**: `http://localhost:8080`
5. **First Visit**: Auto-creates guest account
6. **Development**: Hot reload enabled (nodemon + webpack-dev-server)

---

## Testing

- **E2E Tests**: Cypress tests in `client/cypress/integration/`
- **Test Database**: `jira_test` (separate from development)
- **Test API**: `npm run start:test` (uses test database)

---

This documentation provides a complete overview of the codebase structure. Each module can now be implemented step-by-step in a new repository.

