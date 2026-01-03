# Setup FAQ - Common Questions

## Question 1: Do I need to run `npm init`?

### Answer: **It depends on your situation**

#### If you're working with the EXISTING codebase:
- ❌ **NO**, you don't need `npm init`
- The `package.json` files already exist in both `api/` and `client/` directories
- Just run `npm install` in each directory to install dependencies

#### If you're creating a NEW repository from scratch:
- ✅ **YES**, you need to run `npm init` for each project
- You'll need to create TWO separate projects:
  1. **Backend API** (`api/` directory)
  2. **Frontend Client** (`client/` directory)

### Step-by-Step for New Repository:

#### Backend Setup:
```bash
# Create api directory
mkdir api
cd api

# Initialize npm project
npm init -y

# Install dependencies
npm install express cors dotenv typeorm pg striptags jsonwebtoken lodash module-alias reflect-metadata express-async-handler

# Install dev dependencies
npm install --save-dev typescript ts-node nodemon @types/node @types/express @types/cors @types/jsonwebtoken @types/lodash @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-airbnb-base eslint-config-prettier eslint-plugin-import eslint-plugin-prettier prettier tsconfig-paths cross-env

# Create src directory
mkdir src
```

#### Frontend Setup:
```bash
# Go back to root
cd ..

# Create client directory
mkdir client
cd client

# Initialize npm project
npm init -y

# Install dependencies (will be covered in Module 9)
npm install react react-dom react-router-dom styled-components axios formik react-beautiful-dnd quill

# Install dev dependencies
npm install --save-dev webpack webpack-cli webpack-dev-server babel-loader @babel/core @babel/preset-env @babel/preset-react html-webpack-plugin css-loader style-loader file-loader url-loader

# Create src directory
mkdir src
```

### Recommended: Copy package.json

Instead of running `npm init` and manually installing, you can:
1. Copy the existing `package.json` files from this codebase
2. Run `npm install` in each directory

This ensures you have the exact same dependencies and versions.

---

## Question 2: Is there no login/authentication system?

### Answer: **Correct - There is NO traditional login system**

This codebase uses a **"Guest Account"** system instead of email/password authentication.

### How Authentication Works:

#### Current System (Guest Mode):

1. **User visits the app** → No token in localStorage
2. **Frontend automatically calls** `POST /authentication/guest`
3. **Backend creates**:
   - A new guest user account
   - A new project with sample data
   - 8 sample issues
   - Comments on issues
4. **Backend returns** a JWT token
5. **Frontend stores** the token in localStorage
6. **All subsequent requests** include the token in `Authorization: Bearer <token>` header

#### What This Means:

- ✅ **No email/password required**
- ✅ **No registration form**
- ✅ **No login form**
- ✅ **Automatic account creation** on first visit
- ✅ **Each visitor gets their own project** with sample data
- ✅ **Token-based authentication** (JWT) for API requests

### Authentication Flow Diagram:

```
User visits app
    ↓
Check localStorage for token
    ↓
No token found?
    ↓
Show "Authenticate" screen (just a loading spinner)
    ↓
Auto-call POST /authentication/guest
    ↓
Backend creates:
  - Guest user (e.g., "Lord Gaben")
  - Project ("singularity 1.0")
  - 8 sample issues
  - Comments
    ↓
Backend returns JWT token
    ↓
Store token in localStorage
    ↓
Redirect to /project
    ↓
All API calls include: Authorization: Bearer <token>
```

### What's Missing (From README):

As stated in the original README:

> **Proper authentication system 🔐**
> 
> We currently auto create an auth token and seed a project with issues and users for anyone who visits the API without valid credentials. In a real product we'd want to implement a proper email and password authentication system.

### If You Want to Add Real Authentication:

You would need to implement:

1. **User Registration**:
   - Email/password signup
   - Password hashing (bcrypt)
   - Email verification (optional)

2. **User Login**:
   - Email/password authentication
   - Token generation on successful login
   - Token refresh mechanism

3. **Password Management**:
   - Password reset flow
   - Password change functionality

4. **User Model Updates**:
   - Add `password` field (hashed)
   - Add `emailVerified` field
   - Add `resetPasswordToken` field

5. **New Endpoints**:
   - `POST /authentication/register`
   - `POST /authentication/login`
   - `POST /authentication/logout`
   - `POST /authentication/forgot-password`
   - `POST /authentication/reset-password`

### Current Authentication Files:

- `api/src/controllers/authentication.ts` - Guest account creation
- `api/src/middleware/authentication.ts` - Token validation
- `api/src/utils/authToken.ts` - JWT token generation/verification
- `client/src/Auth/Authenticate.jsx` - Guest account creation UI
- `client/src/shared/utils/authToken.js` - Token storage utilities

### Why Guest Mode?

This is a **showcase/learning project**, not a production app. Guest mode:
- ✅ Makes it easy to demo (no signup required)
- ✅ Simplifies the codebase (no password hashing, email verification, etc.)
- ✅ Focuses on core features (project management, issues, Kanban board)
- ✅ Good for learning React/Node.js patterns

---

## Summary

1. **npm init**: Only needed if creating a new repo from scratch. Otherwise, use existing `package.json` files.

2. **Login System**: No traditional login. Uses automatic guest account creation with JWT tokens. This is intentional for a showcase project.

---

## Next Steps

If you want to implement proper authentication later, we can add it as an additional module after completing the core functionality. For now, the guest account system is sufficient for learning and demonstrating the application.

