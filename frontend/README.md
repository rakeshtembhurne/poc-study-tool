# Space Rep Frontend

A modern React frontend for the Space Rep spaced repetition application, built with Next.js, TypeScript, and Tailwind CSS.

## Overview

The frontend provides a responsive, accessible user interface for the Space Rep spaced repetition system, featuring:

- **Authentication**: JWT-based login and registration
- **Review System**: Interactive spaced repetition review sessions
- **Dashboard**: Learning progress tracking and analytics
- **Deck Management**: Create and organize flashcard collections
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Context** for state management
- **Fetch API** for backend communication

## Getting Started

### Prerequisites

- Node.js (v22+)
- Backend server running on http://localhost:3000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

### Environment Setup

Copy the environment file:

```bash
cp .env.example .env.local
```

Configure your environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Dashboard and main app
│   └── review/            # Review session pages
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Authentication components
│   ├── review/            # Review session components
│   └── dashboard/         # Dashboard components
├── lib/
│   ├── api/               # API client functions
│   ├── auth/              # Authentication utilities
│   └── utils.ts           # General utilities
├── types/                 # TypeScript type definitions
└── contexts/              # React context providers
```

## Implementation Status

### ✅ **Completed Features**

- ✅ Project setup with Next.js and TypeScript
- ✅ Tailwind CSS and shadcn/ui configuration
- ✅ Code quality tools (ESLint, Prettier)
- ✅ Environment configuration

### 🚧 **In Development**

- 🚧 Authentication pages and components
- 🚧 Review session interface
- 🚧 Dashboard and analytics
- 🚧 API integration with backend

### 📋 **Planned Features**

- Review session UI with grade buttons
- Progress tracking and statistics
- Deck management interface
- Responsive mobile design
- Dark mode support

## Code Quality and Standards

This project enforces code quality and consistency using ESLint, Prettier, and Husky.

### ESLint and Prettier

- **Configuration:** TypeScript ESLint with Prettier integration and Next.js optimizations
- **Usage:**
  - Lint and fix: `npm run lint`
  - Lint check (read-only): `npm run lint:check`
  - Format code: `npm run format`
  - Format check (read-only): `npm run format:check`
  - Type checking: `npm run type-check`
  - Config validation: `npm run config:validate`

### ESLint Configuration Features

- **Next.js Integration**: Includes `next/core-web-vitals` and `next/typescript` configs
- **TypeScript Support**: Full TypeScript ESLint rules with type-aware linting
- **Prettier Integration**: Automatic code formatting with ESLint
- **Unused Imports**: Automatic removal of unused imports and variables
- **Custom Rules**: Tailored rules for React/Next.js best practices

### Why Different ESLint Configurations?

**Frontend (Next.js)**: Uses Next.js optimized rules with `eslint-config-next` which includes:

- React-specific rules optimized for Next.js applications
- Performance optimizations for client-side React code
- Next.js specific patterns (Image, Link, etc.)
- Web Vitals and SEO optimization rules

**Backend (NestJS)**: Uses `eslint-config-airbnb-extended` which includes:

- Node.js server-side best practices
- More strict code organization rules suitable for backend APIs
- Enhanced security patterns for server applications
- Comprehensive TypeScript enterprise patterns

This separation allows each codebase to follow patterns most appropriate for its runtime environment and framework requirements.

### Husky Git Hooks

- **`pre-commit`:** Runs ESLint and tests on staged files
- **`commit-msg`:** Enforces conventional commit format with flexible rules
- **Setup:** Automatically configured via `npm install`

**Commit Message Format:**

```
type(scope): subject #123
type(scope): subject #123, #456  // Multiple issues supported

[optional body]
```

For detailed commit message guidelines and examples, see the [main project README](../README.md#commit-message-guidelines).

## API Integration

The frontend communicates with the Space Rep backend API for all data operations.

### Authentication Flow

```typescript
// Login example
const response = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const { accessToken } = await response.json();
```

### Review Session Integration

```typescript
// Get due cards
const dueCards = await fetch(`${API_URL}/api/review/due`, {
  headers: { Authorization: `Bearer ${token}` },
});

// Submit review with SM-15 algorithm
const result = await fetch(`${API_URL}/api/review/submit`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    cardId: 1,
    grade: 4, // 0-5 scale (0=blackout, 3=pass, 5=perfect)
    responseTimeMs: 3500,
  }),
});
```

### Backend Integration Status

- ✅ **Backend Ready**: Complete SM-15 algorithm implementation
- ✅ **Authentication**: JWT-protected endpoints
- ✅ **Review API**: Full spaced repetition functionality
- ✅ **Analytics**: Advanced performance tracking
- 🚧 **Frontend**: Currently implementing UI components

For complete API documentation, see [Backend API Documentation](../backend/documentation/api/sm15-review-endpoints.md).

## UI Components (shadcn/ui)

This project is configured with [shadcn/ui](https://ui.shadcn.com/) for consistent, accessible UI components built on top of Radix UI and Tailwind CSS.

### Configuration

The project includes a `components.json` configuration file with the following setup:

- **Style**: New York variant
- **TypeScript**: Enabled with RSC support
- **Tailwind**: Configured with CSS variables and neutral base color
- **Icon Library**: Lucide React
- **Component Path**: `@/components/ui`

### Installing Components

To add new shadcn/ui components to your project:

#### 1. Install the shadcn/ui CLI (if not already installed)

```bash
npx shadcn@latest init
```

#### 2. Add Individual Components

```bash
# Add a button component
npx shadcn@latest add button

# Add a card component
npx shadcn@latest add card

# Add multiple components at once
npx shadcn@latest add button card input label
```

### Troubleshooting

```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Clean reinstall
rm -rf node_modules .next
npm install
npm run dev
```
