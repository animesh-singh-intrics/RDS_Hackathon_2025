# React + Node.js Full-Stack Application

A modern, production-ready full-stack application built with React 19, Node.js, Express, and TypeScript. This project follows industry best practices and provides a solid foundation for scalable web applications.

## 🚀 Features

- ⚛️ **React 19** with TypeScript and modern hooks
- 🏗️ **Vite** for fast development and optimized builds
- 🌐 **Express.js** server with TypeScript
- 🔒 **JWT Authentication** ready-to-implement
- 🎨 **TailwindCSS** for modern UI styling
- 📝 **ESLint + Prettier** for code quality
- 🧪 **Testing** setup with Vitest and Jest
- 📚 **Comprehensive documentation** and coding standards
- 🔄 **Hot reload** for both frontend and backend
- 🛡️ **Security** best practices implemented

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Git** for version control

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd react-node-fullstack-app
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install all dependencies for both client and server
   npm run install:all
   ```

3. **Environment setup**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp client/.env.example client/.env
   ```

4. **Configure environment variables**
   Edit the `.env` files with your configuration:
   ```bash
   # Root .env
   NODE_ENV=development
   PORT=5000
   JWT_SECRET=your-secret-key
   
   # Client .env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

## 🚦 Getting Started

### Development Mode

Start both frontend and backend in development mode:

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

### Individual Services

Start services individually:

```bash
# Frontend only
npm run dev:client

# Backend only  
npm run dev:server
```

### Production Build

```bash
# Build both applications
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
root/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # Base UI components
│   │   │   └── layout/     # Layout components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript definitions
│   │   └── constants/      # App constants
│   ├── public/             # Static assets
│   └── tests/              # Test files
├── server/                 # Express backend application
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript definitions
│   │   └── config/         # Configuration
│   └── tests/              # Test files
├── docs/                   # Documentation
├── config/                 # Shared configuration
└── scripts/                # Build scripts
```

## 🔧 Available Scripts

### Root Level Scripts

```bash
npm run dev              # Start both frontend and backend
npm run build            # Build both applications
npm run start            # Start production server
npm run lint             # Lint both applications
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run test             # Run all tests
npm run typecheck        # Type checking
npm run clean            # Clean build directories
```

### Client Scripts

```bash
cd client
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # ESLint check
npm run lint:fix         # Fix ESLint issues
npm run test             # Run tests with Vitest
npm run test:ui          # Run tests with UI
npm run typecheck        # TypeScript check
```

### Server Scripts

```bash
cd server
npm run dev              # Start with tsx watch
npm run start:dev        # Start with tsx
npm run build            # Compile TypeScript
npm run start            # Start compiled JS
npm run lint             # ESLint check
npm run lint:fix         # Fix ESLint issues
npm run test             # Run Jest tests
npm run typecheck        # TypeScript check
```

## 🏗️ Architecture

### Frontend Architecture

- **Components**: Modular, reusable React components with TypeScript
- **Hooks**: Custom hooks for stateful logic and API interactions
- **Services**: API communication layer with axios
- **State Management**: React Context for global state, React Query for server state
- **Styling**: TailwindCSS with component-based approach
- **Routing**: React Router for navigation

### Backend Architecture

- **Controllers**: Handle HTTP requests and responses
- **Middleware**: Authentication, validation, error handling
- **Routes**: API endpoint definitions
- **Services**: Business logic layer
- **Models**: Data structure definitions
- **Utils**: Helper functions and utilities

## 🔐 Authentication Flow

The application includes a JWT-based authentication system:

1. User registers/logs in via `/api/auth/register` or `/api/auth/login`
2. Server returns JWT token
3. Client stores token and includes it in subsequent requests
4. Server validates token on protected routes
5. Token refresh mechanism for extended sessions

## 🧪 Testing

### Frontend Testing

```bash
cd client
npm run test              # Run all tests
npm run test:ui           # Interactive testing UI
npm run test:coverage     # Coverage report
```

### Backend Testing

```bash
cd server
npm run test              # Run Jest tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

## 📈 Code Quality

This project enforces high code quality standards:

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks
- **Conventional Commits**: Standardized commit messages

## 📚 Development Guide

**⚠️ IMPORTANT**: Before making any code changes, read the comprehensive [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md). This document contains:

- Detailed coding standards and conventions
- TypeScript best practices
- React component patterns
- Express.js architecture guidelines
- API design standards
- Testing strategies
- Git workflow
- Performance guidelines
- Security best practices

**All code must follow these standards strictly.**

## 🌐 API Documentation

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system information

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh

### Users (Protected)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/me` - Get current user

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables**
   ```bash
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=your-production-secret
   MONGODB_URI=your-mongodb-connection
   CLIENT_URL=https://yourdomain.com
   ```

2. **Build Applications**
   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

### Docker Support

```dockerfile
# Example Dockerfile structure
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. **Read the Development Guide**: Familiarize yourself with [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
2. **Fork the repository**
3. **Create a feature branch**: `git checkout -b feature/amazing-feature`
4. **Make your changes** following the coding standards
5. **Run tests**: `npm run test`
6. **Commit changes**: `git commit -m 'feat: add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 3000 or 5000
   npx kill-port 3000 5000
   ```

2. **Dependencies issues**
   ```bash
   # Clean install
   rm -rf node_modules client/node_modules server/node_modules
   npm run install:all
   ```

3. **TypeScript errors**
   ```bash
   # Check TypeScript configuration
   npm run typecheck
   ```

### Getting Help

- Check the [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for detailed documentation
- Review the project structure and examples
- Create an issue for bugs or feature requests

## 🔄 Version History

- **v1.0.0** - Initial release with React 19, Node.js, TypeScript, and comprehensive tooling

---

**Happy Coding! 🎉**

Built with ❤️ using modern web technologies and industry best practices.