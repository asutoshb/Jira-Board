# Jira Clone - Module-by-Module Breakdown

This document breaks down each module in detail, explaining what it contains, how it works, and what code needs to be written.

---

## MODULE 1: Database & Connection Setup

### What It Contains
- Database connection configuration
- TypeORM entity definitions (Project, Issue, User, Comment)
- Database seeding logic

### Files to Create
1. `api/src/database/createConnection.ts`
2. `api/src/entities/Project.ts`
3. `api/src/entities/Issue.ts`
4. `api/src/entities/User.ts`
5. `api/src/entities/Comment.ts`
6. `api/src/entities/index.ts`
7. `api/src/database/createGuestAccount.ts`

### Key Concepts

**TypeORM DataSource**:
- Modern TypeORM (0.3.x) uses `DataSource` instead of `createConnection`
- Configure connection options (host, port, username, database, password)
- Set `synchronize: true` for auto schema creation (development only)
- Register all entities

**Entity Relationships**:
```
Project 1──< Many Issues
Project 1──< Many Users
Issue 1──< Many Comments
Issue Many──< Many Users (assignees)
User 1──< Many Comments
```

**Entity Decorators**:
- `@Entity()`: Marks class as database table
- `@PrimaryGeneratedColumn()`: Auto-increment ID
- `@Column()`: Regular column with type
- `@CreateDateColumn()`: Auto-managed timestamp
- `@UpdateDateColumn()`: Auto-managed timestamp
- `@OneToMany()`, `@ManyToOne()`, `@ManyToMany()`: Relationships
- `@BeforeInsert()`, `@BeforeUpdate()`: Lifecycle hooks

### Implementation Steps

1. **Create DataSource Connection**:
   - Import `DataSource` from `typeorm`
   - Read environment variables (DB_HOST, DB_PORT, etc.)
   - Create DataSource instance
   - Export `initialize()` function

2. **Define Project Entity**:
   - Fields: id, name, url, description, category, createdAt, updatedAt
   - Relationships: OneToMany with Issues and Users
   - Validations: name (required, maxLength 100), url (valid URL), category (enum)

3. **Define Issue Entity**:
   - Fields: id, title, type, status, priority, listPosition, description, descriptionText, estimate, timeSpent, timeRemaining, reporterId, projectId, createdAt, updatedAt
   - Relationships: ManyToOne with Project, OneToMany with Comments, ManyToMany with Users
   - Lifecycle hook: Auto-generate descriptionText from description HTML

4. **Define User Entity**:
   - Fields: id, name, email, avatarUrl, projectId, createdAt, updatedAt
   - Relationships: ManyToOne with Project, OneToMany with Comments, ManyToMany with Issues

5. **Define Comment Entity**:
   - Fields: id, body, userId, issueId, createdAt, updatedAt
   - Relationships: ManyToOne with User and Issue
   - Cascade delete on issue deletion

6. **Create Guest Account Seeder**:
   - Create 3 users
   - Create 1 project
   - Create 8 sample issues
   - Create comments
   - Return guest user

---

## MODULE 2: Authentication System

### What It Contains
- JWT token generation and verification
- Guest account creation endpoint
- Authentication middleware

### Files to Create
1. `api/src/utils/authToken.ts`
2. `api/src/controllers/authentication.ts`
3. `api/src/middleware/authentication.ts`

### Key Concepts

**JWT (JSON Web Token)**:
- Contains user ID in `sub` claim
- Signed with secret key
- No expiration in development
- Stored in `Authorization: Bearer <token>` header

**Authentication Flow**:
1. Guest visits → No token
2. Frontend calls `/authentication/guest`
3. Backend creates account + returns token
4. Frontend stores token
5. All requests include token in header
6. Middleware validates token on protected routes

### Implementation Steps

1. **Token Utilities** (`authToken.ts`):
   - `signToken(payload)`: Create JWT with user ID
   - `verifyToken(token)`: Decode and validate JWT
   - Use `jsonwebtoken` library
   - Secret from environment variable

2. **Authentication Controller**:
   - `createGuestAccount`: Creates guest user via seeder
   - Returns JWT token
   - Public endpoint (no auth required)

3. **Authentication Middleware**:
   - Extract token from `Authorization` header
   - Verify token
   - Fetch user from database
   - Attach `currentUser` to request
   - Call `next()` or throw error

---

## MODULE 3: Project Management

### What It Contains
- Project data retrieval
- Project updates
- Issue serialization

### Files to Create
1. `api/src/controllers/projects.ts`
2. `api/src/serializers/issues.ts`

### Key Concepts

**Project Endpoints**:
- `GET /project`: Returns project with users and issues
- `PUT /project`: Updates project details

