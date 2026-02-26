# CodeCircle Backend - Technical Documentation

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: Production Ready

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Module Structure](#module-structure)
5. [Authentication Mechanism](#authentication-mechanism)
6. [API Endpoints](#api-endpoints)
7. [Request / Response Examples](#request--response-examples)
8. [Error Handling](#error-handling)
9. [Environment Variables](#environment-variables)
10. [How to Run the Project](#how-to-run-the-project)
11. [Important Technical Notes](#important-technical-notes)

---

## Project Overview

**CodeCircle Backend** is a robust, enterprise-grade NestJS REST API designed to serve as the core backend infrastructure for the CodeCircle platform. It provides comprehensive features for user management, authentication, authorization, and manages multiple educational modules including assignments, quizzes, courses, clubs, and projects.

### Core Capabilities

- **Multi-provider Authentication**: Support for local authentication (email/password), OAuth 2.0 (Google, GitHub, LinkedIn)
- **Role-Based Access Control (RBAC)**: Fine-grained permission and role management at both global and resource levels
- **Email Services**: Automated email verification and password reset functionality
- **Cloud Integration**: Cloudinary integration for file uploads and management
- **Real-time Features**: Integration with Redis for caching and session management
- **Comprehensive API Documentation**: OpenAPI/Swagger integration with automatic documentation generation
- **Full Type Safety**: End-to-end TypeScript implementation

### Project Statistics

- **Language**: TypeScript
- **Main Framework**: NestJS 11.x
- **Database**: PostgreSQL with TypeORM
- **API Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest (unit and e2e tests)

---

## Tech Stack

### Runtime & Framework
| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | ^14.0.0 | JavaScript runtime |
| TypeScript | ^5.x | Static type checking |
| NestJS | ^11.0.1 | Backend framework |

### Database & ORM
| Component | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 12+ | Relational database |
| TypeORM | ^0.3.28 | Object-Relational Mapping |
| pg | ^8.17.2 | PostgreSQL driver |

### Authentication & Security
| Component | Version | Purpose |
|-----------|---------|---------|
| @nestjs/jwt | ^11.0.2 | JWT token generation |
| @nestjs/passport | ^11.0.5 | Authentication strategy |
| passport-jwt | ^4.0.1 | JWT strategy |
| passport-google-oauth20 | ^2.0.0 | Google OAuth |
| passport-github2 | ^0.1.12 | GitHub OAuth |
| passport-linkedin-oauth2 | ^2.0.0 | LinkedIn OAuth |
| bcryptjs | ^3.0.3 | Password hashing |

### API & Documentation
| Component | Version | Purpose |
|-----------|---------|---------|
| @nestjs/swagger | ^11.2.5 | OpenAPI documentation |
| swagger-ui-express | ^5.0.1 | Swagger UI |
| class-validator | ^0.14.3 | DTO validation |
| class-transformer | ^0.5.1 | DTO transformation |

### Infrastructure & Services
| Component | Version | Purpose |
|-----------|---------|---------|
| redis | ^5.10.0 | Caching and sessions |
| cache-manager | ^7.2.8 | Cache abstraction |
| @nestjs-modules/mailer | ^2.0.2 | Email service |
| nodemailer | ^8.0.0 | SMTP mail transport |
| cloudinary | ^2.9.0 | Cloud file storage |

### Middleware & Security
| Component | Version | Purpose |
|-----------|---------|---------|
| helmet | ^8.1.0 | HTTP security headers |
| compression | ^1.8.1 | HTTP compression |
| cookie-parser | ^1.4.7 | Cookie parsing |
| @nestjs/throttler | ^6.5.0 | Rate limiting |

### AI Integration
| Component | Version | Purpose |
|-----------|---------|---------|
| @google/generative-ai | ^0.24.1 | Google Gemini AI |
| otplib | ^13.2.1 | OTP generation |
| speakeasy | ^2.0.0 | Two-factor authentication |

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│              (Web, Mobile, Third-party Services)             │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  NestJS Application                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Global Middleware & Filters                           │   │
│  │ ├─ Helmet (Security Headers)                          │   │
│  │ ├─ CORS Handler                                       │   │
│  │ ├─ Compression                                        │   │
│  │ └─ Cookie Parser                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                     │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │ Controllers (Request Handlers)                        │   │
│  │ ├─ AuthController                                     │   │
│  │ ├─ UsersController                                    │   │
│  │ ├─ ClubsController                                    │   │
│  │ ├─ CoursesController                                  │   │
│  │ ├─ AssignmentsController                              │   │
│  │ ├─ QuizController                                     │   │
│  │ └─ Other Feature Controllers                          │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                     │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │ Guards (Authentication & Authorization)              │   │
│  │ ├─ JwtAuthGuard (Token validation)                   │   │
│  │ ├─ RolesGuard (Role-based access)                    │   │
│  │ ├─ PermissionGuard (Permission-based access)         │   │
│  │ └─ OAuthGuard (OAuth strategy validation)            │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                     │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │ Services (Business Logic)                             │   │
│  │ ├─ AuthService & Auth Sub-services                   │   │
│  │ ├─ UserService                                        │   │
│  │ ├─ TokenService                                       │   │
│  │ ├─ EmailService                                       │   │
│  │ ├─ PermissionResolverService                          │   │
│  │ └─ Feature-specific Services                          │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                     │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │ Interceptors (Response Processing)                    │   │
│  │ ├─ ClassSerializerInterceptor (DTO serialization)    │   │
│  │ └─ ResponseInterceptor (Response formatting)         │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    ┌─────────┐      ┌────────┐      ┌──────────┐
    │PostgreSQL│      │ Redis  │      │Cloudinary│
    │Database  │      │ Cache  │      │  Storage │
    └─────────┘      └────────┘      └──────────┘
```

### Design Patterns Used

1. **Dependency Injection**: NestJS IoC container manages all service dependencies
2. **Modular Architecture**: Feature-based module organization with clear separation of concerns
3. **Guard-based Authorization**: Multi-layer permission validation through NestJS guards
4. **DTO Pattern**: Data Transfer Objects ensure type-safe API contracts
5. **Strategy Pattern**: Passport strategies for multiple authentication methods
6. **Repository Pattern**: TypeORM entities with repository methods for database access
7. **Service Layer Pattern**: Business logic encapsulated in injectable services

---

## Module Structure

### 1. **Auth Module** (`src/modules/auth`)
Handles all authentication and authorization concerns.

**Entities**:
- `User` - User account entity
- `Role` - Role definitions for RBAC
- `UserRole` - User-role associations
- `Permission` - System permissions
- `RolePermission` - Role-permission mappings
- `UserPermission` - User-specific permissions
- `AuthToken` - JWT token tracking
- `OAuthAccount` - OAuth provider account linkage
- `AuditLog` - Audit trail for security events

**Services**:
- `AuthService` - Main authentication orchestration
- `LocalAuthService` - Email/password authentication
- `OAuthAuthService` - OAuth provider authentication
- `TokenService` - JWT token generation and validation
- `EmailService` - Email verification and password reset
- `PermissionResolverService` - Permission calculation and validation
- `AuditService` - Audit logging

**Strategies**:
- `JwtStrategy` - JWT token validation
- `GoogleStrategy` - Google OAuth 2.0
- `GithubStrategy` - GitHub OAuth
- `LinkedInStrategy` - LinkedIn OAuth

**Controllers**:
- `AuthController` - Authentication endpoints (register, login, password reset, etc.)
- `OAuthController` - OAuth callback handlers

**Key Features**:
- JWT-based stateless authentication
- OAuth 2.0 integration with Google, GitHub, LinkedIn
- Email verification system
- Password reset functionality
- Single-device login policy
- Permission and role-based access control

---

### 2. **Users Module** (`src/modules/users`)
Manages user profiles and account information.

**Entities**:
- `User` - Core user entity with profile information

**Services**:
- `UsersService` - User CRUD operations and profile management

**Controllers**:
- `UsersController` - User management endpoints

**Key Features**:
- User profile management
- Account information retrieval
- User listing with pagination

---

### 3. **Clubs Module** (`src/modules/clubs`)
Manages club creation and membership.

**Key Features**:
- Club creation and management
- Member management
- Club-specific access control

---

### 4. **Courses Module** (`src/modules/course`)
Handles course content and enrollment.

**Key Features**:
- Course management
- Course enrollment
- Course content organization

---

### 5. **Categories Module** (`src/modules/categories`)
Manages category taxonomy for clubs and resources.

**Key Features**:
- Category creation and management
- Category-based filtering

---

### 6. **Assignments Module** (`src/modules/assignment`)
Manages course assignments and submissions.

**Key Features**:
- Assignment creation and distribution
- Submission tracking
- Grading support

---

### 7. **Quiz Module** (`src/modules/quiz`)
Handles quiz creation and assessment.

**Key Features**:
- Quiz management
- Question management
- Answer tracking
- Score calculation

---

### 8. **Projects Module** (`src/modules/project`)
Manages student and group projects.

**Key Features**:
- Project creation and collaboration
- Project submission tracking

---

### 9. **Tests Module** (`src/modules/tests`)
Entry-level assessment for club joining.

**Key Features**:
- Pre-joining assessment
- Test question management
- Score tracking

---

### 10. **Common Module** (`src/common`)
Shared utilities and services used across the application.

**Components**:
- `Decorators`: `@CurrentUser`, `@RequirePermissions`, `@Roles`
- `Guards`: `JwtAuthGuard`, `PermissionGuard`, `RolesGuard`, `OAuthGuard`
- `Filters`: `HttpExceptionFilter` for global error handling
- `Interceptors`: `ResponseInterceptor` for response formatting, `ClassSerializerInterceptor`
- `Services`: `EmailService`, `CloudinaryService`, `AuditService`

---

## Authentication Mechanism

### Overview

CodeCircle implements a **multi-strategy authentication system** combining:
1. Traditional email/password authentication
2. OAuth 2.0 (Google, GitHub, LinkedIn)
3. JWT-based session management
4. Optional two-factor authentication (OTP/TOTP)

### Authentication Flow

#### 1. Local Authentication (Email/Password)

```
User Input (Email + Password)
            ▼
  LocalAuthService.validateUser()
            ▼
  Compare with bcrypt hash
            ▼
  User Valid? ──No──> Throw UnauthorizedException
            │
           Yes
            ▼
  TokenService.issueAccessToken()
            ▼
  TokenService.issueRefreshToken()
            ▼
  Return {accessToken, refreshToken}
```

**Password Security**:
- Hashed with bcryptjs (rounds: 10)
- Never stored in plain text
- Compared using constant-time comparison

#### 2. OAuth 2.0 Authentication

```
User Click "Login with Google/GitHub"
            ▼
  Passport Strategy Handler
            ▼
  Redirect to OAuth Provider
            ▼
  User Approves Permissions
            ▼
  OAuth Provider Callback
            ▼
  OAuthAuthService.handleOAuthCallback()
            ▼
  Check if OAuthAccount exists
            ├─ Yes: Use existing user
            └─ No: Create new user + OAuthAccount
            ▼
  TokenService.issueAccessToken()
            ▼
  Return tokens
```

#### 3. JWT Token Management

**Access Token**:
- Expiration: 1 day (configurable via `JWT_EXPIRATION`)
- Used for API request authorization
- Sent via `Authorization: Bearer <token>` header
- Payload includes: `userId`, `email`, `roles`, `permissions`

**Refresh Token**:
- Longer-lived token for obtaining new access tokens
- Single-device policy: Issuing new refresh token invalidates previous ones
- Stored in database (`AuthToken` entity)
- Never sent to client unless explicitly requested

### JWT Strategy

**File**: `src/modules/auth/strategies/jwt.strategy.ts`

```typescript
interface CurrentUserPayload {
  sub: string;        // User ID
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;        // Issued at
  exp: number;        // Expiration
}
```

### Permission & Role System

**Roles**: Hierarchical collection of permissions
- System roles defined in database
- Can be custom per organization/club

**Permissions**: Granular access control
- Scoped at GLOBAL or CLUB level
- Examples: `users:read`, `users:create`, `assignments:grade`

**Guard Flow**:
```
Request → JwtAuthGuard (token valid?)
        → RolesGuard (user has role?)
        → PermissionGuard (user has permission?)
        → Endpoint Handler
```

### OAuth Configuration

#### Google OAuth 2.0
```env
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
```

#### GitHub OAuth 2.0
```env
GITHUB_CLIENT_ID=<your-client-id>
GITHUB_CLIENT_SECRET=<your-client-secret>
```

#### LinkedIn OAuth 2.0
```env
LINKEDIN_CLIENT_ID=<your-client-id>
LINKEDIN_CLIENT_SECRET=<your-client-secret>
```

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "userId": "uuid-here",
    "email": "user@example.com",
    "verificationToken": "token-here"
  }
}
```

---

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-here",
    "expiresIn": 86400,
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["student"]
    }
  }
}
```

---

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token-here"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "expiresIn": 86400
  }
}
```

---

#### Request Password Reset
```http
POST /auth/password/request-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

---

#### Reset Password
```http
POST /auth/password/reset
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

#### Change Password (Authenticated)
```http
POST /auth/password/change
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### User Endpoints

#### Get Current User
```http
GET /users/me
Authorization: Bearer <access-token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "profileImage": "https://cloudinary-url/image.jpg",
    "bio": "Software developer",
    "createdAt": "2024-01-15T10:30:00Z",
    "roles": ["student"]
  }
}
```

---

#### Get User by ID
```http
GET /users/:id
Authorization: Bearer <access-token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "profileImage": "https://cloudinary-url/image.jpg",
    "bio": "Software developer",
    "createdAt": "2024-01-15T10:30:00Z",
    "roles": ["student"]
  }
}
```

---

#### Update User Profile
```http
PUT /users/:id
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "firstName": "Jonathan",
  "lastName": "Smith",
  "bio": "Full-stack developer"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "User profile updated successfully",
  "data": {
    "id": "uuid-here",
    "firstName": "Jonathan",
    "lastName": "Smith",
    "bio": "Full-stack developer"
  }
}
```

---

### Club Endpoints

#### Create Club
```http
POST /clubs
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Web Development Club",
  "description": "Learn modern web technologies",
  "categoryId": "category-uuid",
  "coverImage": "https://example.com/image.jpg"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Club created successfully",
  "data": {
    "id": "club-uuid",
    "name": "Web Development Club",
    "description": "Learn modern web technologies",
    "categoryId": "category-uuid",
    "coverImage": "https://example.com/image.jpg",
    "createdBy": "user-uuid",
    "memberCount": 1,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### Get Club by ID
```http
GET /clubs/:id
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "club-uuid",
    "name": "Web Development Club",
    "description": "Learn modern web technologies",
    "categoryId": "category-uuid",
    "coverImage": "https://example.com/image.jpg",
    "createdBy": "user-uuid",
    "memberCount": 45,
    "members": [
      {
        "id": "member-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "role": "member"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### List Clubs
```http
GET /clubs?page=1&limit=20&categoryId=category-uuid&search=web
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "club-uuid",
        "name": "Web Development Club",
        "description": "Learn modern web technologies",
        "memberCount": 45,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 120,
      "pages": 6
    }
  }
}
```

---

### Course Endpoints

#### Create Course
```http
POST /courses
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "Advanced TypeScript",
  "description": "Master TypeScript for production applications",
  "clubId": "club-uuid",
  "instructorId": "instructor-uuid",
  "coverImage": "https://example.com/image.jpg"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": "course-uuid",
    "title": "Advanced TypeScript",
    "description": "Master TypeScript for production applications",
    "clubId": "club-uuid",
    "instructorId": "instructor-uuid",
    "enrollmentCount": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Assignment Endpoints

