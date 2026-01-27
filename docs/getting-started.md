# Getting Started

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
  - [Available Scripts](#available-scripts)
    - [Development](#development)
    - [Production](#production)
    - [Testing](#testing)
    - [Database Operations](#database-operations)
    - [Code Quality](#code-quality)
  - [Runtime Support](#runtime-support)
    - [Node.js (Default)](#nodejs-default)
    - [Bun](#bun)
    - [Deno](#deno)
  - [Initial Setup Checklist](#initial-setup-checklist)
    - [1. Project Configuration](#1-project-configuration)
    - [2. Environment Setup](#2-environment-setup)
    - [3. Database Setup](#3-database-setup)
    - [4. Development Environment](#4-development-environment)
  - [Environment Configuration](#environment-configuration)
  - [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (LTS version 18+ recommended)
- [PostgreSQL](https://www.postgresql.org/download/) (v15+ recommended)
- [Git](https://git-scm.com/)

## Quick Start

```bash
# Clone the repository using degit
git clone https://github.com/Solvit-Africa-Training-Center/code-circle-backend
cd codecircle-backend

# Install dependencies
npm install


# Create environment variables file
cp .env.example .env


# Configure your database settings in .env file
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=postgres
# DB_DATABASE=CodeCircle_db

# Start the development server
npm run start:dev
```

Your application will be available at `http://localhost:3000` and API documentation at `http://localhost:3000/api-docs`.

## Available Scripts

### Development
```bash
# Start development server with Vite
npm run start:dev

# Start with NestJS CLI (alternative)
npm run start:debug

# Start with file watching
npm run watch:dev

```

### Production
```bash
# Build the application
npm run build

# Build for production
npm run build:prod

# Start production server
npm run start:prod
```

### Testing
```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Run test coverage
npm test:cov

```

### Database Operations
```bash
# Generate new migration
npm run db:test

# Create empty migration
npm run migration:create -- MigrationName

# Run pending migrations
npm run migration:generate -- MigrationName

# Show migration status
npm run migration:run

# Revert last migration
npm run migration:revert

# Drop database schema
npm run schema:drop
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Update dependencies
npm run format

# Check for TypeScript errors
npx tsc --noEmit
```

## Initial Setup Checklist


### 1. Project Configuration
- [ ] Update `package.json` with your project details (name, description, author)
- [ ] Modify `LICENSE` with your name/organization
- [ ] Update `README.md` with project-specific information
- [ ] Remove `.github` folder if not needed

### 2. Environment Setup
- [ ] Configure `.env` with your environment variables:
  ```env
  # Database
  DB_HOST=localhost
  DB_PORT=5432
  DB_USERNAME=postgres
  DB_PASSWORD=postgres
  DB_DATABASE=nest_boilerplate

  # JWT
  JWT_SECRET=your-secret-key
  JWT_EXPIRATION_TIME=3600

  # Application
  PORT=3000
  NODE_ENV=development

  # CORS
  CORS_ORIGINS=http://localhost:3000
  ```

### 3. Database Setup
- [ ] Set up your PostgreSQL database
- [ ] Update database configurations in `.env`
- [ ] Run initial migrations: `yarn migration:generate src/database/migrations/initial`

### 4. Development Environment
- [ ] Configure your IDE/editor with TypeScript support
- [ ] Install recommended extensions (ESLint, Prettier)
- [ ] Set up git hooks (Husky is pre-configured)

## Environment Configuration

The application supports multiple environments:

- **Development**: Full debugging, hot reload, detailed logging
- **Staging**: Production-like environment for testing
- **Production**: Optimized for performance and security

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Application port | `3000` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `JWT_SECRET` | JWT signing secret | Required |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

## Next Steps

1. **Explore the Architecture**: Read the [Architecture Documentation](./architecture.md) to understand the project structure and design patterns

2. **Development Setup**: Check the [Development Guide](./development.md) for detailed development instructions and Docker setup

3. **Code Standards**: Review the [Code Style and Patterns](./code-style-and-patterns.md) for coding conventions and best practices

4. **API Documentation**: Visit `http://localhost:3000/documentation` when running the server to explore the auto-generated Swagger documentation

5. **Testing**: Learn about testing strategies in the [Testing Guide](./testing.md)

6. **Deployment**: When ready to deploy, consult the [Deployment Guide](./deployment.md)

7. **Naming Conventions**: Reference the [Naming Cheatsheet](./naming-cheatsheet.md) for consistent naming across your project