**Data Serialization**:
- Issues are serialized to include only necessary fields
- Reduces payload size
- Improves performance

### Implementation Steps

1. **Get Project Controller**:
   - Use `req.currentUser.projectId`
   - Fetch project with relations (users, issues)
   - Serialize issues (partial data)
   - Return project data

2. **Update Project Controller**:
   - Validate input
   - Update project fields
   - Return updated project

3. **Issue Serializer**:
   - Create `issuePartial()` function
   - Returns only: id, title, type, status, priority, listPosition, reporterId, userIds
   - Excludes: description, comments, etc.

---

## MODULE 4: Issue Management

### What It Contains
- Issue CRUD operations
- Issue search and filtering
- List position calculation

### Files to Create
1. `api/src/controllers/issues.ts`
2. `api/src/constants/issues.ts`

### Key Concepts

**Issue Types**:
- Task
- Bug
- Story

**Issue Status** (Kanban columns):
- Backlog
- Selected
- In Progress
- Done

**Issue Priority**:
- Highest (5)
- High (4)
- Medium (3)
- Low (2)
- Lowest (1)

**List Position**:
- Determines order within status column
- Calculated automatically
- New issues get `min - 1` (appear at top)

### Implementation Steps

1. **Get Issues Controller**:
   - Filter by `projectId` from currentUser
   - Optional search term (title or description)
   - Use TypeORM QueryBuilder for ILIKE search
   - Return issues array

2. **Get Single Issue Controller**:
   - Fetch issue with relations (users, comments, comments.user)
   - Return full issue data

3. **Create Issue Controller**:
   - Calculate listPosition for status
   - Validate input
   - Create issue
   - Return created issue

4. **Update Issue Controller**:
   - Find issue
   - Update fields
   - Save and return

5. **Delete Issue Controller**:
   - Find issue
   - Delete (cascade deletes comments)
   - Return deleted issue

6. **List Position Calculation**:
   - Find all issues with same projectId and status
   - Get minimum listPosition
   - Return `min - 1` (or 1 if no issues)

---

## MODULE 5: Comment System

### What It Contains
- Comment CRUD operations
- Comment-user-issue relationships

### Files to Create
1. `api/src/controllers/comments.ts`

### Key Concepts

**Comment Structure**:
- Belongs to one issue
- Belongs to one user
- Contains HTML body (from rich text editor)
- Cascade delete when issue deleted

### Implementation Steps

1. **Create Comment**:
   - Validate body (required, maxLength 50000)
   - Create comment with userId and issueId
   - Return created comment

2. **Update Comment**:
   - Find comment
   - Update body
   - Return updated comment

3. **Delete Comment**:
   - Find comment
   - Delete
   - Return deleted comment

---

## MODULE 6: User Management

### What It Contains
- Current user retrieval

### Files to Create
1. `api/src/controllers/users.ts`

### Implementation Steps

1. **Get Current User**:
   - Use `req.currentUser` (from middleware)
   - Return user data

---

## MODULE 7: Error Handling & Validation

### What It Contains
- Custom error classes
- Validation utilities
- Error middleware

### Files to Create
1. `api/src/errors/customErrors.ts`
2. `api/src/errors/asyncCatch.ts`
3. `api/src/errors/index.ts`
4. `api/src/middleware/errors.ts`
5. `api/src/utils/validation.ts`

### Key Concepts

**Error Classes**:
- `CustomError`: Base class
- `RouteNotFoundError`: 404 for unknown routes
- `EntityNotFoundError`: 404 for missing entities
- `BadUserInputError`: 400 for validation failures
- `InvalidTokenError`: 401 for auth failures

**Validation System**:
- Declarative rules on entities
- Validators: required, maxLength, email, url, oneOf
- Field-level error messages

### Implementation Steps

1. **Custom Error Classes**:
   - Base `CustomError` with message, code, status, data
   - Specific error classes extend base
   - Set appropriate HTTP status codes

2. **Async Error Handler**:
   - Wraps async route handlers
   - Catches errors and passes to error middleware

3. **Validation Utilities**:
   - Validator functions (required, maxLength, email, etc.)
   - `generateErrors()`: Runs validators on field values
   - Returns field-level error object

4. **Error Middleware**:
   - Catches all errors
   - Formats safe errors for client
   - Hides internal errors in production
   - Returns consistent error format

---

## MODULE 8: API Infrastructure

### What It Contains
- Express server setup
- Route definitions
- Middleware configuration

### Files to Create
1. `api/src/index.ts`
2. `api/src/routes.ts`
3. `api/src/middleware/response.ts`

### Key Concepts

**Server Initialization**:
1. Load environment variables
2. Connect to database
3. Initialize Express
4. Apply middleware
5. Attach routes
6. Start listening

