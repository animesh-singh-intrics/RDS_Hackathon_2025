# Development Guide & Coding Standards Bible

This document serves as the comprehensive guide for all development practices, coding standards, and conventions used in this React-Node.js full-stack application. **ALL** code written for this project must adhere to these standards.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Naming Conventions](#naming-conventions)
5. [Code Style & Formatting](#code-style--formatting)
6. [TypeScript Standards](#typescript-standards)
7. [React Best Practices](#react-best-practices)
8. [Node.js/Express Best Practices](#nodejsexpress-best-practices)
9. [API Design Standards](#api-design-standards)
10. [Error Handling](#error-handling)
11. [Testing Standards](#testing-standards)
12. [Git Workflow](#git-workflow)
13. [Documentation Standards](#documentation-standards)
14. [Performance Guidelines](#performance-guidelines)
15. [Security Best Practices](#security-best-practices)

## Project Overview

This is a modern full-stack application following industry best practices with:
- **Frontend**: React 19+ with TypeScript, Vite, TailwindCSS
- **Backend**: Node.js with Express 4.x, TypeScript, MongoDB
- **Development**: ESLint, Prettier, Husky, Jest/Vitest

## Technology Stack

### Frontend
- **React 19.1.1** - Latest stable version with modern features
- **TypeScript 5.8+** - Strong typing for better code quality
- **Vite 7.1+** - Fast build tool and development server
- **React Router 7.1+** - Client-side routing
- **TanStack Query 5.x** - Server state management
- **React Hook Form 7.x** - Form management
- **TailwindCSS 3.x** - Utility-first CSS framework
- **Vitest** - Testing framework

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express 4.21+** - Web framework
- **TypeScript 5.8+** - Type safety
- **Mongoose 8.x** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Jest** - Testing framework

## Project Structure

```
root/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # Base UI components (Button, Input, etc.)
│   │   │   └── layout/     # Layout components (Header, Footer, etc.)
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services and external integrations
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   ├── constants/      # Application constants
│   │   ├── assets/         # Static assets (images, icons, etc.)
│   │   └── styles/         # Global styles and TailwindCSS config
│   ├── public/             # Static files
│   └── tests/              # Test files
├── server/                 # Express backend application
│   ├── src/
│   │   ├── controllers/    # Route handlers and business logic
│   │   ├── middleware/     # Express middleware functions
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic and external integrations
│   │   ├── models/         # Database models (Mongoose schemas)
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   ├── config/         # Configuration files
│   │   └── validators/     # Input validation schemas
│   └── tests/              # Test files
├── docs/                   # Project documentation
├── config/                 # Shared configuration files
└── scripts/                # Build and deployment scripts
```

## Naming Conventions

### Files and Directories

- **Components**: PascalCase (`UserProfile.tsx`, `AuthButton.tsx`)
- **Pages**: PascalCase (`HomePage.tsx`, `UserDashboard.tsx`)
- **Hooks**: camelCase starting with 'use' (`useAuthUser.ts`, `useLocalStorage.ts`)
- **Services**: camelCase (`authService.ts`, `apiClient.ts`)
- **Utils**: camelCase (`formatDate.ts`, `validateEmail.ts`)
- **Types**: PascalCase (`User.types.ts`, `ApiResponse.types.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ENDPOINTS.ts`, `ERROR_MESSAGES.ts`)
- **Directories**: kebab-case (`user-profile`, `auth-components`)

### Variables and Functions

- **Variables**: camelCase (`userName`, `isLoading`, `userCount`)
- **Functions**: camelCase (`getUserById`, `handleSubmit`, `validateForm`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`, `API_BASE_URL`)
- **Boolean variables**: Start with is/has/can (`isVisible`, `hasPermission`, `canEdit`)
- **Event handlers**: Start with handle (`handleClick`, `handleSubmit`, `handleChange`)

### React Specific

- **Components**: PascalCase (`UserCard`, `NavigationMenu`)
- **Props interfaces**: Component name + 'Props' (`UserCardProps`, `ButtonProps`)
- **Hooks**: camelCase starting with 'use' (`useUser`, `useAuthToken`)
- **Context**: PascalCase + 'Context' (`AuthContext`, `ThemeContext`)

### Backend Specific

- **Controllers**: camelCase + 'Controller' (`userController`, `authController`)
- **Services**: camelCase + 'Service' (`emailService`, `paymentService`)
- **Models**: PascalCase (`User`, `Product`, `Order`)
- **Routes**: kebab-case (`/api/users`, `/api/user-profiles`)
- **Middleware**: camelCase (`authMiddleware`, `validateRequest`)

## Code Style & Formatting

### Prettier Configuration (Already configured)

```javascript
{
  semi: true,                    // Always use semicolons
  singleQuote: true,            // Use single quotes
  tabWidth: 2,                  // 2 spaces for indentation
  trailingComma: 'es5',         // Trailing commas where valid in ES5
  printWidth: 80,               // Line length limit
  bracketSpacing: true,         // Spaces in object literals
  arrowParens: 'avoid',         // Avoid parens when possible
  jsxSingleQuote: true,         // Single quotes in JSX
}
```

### General Formatting Rules

- **Indentation**: 2 spaces (never tabs)
- **Line length**: 80 characters maximum
- **Semicolons**: Always required
- **Quotes**: Single quotes for strings, double quotes only when necessary
- **Trailing commas**: Always use in multiline structures
- **Object spacing**: Always add spaces inside braces `{ key: value }`
- **Array spacing**: No spaces inside brackets `[item1, item2]`

### Import Organization

```typescript
// 1. Node modules
import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';

// 2. Internal modules (absolute paths)
import { Button } from '@/components/ui/Button';
import { useAuthUser } from '@/hooks/useAuthUser';
import { ApiResponse } from '@/types/api.types';

// 3. Relative imports
import './Component.styles.css';
```

## TypeScript Standards

### Type Definitions

```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

// Use type aliases for unions, primitives, or computed types
type Status = 'pending' | 'approved' | 'rejected';
type UserWithStatus = User & { status: Status };

// Generic types should be descriptive
interface ApiResponse<TData> {
  data: TData;
  message: string;
  success: boolean;
}
```

### Function Signatures

```typescript
// Explicit return types for exported functions
export const getUserById = async (id: string): Promise<User | null> => {
  // implementation
};

// Props interfaces for React components
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  className = '',
}) => {
  // implementation
};
```

### Strict Type Checking

- **No `any` types** - Use `unknown` or proper types
- **Enable strict mode** in TypeScript configuration
- **No implicit returns** - Always specify return types for functions
- **Null checks** - Handle null/undefined explicitly
- **Type guards** - Use when narrowing types

```typescript
// Good: Type guard
const isUser = (obj: unknown): obj is User => {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
};

// Good: Explicit null handling
const getUser = (id: string): User | null => {
  const userData = fetchUserData(id);
  return userData ? parseUser(userData) : null;
};
```

## React Best Practices

### Component Structure

```typescript
// Component file template
import React from 'react';
import { ComponentProps } from './ComponentName.types';
import { useComponentLogic } from './useComponentLogic';
import './ComponentName.styles.css';

/**
 * Brief description of component purpose
 * @param props - Component props
 * @returns JSX element
 */
export const ComponentName: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  className = '',
  ...restProps
}) => {
  const { state, handlers } = useComponentLogic({ prop1, prop2 });

  return (
    <div className={`component-name ${className}`} {...restProps}>
      {/* Component JSX */}
    </div>
  );
};
```

### Hooks Usage

```typescript
// Custom hook structure
export const useUserData = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await userService.getById(userId);
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId, fetchUser]);

  return { user, loading, error, refetch: fetchUser };
};
```

### State Management

- **Local state**: Use `useState` for component-specific data
- **Global state**: Use Context API for app-wide state
- **Server state**: Use TanStack Query for API data
- **Form state**: Use React Hook Form for complex forms

```typescript
// Context setup
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Component Patterns

- **Composition over inheritance**
- **Render props for reusable logic**
- **Higher-order components sparingly**
- **Custom hooks for stateful logic**
- **Compound components for related UI**

## Node.js/Express Best Practices

### Server Structure

```typescript
// Express app setup
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { errorHandler } from '@/middleware/errorHandler';
import { authRoutes } from '@/routes/authRoutes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Routes
app.use('/api/auth', authRoutes);

// Error handling (must be last)
app.use(errorHandler);

export { app };
```

### Controller Pattern

```typescript
// Controller implementation
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { UserService } from '@/services/UserService';
import { AppError } from '@/utils/AppError';

export class UserController {
  private userService = new UserService();

  /**
   * Get user by ID
   * @route GET /api/users/:id
   */
  public getUser = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const user = await this.userService.getUserById(id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'User retrieved successfully',
    });
  };
}
```

### Middleware Pattern

```typescript
// Authentication middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '@/utils/AppError';

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new AppError('Access denied. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    throw new AppError('Invalid token', 401);
  }
};
```

## API Design Standards

### REST API Conventions

- **URLs**: Use nouns, not verbs (`/users` not `/getUsers`)
- **HTTP Methods**: 
  - GET: Retrieve data
  - POST: Create new resource
  - PUT: Update entire resource
  - PATCH: Partial update
  - DELETE: Remove resource
- **Status Codes**: Use appropriate HTTP status codes
- **Response Format**: Consistent JSON structure

### Response Structure

```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00Z"
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Validation

```typescript
// Input validation with express-validator
import { body, param } from 'express-validator';

export const createUserValidation = [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

export const getUserValidation = [
  param('id').isMongoId(),
];
```

## Error Handling

### Frontend Error Handling

```typescript
// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

// API error handling
const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || 'Network error occurred';
  }
  return error instanceof Error ? error.message : 'Unknown error occurred';
};
```

### Backend Error Handling

```typescript
// Custom error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Handle different error types
  if (err.name === 'ValidationError') {
    error = new AppError('Validation Error', 400, err.message);
  }

  const appError = error as AppError;
  const statusCode = appError.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      message: appError.message,
      details: appError.details,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};
```

## Testing Standards

### Frontend Testing (Vitest + React Testing Library)

```typescript
// Component test
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  };

  it('should render user information', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const mockOnEdit = vi.fn();
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });
});
```

### Backend Testing (Jest + Supertest)

```typescript
// API test
import request from 'supertest';
import { app } from '@/app';
import { User } from '@/models/User';

