This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Setup Environment Variables

Copy `.env.example` files into `.env`:

- **From the project root** (run this if you are in the main folder):

  ```bash
  cp frontend/.env.example frontend/.env # Copies frontend env file

  cp .env.example .env      # run this if you are in respective folder
  ```

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
- **`commit-msg`:** Enforces conventional commit format
- **Setup:** Automatically configured via `npm install`

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