**Middleware Stack**:
- CORS
- JSON parsing
- Response helper
- Authentication (for private routes)
- Error handling

### Implementation Steps

1. **Server Entry Point** (`index.ts`):
   - Import dependencies
   - Create `establishDatabaseConnection()` function
   - Create `initializeExpress()` function
   - Create `initializeApp()` function
   - Call `initializeApp()` and handle errors

2. **Route Definitions** (`routes.ts`):
   - Public routes: `/authentication/guest`
   - Private routes: All other routes
   - Export route attachment functions

3. **Response Middleware**:
   - Add `res.respond()` helper function
   - Simplifies response sending

---

## MODULE 9: Application Core (Frontend)

### What It Contains
- React app initialization
- Routing setup
- Global styles

### Files to Create
1. `client/src/index.jsx`
2. `client/src/App/index.jsx`
3. `client/src/App/Routes.jsx`
4. `client/src/App/BaseStyles.js`
5. `client/src/App/NormalizeStyles.js`
6. `client/src/App/Toast/index.jsx`
7. `client/src/browserHistory.js`

### Key Concepts

**React Router**:
- Client-side routing
- History API
- Route components

**Global Styles**:
- CSS reset
- Normalize CSS
- Base styles

### Implementation Steps

1. **Entry Point** (`index.jsx`):
   - Import React and ReactDOM
   - Import App component
   - Render to DOM

2. **App Component**:
   - Wrap with Router
   - Include global styles
   - Render Routes component
   - Include Toast component

3. **Routes Component**:
   - Define routes:
     - `/` → Redirect to `/project`
     - `/authenticate` → Authenticate component
     - `/project` → Project component
     - `*` → 404 page

4. **Browser History**:
   - Create history instance
   - Export for use in components

5. **Global Styles**:
   - CSS reset
   - Normalize styles
   - Base typography and colors

---

## MODULE 10: Authentication Flow (Frontend)

### What It Contains
- Guest account creation UI
- Token management

### Files to Create
1. `client/src/Auth/Authenticate.jsx`
2. `client/src/shared/utils/authToken.js`

### Key Concepts

**Authentication Flow**:
1. Check localStorage for token
2. If no token, show Authenticate component
3. Component calls API to create guest account
4. Store token
5. Redirect to project

### Implementation Steps

1. **Token Utilities**:
   - `getStoredAuthToken()`: Read from localStorage
   - `storeAuthToken(token)`: Save to localStorage
   - `removeStoredAuthToken()`: Clear token

2. **Authenticate Component**:
   - Show loading state
   - Call `POST /authentication/guest` on mount
   - Store token on success
   - Redirect to `/project`
   - Show error on failure

---

## MODULE 11: Project UI Components

### What It Contains
- Project page layout
- Kanban board
- Issue details modal
- Issue creation/search modals

### Files to Create
1. `client/src/Project/index.jsx`
2. `client/src/Project/NavbarLeft/index.jsx`
3. `client/src/Project/Sidebar/index.jsx`
4. `client/src/Project/Board/index.jsx`
5. `client/src/Project/Board/Header/index.jsx`
6. `client/src/Project/Board/Filters/index.jsx`
7. `client/src/Project/Board/Lists/index.jsx`
8. `client/src/Project/Board/Lists/List/index.jsx`
9. `client/src/Project/Board/Lists/List/Issue/index.jsx`
10. `client/src/Project/IssueDetails/index.jsx`
11. `client/src/Project/IssueCreate/index.jsx`
12. `client/src/Project/IssueSearch/index.jsx`
13. `client/src/Project/ProjectSettings/index.jsx`

### Key Concepts

**Component Hierarchy**:
```
Project
├── NavbarLeft (navigation)
├── Sidebar (project info)
├── Board (Kanban)
│   ├── Header
│   ├── Filters
│   └── Lists (4 columns)
│       └── Issue cards
├── IssueDetails (modal)
├── IssueCreate (modal)
└── IssueSearch (modal)
```

**State Management**:
- `useQuery` hook for GET requests
- `useMutation` hook for POST/PUT/DELETE
- Local state for UI state
- Optimistic updates

**Drag and Drop**:
- React Beautiful DnD
- Drag issue cards between columns
- Update status on drop

### Implementation Steps

1. **Project Component**:
   - Fetch project data with `useQuery`
   - Render layout components
   - Handle modals (search, create)
   - Route to board/settings

2. **NavbarLeft**:
   - Navigation links
   - Search button
   - Create issue button

3. **Sidebar**:
   - Project name
   - Project description
   - Project category
   - Project URL

4. **Board Component**:
   - Header with title
   - Filters component
   - Lists component (4 columns)
   - Issue details modal route

