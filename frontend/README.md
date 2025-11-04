# CraftYourStartup Frontend

Modern React + TypeScript frontend for the CraftYourStartup boilerplate, built with Vite and Material-UI.

## 🚀 **Quick Start**

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Opens at http://localhost:5173

# Generate API client (backend must be running)
npm run generate-client
```

## 🏗 **Architecture**

### **Tech Stack**
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type safety throughout the application
- **Vite** - Fast build tool and development server
- **Material-UI v6** - Modern component library with theming
- **TanStack Query** - Server state management and caching
- **React Router v6** - Client-side routing
- **React Hook Form + Yup** - Form handling and validation

### **Project Structure**
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (layouts, buttons, etc.)
│   ├── Home/           # Landing page components
│   ├── Articles/       # Article management components
│   └── Pricing/        # Pricing page components
├── pages/              # Route components
├── client/             # Auto-generated API client
├── hooks/              # Custom React hooks
│   └── api/           # API interaction hooks
├── theme/              # Material-UI theme system
├── config/             # Configuration files
├── context/            # React Context providers
└── utils/              # Utility functions
```

## 🎨 **Customization**

### **Branding**
```bash
# Replace logo files in public/assets/
favicon-16x16.png
favicon-32x32.png
favicon.ico
logo.svg
```

### **Theme Colors**
```typescript
// src/theme/themePrimitives.ts
export const brand = {
  500: '#your-primary-color',  // Main brand color
  // ... full color palette
};
```

### **Content**
```typescript
// src/config/landingPage.ts
export const content = {
  company: {
    name: "Your Company Name",
    tagline: "Your tagline"
  },
  // ... more content configuration
};
```

See [Frontend Customization Guide](../docs/frontend/CUSTOMIZATION_GUIDE.md) for detailed instructions.

## 🔌 **API Integration**

### **Auto-Generated Client**
The frontend uses an auto-generated TypeScript client from the backend's OpenAPI schema:

```bash
# Generate/update API client (backend must be running)
npm run generate-client

# This creates/updates:
src/client/             # Generated API client
├── models/            # TypeScript types
├── services/          # API service methods
└── core/              # Client configuration
```

### **API Hooks**
```typescript
// Example API usage
import { useArticles, useCreateArticle } from '@/hooks/api/useArticles';

const MyComponent = () => {
  const { data: articles, isLoading } = useArticles();
  const createMutation = useCreateArticle();
  
  // Component logic...
};
```

### **Environment Configuration**
```typescript
// Automatically handles different deployment scenarios:
// - Development: Uses Vite proxy (localhost:5173 → localhost:8020)
// - Production Single Docker: Same origin
// - Production Separate Services: Uses VITE_API_URL
```

## 🧪 **Development**

### **Available Scripts**
```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code (alias for lint:fix)
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run tests with Vitest
npm run test:ui          # Run tests with UI
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage

# API Client
npm run generate-client  # Generate TypeScript client from backend
```

### **Development Workflow**
1. **Start backend**: `task run-backend` (in project root)
2. **Start frontend**: `npm run dev`
3. **After backend changes**: `npm run generate-client`

## 🎯 **Key Features**

### **Authentication**
- JWT-based authentication with automatic token handling
- Google OAuth integration
- Protected routes and role-based access
- Password reset flow

### **Payments**
- Stripe integration for subscriptions and one-time payments
- Pricing page with multiple tiers
- Customer portal for billing management
- Payment success/cancel handling

### **Dashboard**
- Modern admin interface
- Responsive sidebar navigation
- Dark/light theme toggle
- User profile management

### **Content Management**
- Article creation and editing
- Rich text support
- Publishing workflow
- User-specific content

## 🌙 **Theme System**

### **Dark/Light Mode**
Built-in theme switching with persistent user preference:

```typescript
import { useColorScheme } from '@mui/material/styles';

const { mode, setMode } = useColorScheme();
// Toggle: setMode(mode === 'light' ? 'dark' : 'light')
```

### **Responsive Design**
Mobile-first approach with Material-UI breakpoints:

```typescript
// Responsive styling
sx={{
  padding: { xs: 2, sm: 4, md: 6 },
  fontSize: { xs: '1rem', sm: '1.2rem', md: '1.5rem' }
}}
```

## 🚀 **Production Build**

### **Build Optimization**
- Code splitting with manual chunks
- Tree shaking for smaller bundles
- Optimized asset loading
- Progressive Web App ready

### **Environment Variables**
```bash
# .env.production
VITE_API_URL=https://your-api-domain.com
# Note: No Stripe keys needed - payments are handled server-side
```

### **Deployment**
```bash
# Build for production
npm run build

# Output in dist/ directory
# Deploy dist/ contents to your static hosting provider
```

## 🔧 **Configuration**

### **Vite Configuration**
```typescript
// vite.config.ts
- Path aliases (@/ → src/)
- Development proxy to backend
- Build optimization
- Test configuration
```

### **TypeScript Configuration**
```json
// tsconfig.json
- Strict type checking
- Path mapping
- Modern ES target
- React JSX support
```

## 🐛 **Troubleshooting**

### **Common Issues**

#### **API Client Generation Fails**
```bash
# Ensure backend is running first
task run-backend

# Then generate client
npm run generate-client
```

#### **Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check
```

#### **Development Server Issues**
```bash
# Check if port 5173 is available
lsof -i :5173

# Try different port
npm run dev -- --port 3000
```

### **Performance Issues**
- Check browser dev tools for bundle size
- Use React DevTools Profiler
- Monitor API response times
- Optimize images and assets

## 📦 **Dependencies**

### **Core Dependencies**
- `react` & `react-dom` - React framework
- `@mui/material` - UI component library
- `@tanstack/react-query` - Server state management
- `react-router-dom` - Client-side routing
- `react-hook-form` - Form handling
- `axios` - HTTP client

### **Development Dependencies**
- `vite` - Build tool and dev server
- `typescript` - Type system
- `eslint` - Code linting
- `vitest` - Testing framework
- `@testing-library/react` - Testing utilities

## 🔄 **Updates & Maintenance**

### **Keeping Dependencies Updated**
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Major version updates (check breaking changes)
npm install package@latest
```

### **Code Quality**
- ESLint configuration enforces consistent code style
- TypeScript provides compile-time error checking
- Prettier formatting (via ESLint)
- Pre-commit hooks (if configured)

---

**Ready to customize your frontend?** Check out the [Frontend Customization Guide](../docs/frontend/CUSTOMIZATION_GUIDE.md)!