#### Create Assignment
```http
POST /assignments
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "Build a Todo App",
  "description": "Create a functional todo application",
  "courseId": "course-uuid",
  "dueDate": "2024-02-15T23:59:59Z",
  "totalPoints": 100
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "id": "assignment-uuid",
    "title": "Build a Todo App",
    "description": "Create a functional todo application",
    "courseId": "course-uuid",
    "dueDate": "2024-02-15T23:59:59Z",
    "totalPoints": 100,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Quiz Endpoints

#### Create Quiz
```http
POST /quiz
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "JavaScript Basics Quiz",
  "description": "Test your JavaScript knowledge",
  "courseId": "course-uuid",
  "timeLimit": 60,
  "totalQuestions": 20,
  "passingScore": 70
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "id": "quiz-uuid",
    "title": "JavaScript Basics Quiz",
    "description": "Test your JavaScript knowledge",
    "courseId": "course-uuid",
    "timeLimit": 60,
    "totalQuestions": 20,
    "passingScore": 70,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Request / Response Examples

### Standard Response Format

All API responses follow a consistent format:

#### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    "id": "resource-id",
    "name": "Resource Name",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed: email is required",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/users",
  "method": "POST"
}
```

### Pagination Example

```http
GET /users?page=2&limit=10&sort=createdAt:desc
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "user-1", "email": "user1@example.com" },
      { "id": "user-2", "email": "user2@example.com" }
    ],
    "pagination": {
      "page": 2,
      "limit": 10,
      "total": 150,
      "pages": 15,
      "hasNextPage": true,
      "hasPreviousPage": true
    }
  }
}
```

### File Upload Example

```http
POST /users/me/profile-image
Authorization: Bearer <access-token>
Content-Type: multipart/form-data

