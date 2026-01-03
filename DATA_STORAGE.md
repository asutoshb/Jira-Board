# Data Storage - Where is UI Data Stored?

This document explains where data is stored at each level of the application.

---

## Data Storage Layers

The application uses **multiple layers** of data storage:

```
┌─────────────────────────────────────────────────────────┐
│  1. PostgreSQL Database (Permanent Storage)             │
│     - Source of truth                                   │
│     - Persists across sessions                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ API calls
                   │
┌──────────────────▼──────────────────────────────────────┐
│  2. React State (In-Memory, Component State)            │
│     - Temporary storage during session                  │
│     - Lost on page refresh                              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Renders
                   │
┌──────────────────▼──────────────────────────────────────┐
│  3. Browser localStorage (Token Only)                   │
│     - Only stores authentication token                  │
│     - Persists across sessions                          │
└─────────────────────────────────────────────────────────┘
```

---

## 1. PostgreSQL Database (Permanent Storage)

### Location
- **Database Name**: `jira_development` (or `jira_test` for testing)
- **Host**: `localhost:5432` (default)
- **Type**: PostgreSQL relational database

### What's Stored
All application data is permanently stored in PostgreSQL tables:

#### `projects` Table
```sql
- id (Primary Key)
- name
- url
- description
- category
- createdAt
- updatedAt
```

#### `users` Table
```sql
- id (Primary Key)
- name
- email
- avatarUrl
- projectId (Foreign Key → projects.id)
- createdAt
- updatedAt
```

#### `issues` Table
```sql
- id (Primary Key)
- title
- type
- status
- priority
- listPosition
- description (HTML)
- descriptionText (plain text)
- estimate
- timeSpent
- timeRemaining
- reporterId (Foreign Key → users.id)
- projectId (Foreign Key → projects.id)
- createdAt
- updatedAt
```

#### `comments` Table
```sql
- id (Primary Key)
- body (HTML)
- userId (Foreign Key → users.id)
- issueId (Foreign Key → issues.id)
- createdAt
- updatedAt
```

#### `issue_users` Table (Join Table)
```sql
- issueId (Foreign Key → issues.id)
- userId (Foreign Key → users.id)
```

### How Data Flows from Database to UI

```
PostgreSQL Database
    ↓
TypeORM Entities (Backend)
    ↓
Express Controllers (Backend)
    ↓
REST API Endpoints
    ↓
HTTP Response (JSON)
    ↓
Axios (Frontend)
    ↓
React State
    ↓
UI Components
```

### Example: Loading Project Data

1. **User visits `/project` page**
2. **Frontend calls**: `GET http://localhost:3000/project`
3. **Backend queries database**:
   ```typescript
   // In projects controller
   const project = await findEntityOrThrow(Project, req.currentUser.projectId, {
     relations: ['users', 'issues'],
   });
   ```
4. **Database returns**: Project with users and issues
5. **Backend sends JSON response**:
   ```json
   {
     "project": {
       "id": 2,
       "name": "singularity 1.0",
       "users": [...],
       "issues": [...]
     }
   }
   ```
6. **Frontend stores in React state** (see below)

---

## 2. React State (In-Memory, Temporary)

### Location
- **Storage Type**: JavaScript objects in memory
- **Persistence**: Lost when page refreshes or closes
- **Scope**: Component-level or hook-level

### How It Works

#### Using `useQuery` Hook

```javascript
// In Project/index.jsx
const [{ data, error, setLocalData }, fetchProject] = useApi.get('/project');
```

This hook:
1. Makes API call to `/project`
2. Stores response in React state
3. Updates UI when data changes

#### State Structure

```javascript
{
  data: {
    project: {
      id: 2,
      name: "singularity 1.0",
      users: [
        { id: 4, name: "Pickle Rick", ... },
        { id: 5, name: "Baby Yoda", ... },
        { id: 6, name: "Lord Gaben", ... }
      ],
      issues: [
        { id: 1, title: "This is an issue...", status: "backlog", ... },
        { id: 2, title: "Click on an issue...", status: "backlog", ... },
        // ... more issues
      ]
    }
  },
  error: null,
  isLoading: false
}
```

### In-Memory Cache

The `useQuery` hook also maintains an **in-memory cache**:

```javascript
// In shared/hooks/api/query.js
const cache = {};  // Module-level cache object

// Cache structure:
cache['/project'] = {
  data: { project: {...} },
  apiVariables: {}
}
```

**Cache Benefits**:
- Avoids redundant API calls
- Instant data access for repeated requests
- Lost on page refresh

### Optimistic Updates

When you drag an issue or make changes, the UI updates **immediately** (optimistic update) before the API call completes:

```javascript
// Example: Drag and drop issue
updateLocalProjectIssues(issueId, { status: 'inprogress' });
// ↑ Updates React state immediately
// ↓ Then makes API call
PUT /issues/:issueId
```