describe('GET /api/users/:id', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should return user when valid id provided', async () => {
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const response = await request(app)
      .get(`/api/users/${user._id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('John Doe');
  });

  it('should return 404 when user not found', async () => {
    const response = await request(app)
      .get('/api/users/507f1f77bcf86cd799439011')
      .expect(404);

    expect(response.body.success).toBe(false);
  });
});
```

## Git Workflow

### Commit Message Format

Follow Conventional Commits specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(auth): add JWT token refresh functionality
fix(user-profile): resolve avatar upload issue
docs(readme): update installation instructions
refactor(api): improve error handling structure
```

### Branch Naming

- **Feature branches**: `feature/description` (`feature/user-authentication`)
- **Bug fixes**: `fix/description` (`fix/login-validation`)
- **Hotfixes**: `hotfix/description` (`hotfix/security-patch`)
- **Release branches**: `release/version` (`release/v1.2.0`)

### Pull Request Guidelines

1. **Clear title and description**
2. **Link to related issues**
3. **Include screenshots for UI changes**
4. **Ensure all tests pass**
5. **Request appropriate reviewers**
6. **Keep PRs focused and small**

## Documentation Standards

### Code Comments

```typescript
/**
 * Retrieves user data from the API with caching
 * @param userId - The unique identifier for the user
 * @param options - Configuration options for the request
 * @param options.cache - Whether to use cached data if available
 * @param options.timeout - Request timeout in milliseconds
 * @returns Promise that resolves to user data or null if not found
 * @throws {ApiError} When the request fails or user is not authorized
 * @example
 * ```typescript
 * const user = await getUserData('123', { cache: true, timeout: 5000 });
 * if (user) {
 *   console.log(user.name);
 * }
 * ```
 */
export const getUserData = async (
  userId: string,
  options: RequestOptions = {}
): Promise<User | null> => {
  // Implementation
};
```

### README Structure

Each major component should have a README.md:

1. **Purpose and overview**
2. **Installation and setup**
3. **Usage examples**
4. **API documentation**
5. **Contributing guidelines**
6. **Troubleshooting**

## Performance Guidelines

### Frontend Performance

- **Code splitting**: Use React.lazy for route-based splitting
- **Memoization**: Use React.memo, useMemo, useCallback appropriately
- **Bundle analysis**: Regular bundle size monitoring
- **Image optimization**: Use appropriate formats and sizes
- **Lazy loading**: Implement for non-critical content

```typescript
// Code splitting example
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Memoization example
const ExpensiveComponent = React.memo(({ data }) => {
  const computedValue = useMemo(() => {
    return expensiveComputation(data);
  }, [data]);

  return <div>{computedValue}</div>;
});
```

### Backend Performance

- **Database queries**: Use indexes, avoid N+1 queries
- **Caching**: Implement Redis for frequently accessed data
- **Compression**: Use gzip compression for responses
- **Connection pooling**: Optimize database connections
- **Rate limiting**: Prevent abuse and ensure fair usage

## Security Best Practices

### Frontend Security

- **Input sanitization**: Sanitize user inputs
- **XSS prevention**: Use React's built-in protection
- **CSRF protection**: Implement CSRF tokens
- **Secure storage**: Never store sensitive data in localStorage
- **HTTPS only**: Ensure all communications are encrypted

### Backend Security

- **Authentication**: Implement proper JWT handling
- **Authorization**: Role-based access control
- **Input validation**: Validate all incoming data
- **SQL injection prevention**: Use parameterized queries
- **Rate limiting**: Implement request rate limits
- **Headers**: Use security headers (helmet.js)

```typescript
// Security middleware setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}));
```

---

## Conclusion

This guide serves as the foundation for all development work on this project. Every developer must:

1. **Read and understand** all sections before contributing
2. **Follow conventions** consistently across the codebase  
3. **Update documentation** when making changes
4. **Review code** against these standards
5. **Ask questions** when standards are unclear

**Remember**: These standards exist to ensure code quality, maintainability, and team productivity. They should be treated as requirements, not suggestions.

For questions or suggestions regarding these standards, please create an issue in the project repository.