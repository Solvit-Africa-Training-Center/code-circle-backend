# CodeCircle Backend

<p align="center">
  <strong>CodeCircle Backend API</strong> - A robust and scalable NestJS backend for the CodeCircle platform
</p>

## Description

CodeCircle Backend is a Node.js REST API built with [NestJS](https://nestjs.com/) and TypeScript. This backend handles authentication, user management, and provides core services for the CodeCircle platform. It uses TypeORM for database management and includes comprehensive testing with Jest.

### Key Features
- **Authentication Module** - Secure user authentication and authorization
- **User Management** - Complete user account management and profiles
- **Database Integration** - TypeORM with SQL database support
- **Testing Framework** - Unit and E2E tests with Jest
- **Type Safety** - Full TypeScript support
- **Scalable Architecture** - Modular design following NestJS best practices

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL (or your configured database)

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd circle-backend
npm install
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=CodeCircle_db

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Project setup

```bash
$ npm install
```

## Running the Application

```bash
# development
$ npm run start

# watch mode (with auto-reload)
$ npm run start:dev

# production mode
$ npm run start:prod
```

The application will be available at `http://localhost:3000` by default.

## Database Migrations

```bash
# Create a new migration
$ npm run migration:create

# Run all pending migrations
$ npm run migration:run

# Revert the last migration
$ npm run migration:revert
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Project Structure

```
circle-backend/
├── src/
│   ├── common/              # Shared decorators, filters, guards, interceptors
│   ├── config/              # Configuration files (database, TypeORM)
│   ├── database/            # Migrations, seeds, factories
│   ├── modules/
│   │   ├── auth/           # Authentication module
│   │   └── users/          # User management module
│   ├── app.module.ts       # Root module
│   └── main.ts             # Application entry point
├── test/                    # End-to-end tests
└── package.json
```

## Modules Overview

### Authentication Module (`auth`)
Handles user authentication with JWT tokens and session management.
- **Service**: Authentication logic and token generation
- **Controller**: Authentication endpoints
- **DTOs**: Request/Response data transfer objects

### Users Module (`users`)
Manages user accounts and profiles.
- **Service**: User CRUD operations
- **Controller**: User management endpoints
- **DTOs**: User data validation schemas
- **Entity**: User database model

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API Documentation

### Authentication Endpoints
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT token
- `POST /auth/logout` - Logout user session
- `POST /auth/refresh` - Refresh authentication token

### User Endpoints
- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Deployment

When you're ready to deploy your application to production:

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables
3. Run migrations on production database
4. Start the application:
   ```bash
   npm run start:prod
   ```

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is proprietary and owned by the CodeCircle team.

## Support

For issues, questions, or contributions, please contact the development team or open an issue in the repository.

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io/)
- [Jest Testing Framework](https://jestjs.io/)
