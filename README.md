# Space Rep

A modern flashcard application using spaced repetition algorithms (SM-2 and SM-15) to optimize learning and retention.

## Overview

Space Rep helps users learn and retain information efficiently through scientifically-proven spaced repetition techniques. Users can create decks of flashcards, import content from files, and review them at optimal intervals.

## Tech Stack

### Backend

- **NestJS** with TypeScript
- **PostgreSQL** database with Prisma ORM
- **JWT** authentication
- **Docker** for containerization
- **OpenRouter API** for AI integration (optional)

### Frontend

- **Next.js** with TypeScript
- **React Context** for state management
- **fetch** for API communication
- **Tailwind CSS** with shadcn for styling

## Core Features

### 1. Authentication System

- User registration and login
- JWT-based authentication with refresh tokens
- Password reset functionality
- Protected routes and auth guards

### 2. Deck Management

- Create, edit, and delete decks
- Public/private deck settings
- Community deck sharing
- Deck statistics and analytics

### 3. Card Management

- Create flashcards with front/back content
- Bulk operations (create, edit, delete) (when ai is implemented)
- Card ordering and organization
- Card preview functionality

### 4. File Processing

- Upload PDF and text files
- Automatic content extraction
- Convert file content to flashcards
- Support for multiple file formats

### 5. AI Integration

- Generate cards from text prompts
- Bulk card generation from files
- OpenRouter API integration
- Usage tracking and cost estimation

### 6. Review System

- **SM-2 Algorithm**: Basic spaced repetition
- **SM-15 Algorithm**: Advanced algorithm with OF Matrix
- Card scheduling based on performance
- Review queue generation
- Progress tracking and statistics

### 7. Advanced Features

- Keyboard shortcuts for reviews
- Dark mode support
- Mobile responsive design
- Performance analytics dashboard

## Spaced Repetition Algorithms

### SM-2 (Default)

- Simple algorithm with 6 grade levels
- Easiness factor adjustments
- Interval multiplier based on performance

### SM-15 (Advanced)

- Optimum Factor (OF) Matrix
- Memory stability calculations
- A-Factor for difficulty assessment
- Forgetting curves visualization

## Development Phases

1. **Phase 1**: Project setup, database configuration, authentication system
2. **Phase 2**: Core backend infrastructure and user management
3. **Phase 3**: Deck and card CRUD operations
4. **Phase 4**: File processing and content extraction
5. **Phase 5**: AI integration for card generation
6. **Phase 6**: Review system with SM-2 algorithm
7. **Phase 7**: Advanced SM-15 algorithm implementation
8. **Phase 8**: Testing, UI polish, and documentation
9. **Phase 9**: Deployment and production setup

## Getting Started

### Prerequisites

- Node.js (v22+)
- PostgreSQL
- Docker & Docker Compose (optional)
- OpenRouter API key (optional, for AI features)

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
cd backend
npx prisma migrate dev

# Start development servers
# Backend
npm run start:dev

# Frontend (new terminal)
cd frontend
npm run dev
```

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/study_tool
DIRECT_DATABASE_URL=postgresql://postgres:password@localhost:5432/study_tool
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
OPENROUTER_API_KEY=your_api_key_here
MODULES_AI_ENABLED=true
MODULES_FILE_PROCESSING_ENABLED=true
MODULES_ANALYTICS_ENABLED=true
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```


### Setup Environment Variables

Copy `.env.example` files into `.env`:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

## Branching Strategy

We follow a simple **Git workflow** for this project.

### Branches

-  **main** → Stable, production-ready code (protected).
-  **develop** → Integration branch for all features.
-  **feature/** → For new features or issues (e.g., `feature/login-auth`).

### Contribution Workflow

1.  **Fork** the repository.
2. Create a feature branch from `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<feature-name>
```

3. Commit & push changes to **your fork**.
4. Open a **Pull Request** from your fork’s `feature/*` → main repo’s `develop`.
5. After review & approval, it will be merged.

### Rules
- Do **not** commit directly to `main` or `develop`.
- Always create a PR for merging.
- Keep branch names meaningful (linked to issue/feature).

## Commit Message Guidelines
Follow a clear and consistent commit message style to make project history easy to read and understand.

### Commit Format
```
type(scope): subject (#issue-number)
```
- **type** → Type of change (feat, fix, docs, etc.)  
- **scope** → Area of code affected (auth, ui, api, etc.)  
- **subject** → Short description of the change (5–75 characters, lowercase, no sentence-case or PascalCase)  
- **references** → Issue or ticket number (required, e.g., `#123`)  

### Rules Enforced
- Maximum header length: 200 characters  
- Subject length: 5–75 characters  
- Type, scope, subject, and references **cannot be empty**  
- Subject **cannot** be sentence-case, start-case, PascalCase, or UPPERCASE  

### Examples

#### ✅ Correct
```
feat(auth): add login validation (#123)
```
#### ❌ Incorrect
```
Fix: Login Bug
```
- Type not lowercase  
- Scope missing  
- Subject wrong case  
- References missing  

## Contributing

This project follows a multi-developer workflow. Please:

1. Pick an issue from GitHub Issues
2. Create a feature branch
3. Follow the existing code patterns
4. Submit a PR when complete

## License

Private
