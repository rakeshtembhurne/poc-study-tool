# Spaced Repetition Study Tool

A modern flashcard application using spaced repetition algorithms (SM-2 and SM-15) to optimize learning and retention.

## Overview

This application helps users learn and retain information efficiently through scientifically-proven spaced repetition techniques. Users can create decks of flashcards, import content from files, use AI to generate cards, and review them at optimal intervals.

## Tech Stack

### Backend

- **NestJS** with TypeScript
- **PostgreSQL** database with Prisma ORM
- **JWT** authentication
- **Docker** for containerization
- **OpenRouter API** for AI integration

### Frontend

- **Next.js** with TypeScript (static export)
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

- Node.js (v18+)
- PostgreSQL
- Docker & Docker Compose
- OpenRouter API key (for AI features)

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
DATABASE_URL=postgresql://user:password@localhost:5432/study_tool
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
OPENROUTER_API_KEY=your_api_key
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

## Contributing

This project follows a multi-developer workflow. Please:

1. Pick an issue from GitHub Issues
2. Create a feature branch
3. Follow the existing code patterns
4. Submit a PR when complete

## License

Private