5. **Lists Component**:
   - Render 4 List components (Backlog, Selected, In Progress, Done)
   - Filter issues by status
   - Handle drag and drop

6. **List Component**:
   - Render issue cards for status
   - Drag and drop container
   - Handle drop events

7. **Issue Card**:
   - Display issue type icon
   - Display priority icon
   - Display title
   - Display assignees
   - Click to open details

8. **Issue Details Modal**:
   - Full issue information
   - Editable fields (inline editing)
   - Comments section
   - Time tracking
   - Assignees management

9. **Issue Create Modal**:
   - Form with validation
   - Required fields: title, type, status, priority
   - Optional: description, estimate, assignees
   - Submit creates issue

10. **Issue Search Modal**:
    - Search input
    - Filter by assignee
    - Filter by "My Issues"
    - Recent issues
    - Results list

---

## MODULE 12: Shared Components & Utilities

### What It Contains
- Reusable UI components
- API hooks
- Utility functions

### Files to Create

**Components**:
1. `client/src/shared/components/Modal/index.jsx`
2. `client/src/shared/components/Button/index.jsx`
3. `client/src/shared/components/Input/index.jsx`
4. `client/src/shared/components/Select/index.jsx`
5. `client/src/shared/components/Textarea/index.jsx`
6. `client/src/shared/components/DatePicker/index.jsx`
7. `client/src/shared/components/TextEditor/index.jsx`
8. `client/src/shared/components/Avatar/index.jsx`
9. `client/src/shared/components/Spinner/index.jsx`
10. `client/src/shared/components/PageLoader/index.jsx`
11. `client/src/shared/components/PageError/index.jsx`
12. `client/src/shared/components/Tooltip/index.jsx`
13. `client/src/shared/components/Icon/index.jsx`
14. `client/src/shared/components/IssueTypeIcon/index.jsx`
15. `client/src/shared/components/IssuePriorityIcon/index.jsx`
16. `client/src/shared/components/Breadcrumbs/index.jsx`
17. `client/src/shared/components/ConfirmModal/index.jsx`
18. `client/src/shared/components/index.js`

**Hooks**:
1. `client/src/shared/hooks/api/query.js`
2. `client/src/shared/hooks/api/mutation.js`
3. `client/src/shared/hooks/api/index.js`
4. `client/src/shared/hooks/mergeState.js`
5. `client/src/shared/hooks/currentUser.js`
6. `client/src/shared/hooks/onEscapeKeyDown.js`
7. `client/src/shared/hooks/onOutsideClick.js`

**Utils**:
1. `client/src/shared/utils/api.js`
2. `client/src/shared/utils/authToken.js`
3. `client/src/shared/utils/toast.js`
4. `client/src/shared/utils/validation.js`
5. `client/src/shared/utils/dateTime.js`
6. `client/src/shared/utils/url.js`
7. `client/src/shared/utils/styles.js`
8. `client/src/shared/utils/javascript.js`
9. `client/src/shared/utils/queryParamModal.js`

**Constants**:
1. `client/src/shared/constants/issues.js`
2. `client/src/shared/constants/projects.js`
3. `client/src/shared/constants/keyCodes.js`

### Key Concepts

**API Hooks**:
- `useQuery`: GET requests with caching
- `useMutation`: POST/PUT/DELETE requests
- Automatic loading/error states
- Cache management

**Component Library**:
- Reusable, styled components
- Consistent design system
- Accessible components

### Implementation Steps

1. **API Utilities**:
   - Axios wrapper with auth header
   - Error handling
   - Token refresh on 401

2. **API Hooks**:
   - `useQuery`: GET with cache
   - `useMutation`: POST/PUT/DELETE
   - Loading/error states

3. **UI Components**:
   - Modal, Button, Input, Select, etc.
   - Styled with styled-components
   - Accessible markup

4. **Utility Functions**:
   - Date formatting
   - URL manipulation
   - Validation
   - Toast notifications

---

## Implementation Order Recommendation

### Phase 1: Backend Foundation
1. Module 1: Database & Connection Setup
2. Module 7: Error Handling & Validation
3. Module 8: API Infrastructure

### Phase 2: Backend Features
4. Module 2: Authentication System
5. Module 6: User Management
6. Module 3: Project Management
7. Module 4: Issue Management
8. Module 5: Comment System

### Phase 3: Frontend Foundation
9. Module 9: Application Core
10. Module 12: Shared Components & Utilities (partial)

### Phase 4: Frontend Features
11. Module 10: Authentication Flow
12. Module 11: Project UI Components
13. Module 12: Shared Components & Utilities (complete)

---

This breakdown provides a detailed roadmap for implementing each module. Start with Phase 1 and work through each module systematically.