[Binary image data in body]
```

**Response**:
```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "data": {
    "imageUrl": "https://cloudinary-url/profile-image.jpg",
    "publicId": "codecircle/users/profile-image-123"
  }
}
```

---

## Error Handling

### Global Exception Filter

The `HttpExceptionFilter` in `src/common/filters/http-exception.filter.ts` provides centralized error handling for all HTTP exceptions.

### HTTP Status Codes

| Status | Meaning | Common Scenarios |
|--------|---------|------------------|
| 200 | OK | Successful GET, PUT, PATCH requests |
| 201 | Created | Successful POST request creating resource |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Validation failure, malformed request |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User lacks required permission/role |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email, unique constraint violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Database connection failure |

### Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed: email must be a valid email address",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/auth/register",
  "method": "POST"
}
```

### Common Error Scenarios

#### 1. Validation Error
```json
{
  "success": false,
  "statusCode": 400,
  "message": "email must be a valid email address, password must be longer than 8 characters"
}
```

#### 2. Unauthorized (Missing Token)
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized: Missing or invalid JWT token"
}
```

#### 3. Forbidden (Insufficient Permissions)
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Forbidden: You lack required permission(s) to access this resource"
}
```

#### 4. Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found with ID: 123e4567-e89b-12d3-a456-426614174000"
}
```

#### 5. Conflict (Duplicate Resource)
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Email already in use: user@example.com"
}
```

