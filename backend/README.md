# Space Rep Backend

## Description

Space Rep Backend - A spaced repetition study tool backend built with NestJS, PostgreSQL, and modern development practices.

## Tech Stack

- **NestJS** with TypeScript
- **PostgreSQL** database with Prisma ORM
- **JWT** authentication (configured but not implemented)
- **Docker** for PostgreSQL development database
- **Performance monitoring** and metrics collection
- **Global exception handling** with structured logging

## Project Setup

```bash
npm install
```

## Docker Development Setup

This project uses Docker Compose to run PostgreSQL locally.

### Prerequisites

- Docker
- Docker Compose
- Node.js v22+

### Setup

1. Create a `.env` file by copying the example:
   ```bash
   cp .env.example .env
   ```

2. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

### Managing Docker Services

- **Start services:**
  ```bash
  docker compose up -d
  ```
### Environment File Structure

```
ugp-bos/
├── .env                   # Default development (committed to git)
├── .env.prod              # Production (committed to git, no secrets)
├── .env.staging           # Staging (committed to git, no secrets)
├── .env.test              # Testing (committed to git)
├── .env.local             # Local overrides (add to .gitignore)
└── .env.secrets           # Actual secrets (add to .gitignore)
```

### Branching Strategy

We follow the **GitFlow branching strategy**:

- `main` → Production-ready, stable code (protected).  
- `develop` → Integration branch for features (protected).  
- `feature/*` → Feature development branches (branched from `develop`).  
- `release/*` → Optional, for preparing releases.  
- `hotfix/*` → Optional, for urgent production fixes.  

👉 See [Branching Strategy Documentation](./docs/branching-strategy.md) for full details.

### Usage Commands

**Development (default):**
```bash
docker compose up -d
# or explicitly
docker compose --env-file .env up -d
```

- **Stop services:**
  ```bash
  docker compose down
  ```

- **View logs:**
  ```bash
  docker compose logs postgres
  ```

**Testing:**
```bash
docker compose --env-file .env.test up -d
```

## Environment Variables

The `.env.example` file contains all required environment variables:

```bash
# Application
NODE_ENV=development
PORT=3000
APP_NAME=Space Rep

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/study_tool
DIRECT_DATABASE_URL=postgresql://postgres:password@localhost:5432/study_tool

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=12
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

## Project Structure

```
src/
├── app.module.ts              # Main application module
├── main.ts                    # Application bootstrap
├── core/
│   ├── common/
│   │   ├── decorators/        # Custom decorators
│   │   ├── filters/           # Exception filters
│   │   ├── services/          # Core services (logger)
│   │   └── types/             # Type guards and utilities
│   ├── config/                # Configuration management
│   │   ├── interfaces/        # Config type definitions
│   │   ├── *.config.ts        # Environment configs
│   │   └── config.service.ts  # Type-safe config service
│   └── performance/           # Performance monitoring
│       ├── performance.service.ts
│       ├── performance.interceptor.ts
│       └── metrics.controller.ts
└── prisma/
    ├── prisma.module.ts       # Prisma module
    └── prisma.service.ts      # Prisma service
```

## Available Scripts

```bash
# Development
npm run start:dev              # Start with file watching
npm run start:debug            # Start with debugging

# Build and Production
npm run build                  # Build for production
npm run start:prod             # Start production build

# Code Quality
npm run lint                   # Run ESLint
npm run format                 # Format with Prettier
npm run type-check             # TypeScript type checking

# Testing
npm run test                   # Run unit tests
npm run test:watch             # Run tests in watch mode
npm run test:cov               # Run tests with coverage
npm run test:e2e               # Run end-to-end tests
npm run test:performance       # Run performance analysis

# Database
npx prisma generate            # Generate Prisma client
npx prisma migrate dev         # Run database migrations
npx prisma studio             # Open Prisma Studio
```

## Code Quality and Standards

This project enforces code quality and consistency using ESLint, Prettier, Jest, and Husky.

### ESLint and Prettier

- **Configuration:** TypeScript ESLint with Prettier integration
- **Usage:**
  - Lint and fix: `npm run lint`
  - Format code: `npm run format`

### Jest Testing

Jest is configured with strict coverage thresholds:

- **Coverage Requirements:** 80% for branches, functions, lines, and statements
- **Commands:**
  - Run tests: `npm run test`
  - Coverage report: `npm run test:cov`
  - Watch mode: `npm run test:watch`

### Husky Git Hooks

- **`pre-commit`:** Runs ESLint and tests on staged files
- **`commit-msg`:** Enforces conventional commit format
- **Setup:** Automatically configured via `npm install`

## Features Implemented

### Core Infrastructure
- ✅ NestJS application setup with TypeScript
- ✅ Global exception handling with structured error responses
- ✅ Environment-based configuration management
- ✅ PostgreSQL integration with Prisma ORM
- ✅ Performance monitoring and metrics collection
- ✅ Comprehensive logging service
- ✅ Docker development environment

### Authentication (Configured)
- ✅ JWT configuration setup
- ✅ Password policy configuration
- ⏳ User registration/login (not implemented)
- ⏳ JWT tokens and refresh logic (not implemented)

### Database
- ✅ Prisma ORM setup
- ✅ PostgreSQL connection configuration
- ⏳ Database schema design (not implemented)
- ⏳ Migrations (not implemented)

## Next Steps

1. **Database Schema:** Define User, Deck, Card, and Review models in Prisma
2. **Authentication Module:** Implement JWT-based auth with registration/login
3. **Spaced Repetition Logic:** Implement SM-2/SM-15 algorithms
4. **API Endpoints:** Create REST APIs for deck and card management
5. **Frontend Integration:** Connect with Next.js frontend