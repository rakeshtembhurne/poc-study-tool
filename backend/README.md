# UGP Pyramid Backend

## Description

UGP Pyramid Backend app by Pinnacle Technologies Pvt Ltd

## Project setup

```bash
npm install
```

## Docker-based Development

This project includes a Docker Compose setup for a complete local development environment.

### Prerequisites

- Docker
- Docker Compose

### Setup

1.  Create a `.env` file by copying the example:
    ```bash
    cp .env.example .env
    ```
2.  Review and adjust the variables in the `.env` file if needed.

### Running the environment

-   **For development (including debug tools):**
    ```bash
    docker compose up -d
    ```
    This will start all services, including Kafka-UI.

    - Kafka UI will be available at http://localhost:8086

-   **For production-like environment (without debug tools):**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    ```

### Managing services

-   **To stop the services:**
    ```bash
    docker compose down
    ```
-   **To view logs:**
    ```bash
    docker compose logs -f <service_name>
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

### Usage Commands

**Development (default):**
```bash
docker compose up -d
# or explicitly
docker compose --env-file .env up -d
```

**Production:**
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

**Staging:**
```bash
docker compose --env-file .env.staging up -d
```

**Testing:**
```bash
docker compose --env-file .env.test up -d
```

**Local with overrides:**
```bash
docker compose --env-file .env --env-file .env.local up -d
```

### Security Best Practices

Create `.env.secrets` for actual production secrets:
```bash
# .env.secrets (DO NOT COMMIT THIS FILE)
POSTGRES_PASSWORD= your_actual_production_password
CLICKHOUSE_PASSWORD= your_actual_clickhouse_password
REDIS_PASSWORD= your_actual_redis_password
JWT_SECRET=your_actual_jwt_secret
```

Update your `.gitignore`:
```gitignore
.env.local
.env.secrets
.env.*.local
```

### Environment-Specific Features

-   **Development**: UI tools enabled, debug logging, simple passwords
-   **Production**: Strong passwords, resource limits, minimal logging
-   **Staging**: Production-like with UI tools for testing
-   **Testing**: Fast startup, cleanup enabled, external services disabled
-   **Local**: Port overrides for personal development

### Loading Multiple Environment Files

```bash
# Load base + environment + secrets
docker compose --env-file .env --env-file .env.staging --env-file .env.secrets up -d
```

This setup provides a complete environment management strategy for different deployment scenarios while maintaining security and flexibility.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Versions

## Code Quality and Standards

This project enforces code quality and consistency using ESLint, Prettier, Jest, and Husky.

### ESLint and Prettier

ESLint is configured with the AirBnb style guide to ensure consistent code style and identify potential issues. Prettier is integrated to automatically format code, ensuring a uniform appearance across the codebase.

- **Configuration:**
  - ESLint extends `airbnb-base` and `airbnb-typescript/base`.
  - Prettier is integrated via `plugin:prettier/recommended`.
- **Usage:**
  - To lint and fix issues: `npm run lint`
  - To format code: `npm run format`

### Jest

Jest is used for testing with a strict coverage threshold to maintain high code quality.

- **Coverage Thresholds (80% for each):**
  - Branches
  - Functions
  - Lines
  - Statements
- **Usage:**
  - To run all tests: `npm run test`
  - To run tests with coverage: `npm run test:cov`

### Husky

Husky is configured to enforce commit standards and run checks before commits.

- **`pre-commit` Hook:** This hook automatically runs ESLint and Jest tests on your staged files before you commit. This ensures that only code adhering to our quality standards and passing all tests is committed, preventing common issues from entering the codebase.

- **`commit-msg` Hook:** This hook enforces our commit message guidelines, which are based on the Conventional Commits specification and integrate with our JIRA workflow. Adhering to these rules is crucial for maintaining a clear, searchable, and automatically generatable change log.

  **Commit Message Structure and Rules:**
  Commit messages must follow the pattern: `[JIRA-TICKET]: <type>(<scope>): <subject>`

  **Examples:**

  ```
  feat(auth): Add new user authentication module #UPF-456

  This commit introduces a new user authentication module with JWT support.
  ```

  ```
  fix(login): Correct typo in login page #UPF-456

  Fixed a minor typo in the error message displayed on the login page.
  ```

  ```
  fix(signup): correct typo in signup page 

  Not Allowed as the Its should be capital at start and jira story code should be mention at the end of the commit message. ❌
  ```

  **Key Rules Enforced:**
  - **Jira issue key:** Every commit message *must* include a Jira story code (e.g., `[UPF-123]` or `UPF-123`) in the subject. This links commits directly to tasks and issues.
  - **Type:** The commit type must not be empty. Use one of the following types:
    - `feat`: A new feature
    - `fix`: A bug fix
    - `docs`: Documentation only changes
    - `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
    - `refactor`: A code change that neither fixes a bug nor adds a feature
    - `test`: Adding missing tests or correcting existing tests
    - `chore`: Build process or auxiliary tool changes
  - **Scope (Optional):** Provides context for the change (e.g., `auth`, `user-profile`, `database`).
  - **Subject:** A concise, imperative description of the change, starting with a lowercase letter and no period at the end. The subject must not be empty.
  - **Body (Optional):** Provides additional context about the change, if necessary. Each line should not exceed 100 characters.
  - **Header Length:** The header (first line) should not exceed 72 characters.
- **Setup:** Husky hooks are automatically set up when `npm install` is run (via the `prepare` script in `package.json`).