If the API call fails, the UI reverts to the previous state.

---

## 3. Browser localStorage (Token Only)

### Location
- **Storage Type**: Browser's localStorage
- **Persistence**: Survives page refresh and browser close
- **Scope**: Browser-wide (per domain)

### What's Stored

**Only the authentication token** is stored in localStorage:

```javascript
// In shared/utils/authToken.js
localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
```

### Token Usage

1. **On app load**: Check localStorage for token
2. **If no token**: Redirect to `/authenticate` (create guest account)
3. **If token exists**: Include in all API requests:
   ```javascript
   headers: {
     'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   }
   ```

### What's NOT Stored in localStorage

- ❌ Project data
- ❌ Issues
- ❌ Users
- ❌ Comments
- ❌ Any UI state

**Why?** Because:
- Data is fetched fresh from the database on each page load
- React state handles temporary UI data
- Database is the source of truth

---

## Complete Data Flow Example

### Scenario: User Opens Project Page

```
Step 1: Browser loads page
    ↓
Step 2: Check localStorage for token
    ├─ No token? → Create guest account → Store token
    └─ Has token? → Continue
    ↓
Step 3: Project component mounts
    ↓
Step 4: useQuery hook calls GET /project
    ├─ Include token in Authorization header
    ↓
Step 5: Backend receives request
    ├─ Validate token
    ├─ Query database: SELECT * FROM projects WHERE id = ?
    ├─ Include relations: users, issues
    ↓
Step 6: Database returns data
    ↓
Step 7: Backend sends JSON response
    ↓
Step 8: Frontend receives response
    ├─ Store in React state (data)
    ├─ Store in in-memory cache
    ↓
Step 9: React re-renders with data
    ├─ Project component receives project data
    ├─ Board component receives issues
    ├─ Sidebar receives project info
    ↓
Step 10: UI displays data
```

### Scenario: User Drags Issue to Different Column

```
Step 1: User drags issue card
    ↓
Step 2: React Beautiful DnD handles drop
    ↓
Step 3: Optimistic update (immediate UI change)
    ├─ updateLocalProjectIssues(issueId, { status: 'inprogress' })
    ├─ React state updates immediately
    ├─ UI shows issue in new column
    ↓
Step 4: API call in background
    ├─ PUT /issues/:issueId
    ├─ Body: { status: 'inprogress', listPosition: 5 }
    ↓
Step 5: Backend updates database
    ├─ UPDATE issues SET status = 'inprogress' WHERE id = ?
    ↓
Step 6: Response received
    ├─ Success? → Keep UI as is
    └─ Error? → Revert UI to previous state
```

---

## Data Persistence Summary

| Data Type | Storage Location | Persists? | Lost When? |
|-----------|-----------------|-----------|------------|
| **Projects** | PostgreSQL | ✅ Yes | Never (unless deleted) |
| **Issues** | PostgreSQL | ✅ Yes | Never (unless deleted) |
| **Users** | PostgreSQL | ✅ Yes | Never (unless deleted) |
| **Comments** | PostgreSQL | ✅ Yes | Never (unless deleted) |
| **Project Data (UI)** | React State | ❌ No | Page refresh |
| **Issue Data (UI)** | React State | ❌ No | Page refresh |
| **Cache** | In-Memory | ❌ No | Page refresh |
| **Auth Token** | localStorage | ✅ Yes | User clears browser data |

---

## Key Takeaways

1. **Database is Source of Truth**: All permanent data lives in PostgreSQL
2. **React State is Temporary**: UI data is in memory, lost on refresh
3. **Only Token is Persistent**: localStorage only stores the JWT token
4. **Data is Fetched Fresh**: On each page load, data is fetched from database
5. **Optimistic Updates**: UI updates immediately, then syncs with database

---

## Why This Architecture?

### Benefits:
- ✅ **Single Source of Truth**: Database is always correct
- ✅ **Fresh Data**: Always shows latest data from database
- ✅ **No Data Loss**: Database persists everything
- ✅ **Simple State Management**: No complex state management library needed
- ✅ **Optimistic Updates**: Fast, responsive UI

### Trade-offs:
- ⚠️ **Network Calls**: Each page load requires API calls
- ⚠️ **No Offline Support**: Requires internet connection
- ⚠️ **Loading States**: Need to handle loading/error states

---

## Where to Find Data

### To See Database Data:
```bash
# Connect to PostgreSQL
psql -d jira_development

# View projects
SELECT * FROM projects;

# View issues
SELECT * FROM issues;

# View users
SELECT * FROM users;
```

### To See React State:
- Open browser DevTools
- React DevTools extension
- Inspect component state

### To See localStorage:
- Open browser DevTools
- Application tab → Local Storage
- Key: `authToken`

---

This architecture ensures data consistency and makes the database the single source of truth while providing a fast, responsive UI experience.