---

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Application Configuration
```env
# Server
APP_PORT=3000
APP_NAME=CodeCircle
NODE_ENV=development
API_PREFIX=/api/v1
```

### Database Configuration
```env
# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=CodeCircle_db
DB_SYNCHRONIZE=true
```

### Redis Configuration
```env
# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600
REDIS_MAX_CONNECTIONS=10
```

### Cache Configuration
```env
# Cache Settings
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=3600
CACHE_MAX_ITEMS=100
CACHE_PREFIX=codecircle:
```

### JWT Configuration
```env
# JWT Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=1d
```

### CORS Configuration
```env
# CORS Settings
CORS_ORIGIN=http://localhost:5173
```

### OAuth Configuration
```env
# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# GitHub OAuth 2.0
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback

# LinkedIn OAuth 2.0
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

### Email Configuration
```env
# SMTP Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=true
EMAIL_FROM="CodeCircle <noreply@codecircle.com>"
```

### Cloudinary Configuration
```env
# Cloudinary Cloud Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Swagger Configuration
```env
# API Documentation
SWAGGER_TITLE=CodeCircle API
SWAGGER_DESCRIPTION=API Documentation for CodeCircle
SWAGGER_VERSION=1.0
```

---

## How to Run the Project

### Prerequisites

1. **Node.js**: v16 or higher
2. **npm**: v8 or higher
3. **PostgreSQL**: v12 or higher
4. **Redis**: v6 or higher (optional for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Solvit-Africa-Training-Center/code-circle-backend.git
   cd circle-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   npm run migration:run
   npm run seed:run
   ```

### Running in Development Mode

```bash
# Start with hot-reload
npm run start:dev
```

The application will be available at `http://localhost:3000`

API documentation: `http://localhost:3000/api-docs`

### Running in Production Mode

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Database Operations

```bash
# Create a new migration
npm run migration:create -- name MigrationName

# Generate migration from entity changes
npm run migration:generate -- name MigrationName

# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Show migration status
npm run migration:show

# List all migrations
npm run migration:list

# Reset database (revert + run)
npm run db:reset

# Fresh database (reset + seed)
npm run db:fresh

# Refresh database (revert + run + seed)
npm run db:refresh
```

### Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

### Code Quality

```bash
# Format code with Prettier
npm run format

# Lint with ESLint
npm run lint
```

---

## Important Technical Notes

### 1. Single-Device Login Policy

When a user logs in, a new refresh token is issued. The previous refresh token becomes invalid. This ensures only one active session per user.

**Implementation**: 
- Stored in `AuthToken` entity
- Checked during refresh token validation
- Enforced in `TokenService.issueRefreshToken()`

### 2. Password Hashing

- Algorithm: bcryptjs
- Rounds: 10
- Never stored in plain text
- Always verified using constant-time comparison

### 3. JWT Token Claims

Access token includes:
```typescript
{
  sub: string;        // User ID
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}
```

### 4. Permission Resolution

Permission checking is hierarchical:
1. Check direct user permissions
2. Check role-based permissions
3. Check resource-scoped permissions (club-level)
4. Aggregate and validate

**File**: `src/modules/auth/services/permission-resolver.service.ts`

### 5. Email Verification System

- Verification tokens expire in 24 hours
- Resendable via `/auth/resend-verification`
- Email required before accessing protected resources (configurable)

### 6. Two-Factor Authentication (OTP)

- TOTP (Time-based One-Time Password)
- Uses `speakeasy` and `qrcode` libraries
- 30-second window for code validation
- QR code generation for authenticator apps

### 7. Rate Limiting

Implemented via `@nestjs/throttler`:
- Default: 100 requests per 15 minutes globally
- Can be customized per endpoint via `@Throttle()` decorator
- Different limits for auth endpoints (stricter)

### 8. Caching Strategy

Redis-backed caching for:
- User profiles (1 hour TTL)
- Permission resolution results (30 minutes TTL)
- Session data
- OAuth tokens (temporary)

**Configuration**: `src/config/cache.config.ts`

### 9. CORS Configuration

Configured in `src/main.ts`:
- Allowed origins configurable via `CORS_ORIGIN` env variable
- Credentials: `true` (cookies allowed)
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Custom headers allowed

### 10. Security Headers

Helmet.js provides:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)
- X-XSS-Protection

