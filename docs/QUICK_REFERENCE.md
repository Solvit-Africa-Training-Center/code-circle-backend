# CodeCircle Backend - Quick Reference Guide

**Quick lookup for developers and teams working with CodeCircle Backend.**

---

## 📚 Documentation Files

| File | Purpose | Best For |
|------|---------|----------|
| **TECHNICAL_DOCUMENTATION.md** | Complete technical reference (11 sections) | Comprehensive understanding, API details |
| **ARCHITECTURE.md** | System design & technical decisions | Architects, design understanding |
| **DOCUMENTATION_INDEX.md** | Navigation guide for all docs | Finding the right documentation |
| **api-documentation.md** | API practices & standards | API consumers, integration |
| **getting-started.md** | Setup & running project | New developers, onboarding |
| **how-to-contribute.md** | Contribution guidelines | Contributors, team members |

---

## 🚀 Quick Start (60 seconds)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 3. Setup database
npm run migration:run
npm run seed:run

# 4. Start development
npm run start:dev

# 5. Access API
# Browser: http://localhost:3000/api-docs
# Terminal: curl http://localhost:3000/api/v1/health
```

---

## 🏗️ Project Structure

```
circle-backend/
├── src/
│   ├── main.ts              # Entry point
│   ├── app.module.ts        # Root module
│   ├── config/              # Configuration files
│   ├── common/              # Shared utilities
│   │   ├── decorators/      # @CurrentUser, @RequirePermissions, @Roles
│   │   ├── guards/          # JwtAuthGuard, PermissionGuard, RolesGuard
│   │   ├── filters/         # Global exception handler
│   │   ├── interceptors/    # Response formatting
│   │   └── services/        # EmailService, CloudinaryService
│   └── modules/             # Feature modules
│       ├── auth/            # Authentication & Authorization
│       ├── users/           # User management
│       ├── clubs/           # Club management
│       ├── courses/         # Courses
│       ├── assignments/     # Assignments
│       ├── quiz/            # Quizzes
│       ├── projects/        # Projects
│       ├── categories/      # Categories
│       └── tests/           # Tests for joining
├── test/                    # E2E tests
├── docs/                    # Documentation
├── seed/                    # Database seeding
└── package.json
```

---

## 🔑 Key Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | NestJS | ^11.0.1 |
| **Language** | TypeScript | ^5.x |
| **Database** | PostgreSQL | 12+ |
| **ORM** | TypeORM | ^0.3.28 |
| **Authentication** | JWT + Passport | 11.x |
| **Caching** | Redis | ^5.10.0 |
| **API Docs** | Swagger/OpenAPI | 11.2.5 |
| **Validation** | class-validator | 0.14.3 |
| **Testing** | Jest | ^30.0.0 |

---

## 🔐 Authentication Quick Guide

### Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login User
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### Use Access Token
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## 📡 API Endpoints Overview

### Auth Endpoints
```
POST   /auth/register              - Register new user
POST   /auth/login                 - Login user
POST   /auth/refresh               - Refresh access token
POST   /auth/logout                - Logout user
POST   /auth/password/request-reset - Request password reset
POST   /auth/password/reset        - Reset password
POST   /auth/password/change       - Change password (authenticated)
GET    /auth/google                - Google OAuth login
GET    /auth/github                - GitHub OAuth login
```

### User Endpoints
```
GET    /users/me                   - Get current user
GET    /users/:id                  - Get user by ID
PUT    /users/:id                  - Update user profile
DELETE /users/:id                  - Delete user
```

### Club Endpoints
```
POST   /clubs                      - Create club
GET    /clubs                      - List clubs
GET    /clubs/:id                  - Get club by ID
PUT    /clubs/:id                  - Update club
DELETE /clubs/:id                  - Delete club
```

### Course Endpoints
```
POST   /courses                    - Create course
GET    /courses                    - List courses
GET    /courses/:id                - Get course by ID
PUT    /courses/:id                - Update course
DELETE /courses/:id                - Delete course
```

### Assignment Endpoints
```
POST   /assignments                - Create assignment
GET    /assignments                - List assignments
GET    /assignments/:id            - Get assignment by ID
POST   /assignments/:id/submit     - Submit assignment
```

### Quiz Endpoints
```
POST   /quiz                       - Create quiz
GET    /quiz                       - List quizzes
POST   /quiz/:id/attempt           - Start quiz attempt
POST   /quiz/:id/submit            - Submit quiz answers
```

---

## 🔒 Authorization & Permissions

### Guards (Decorators)

```typescript
// Require authentication
@UseGuards(JwtAuthGuard)

// Require specific roles
@Roles('admin', 'instructor')
@UseGuards(RolesGuard)

// Require specific permissions
@RequirePermissions('clubs:create', 'clubs:update')
@UseGuards(PermissionGuard)