### 11. Request Validation

Class Validator with whitelist mode:
- Strips unknown properties
- Forbids non-whitelisted fields
- Implicit type conversion enabled
- Custom validators supported

### 12. Exception Handling

- Global `HttpExceptionFilter` catches all exceptions
- Stack traces shown only in development
- Consistent error response format
- Proper HTTP status codes assigned

### 13. Audit Logging

All authentication events logged:
- Successful login/logout
- Failed authentication attempts
- Password changes
- Permission changes
- OAuth account linking

**Table**: `audit_logs`

### 14. Database Connection Pooling

TypeORM configuration:
- Retry attempts: 3
- Retry delay: 3 seconds
- Connection pool managed automatically
- Logging enabled in development

### 15. API Documentation

Swagger configuration provides:
- OpenAPI 3.0 specification
- Auto-generated from TypeScript decorators
- Bearer token authorization setup
- Interactive API testing
- Request/response examples
- Generated `swagger.json` file

---

## Additional Resources

- **NestJS Documentation**: https://docs.nestjs.com
- **TypeORM Documentation**: https://typeorm.io
- **JWT**: https://jwt.io
- **Passport.js**: https://www.passportjs.org
- **OpenAPI/Swagger**: https://swagger.io

---

## Contact & Support

For issues or questions regarding the backend:

- **Repository**: https://github.com/Solvit-Africa-Training-Center/code-circle-backend
- **Issues**: Create an issue in the GitHub repository
- **Documentation**: See [getting-started.md](./getting-started.md) and [how-to-contribute.md](./how-to-contribute.md)

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: Production Ready