// Combine guards
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
```

### Permission Examples

| Permission | Scope | Meaning |
|-----------|-------|---------|
| `users:read` | GLOBAL | Can view user profiles |
| `users:write` | GLOBAL | Can update users |
| `clubs:create` | GLOBAL | Can create clubs |
| `assignments:grade` | CLUB | Can grade assignments in club |
| `quiz:manage` | COURSE | Can manage quizzes in course |

---

## 🛠️ Common Commands

### Development
```bash
npm run start          # Start production build
npm run start:dev      # Start with hot-reload
npm run start:debug    # Start with debugger
```

### Building
```bash
npm run build          # Build TypeScript
npm run format         # Format code with Prettier
npm run lint           # Lint and fix with ESLint
```

### Testing
```bash
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run end-to-end tests
```

### Database
```bash
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run migration:show     # Show migration status
npm run db:reset          # Reset database
npm run db:fresh          # Reset and seed database
npm run seed:run          # Run seeders
```

---

## 🔧 Environment Variables Checklist

### Essential Variables (Required)

- [ ] `APP_PORT` - Application port (default: 3000)
- [ ] `NODE_ENV` - Environment (development/production)
- [ ] `DB_HOST` - PostgreSQL host
- [ ] `DB_PORT` - PostgreSQL port
- [ ] `DB_USERNAME` - PostgreSQL username
- [ ] `DB_PASSWORD` - PostgreSQL password
- [ ] `DB_NAME` - Database name
- [ ] `JWT_SECRET` - JWT signing secret
- [ ] `JWT_EXPIRATION` - Token expiration time

### Important Variables (Recommended)

- [ ] `REDIS_HOST` - Redis host
- [ ] `CORS_ORIGIN` - Frontend URL
- [ ] `SMTP_HOST` - Email server host
- [ ] `SMTP_USER` - Email account
- [ ] `SMTP_PASS` - Email password
- [ ] `CLOUDINARY_CLOUD_NAME` - Cloud storage name
- [ ] `CLOUDINARY_API_KEY` - Cloud storage key

### OAuth Variables (For Social Login)

- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- [ ] `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- [ ] `GITHUB_CLIENT_SECRET` - GitHub OAuth secret

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    "id": "uuid",
    "name": "Resource"
  }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/endpoint",
  "method": "POST"
}
```

---

## 🧪 Testing Patterns

### Unit Test Template
```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    mockRepository = createMockRepository();
    service = new UserService(mockRepository);
  });

  it('should find user by id', async () => {
    const result = await service.findById('123');
    expect(result).toBeDefined();
  });
});
```

### E2E Test Template
```typescript
describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'test' })
      .expect(200);
  });
});
```

---

## 🐛 Common Issues & Solutions

### Issue: `ECONNREFUSED` (Cannot connect to database)
```bash
# Check PostgreSQL is running
psql -U postgres

# Verify DB_HOST, DB_PORT in .env
# Default: localhost:5432
```

### Issue: JWT Token Expired
```
Solution: Use refresh token endpoint
POST /auth/refresh with refreshToken
```

### Issue: CORS Error
```
Solution: Check CORS_ORIGIN environment variable
Should match frontend URL exactly (with protocol)
```

### Issue: Migration Conflicts
```bash
# Revert and run migrations fresh
npm run db:reset
npm run migration:run
```

### Issue: Permission Denied Error
```
Solution: User needs required role/permission
Check roles and permissions in database
Or request admin to grant permissions
```

---

## 📝 Code Style & Conventions

### Naming Conventions

```typescript
// Classes: PascalCase
export class UserService { }

// Functions: camelCase
async getUserById(id: string) { }

// Constants: UPPER_SNAKE_CASE
const MAX_ITEMS = 100;

// Database columns: snake_case
created_at
updated_at
user_id

// Environment variables: UPPER_SNAKE_CASE
DATABASE_URL
JWT_SECRET
```

### File Organization

```
feature/
├── feature.controller.ts      # HTTP handlers
├── feature.service.ts         # Business logic
├── feature.module.ts          # Module definition
├── entities/
│   └── feature.entity.ts      # Database entity
├── dto/
│   ├── create-feature.dto.ts  # Input DTO
│   └── feature-response.dto.ts # Output DTO
├── guards/
│   └── feature.guard.ts       # Custom guards
└── enums/
    └── feature.enum.ts        # Enums
```

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| **GitHub Repository** | https://github.com/Solvit-Africa-Training-Center/code-circle-backend |
| **API Docs (Dev)** | http://localhost:3000/api-docs |
| **NestJS Documentation** | https://docs.nestjs.com |
| **TypeORM Documentation** | https://typeorm.io |
| **JWT.io** | https://jwt.io |
| **Swagger Editor** | https://editor.swagger.io |

---

## 👥 Getting Help

1. **Check Documentation**: See [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
2. **Search Issues**: Check GitHub issues for similar problems
3. **Community**: NestJS Discord, Stack Overflow
4. **Team**: Contact CodeCircle development team

---

## ⚡ Performance Tips

```typescript
// ✓ Good: Use eager loading
const users = await userRepository.find({
  relations: ['roles', 'permissions'],
});

// ✓ Good: Use pagination
const users = await userRepository.find({
  take: 20,
  skip: 0,
});

// ✓ Good: Select only needed fields
const users = await userRepository.find({
  select: ['id', 'email', 'firstName'],
});

// ✗ Avoid: N+1 queries
const users = await userRepository.find();
users.map(u => u.roles); // Separate query per user!

// ✗ Avoid: Loading entire objects when you need counts
const count = (await userRepository.find()).length; // Load all!
const count = await userRepository.count(); // Better!
```

---

## 🔐 Security Checklist

- [ ] Environment variables secured (never commit .env)
- [ ] Passwords hashed with bcryptjs
- [ ] JWT secrets changed for production
- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using TypeORM)
- [ ] XSS protection via DTOs
- [ ] Authentication on protected routes

---

## 📈 Deployment Checklist

- [ ] All tests passing (`npm run test:cov`)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Node modules optimized (production)
- [ ] Build process succeeds (`npm run build`)
- [ ] Health check endpoint responding
- [ ] API documentation accessible (if needed)
- [ ] Logging configured
- [ ] Error tracking enabled (Sentry, etc.)
- [ ] Monitoring setup

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Quick Reference for**: CodeCircle Backend Development Team
