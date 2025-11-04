# CraftYourStartup Boilerplate - AI Velocity Edition

Welcome to the complete documentation! This is the premium AI-optimized version with all production features plus comprehensive Cursor rules and Claude Code integration for AI-first development.

## 📚 **Quick Navigation**

### **Getting Started**
- [🛠 Environment Setup](development/ENVIRONMENT_SETUP.md) - Configure your development environment
- [🚀 Deployment Guide](deployment/DEPLOYMENT_POPULAR.md) - Deploy to production platforms
- [🎨 Frontend Customization](frontend/CUSTOMIZATION_GUIDE.md) - Customize the UI and branding
- [🤖 Claude Code Guide](claude-workflows/getting-started.md) - AI-assisted development

### **Core Features**
- **Authentication**: JWT + OAuth with Google integration
- **Payments**: Stripe subscriptions and one-time payments
- **Admin Panel**: SQLAdmin with payment analytics & user insights
- **Analytics**: Multi-tier analytics system
- **Integrations**: Third-party integration templates
- **Dashboard**: Modern Material-UI interface with RBAC
- **API**: Auto-generated TypeScript client from OpenAPI
- **Database**: PostgreSQL with SQLModel and Alembic migrations

### **AI Development Features (Exclusive)**
- **Cursor Rules**: 18 optimized rules covering all patterns
- **Claude Code**: CLAUDE.md + custom commands + workflows
- **Dual AI Support**: Works with Cursor AND Claude Code
- **Instant Context**: AI understands your architecture immediately

## 🏗 **Architecture Overview**

### **Backend (FastAPI)**
```
app/
├── controllers/     # API endpoints (HTTP layer)
├── services/       # Business logic
├── models.py       # Database models (SQLModel)
├── schemas/        # Pydantic request/response models
├── config/         # Environment configuration
└── commands/       # CLI utilities
```

### **Frontend (React + TypeScript)**
```
frontend/src/
├── components/     # Reusable UI components
├── pages/         # Route components
├── client/        # Auto-generated API client
├── hooks/         # Custom React hooks
├── theme/         # Material-UI theme system
└── utils/         # Utility functions
```

## 🚀 **Quick Start Commands**

```bash
# Complete setup for new developers
task full-setup

# Development workflow
task run-backend     # Terminal 1: Start API server
task frontend:generate-client # Terminal 2: Update API client
task run-frontend    # Terminal 3: Start frontend

# Database operations
task db:migrate-up   # Apply migrations
task db:user-create  # Create admin user

# Payment setup
task payments:setup  # Initialize Stripe integration
```

## 🔧 **Configuration**

The boilerplate uses automatic environment loading:

- **Development**: `local.env` (auto-loaded)
- **Production**: `prod.env` (use `ENV_FILE=prod.env`)
- **Custom**: Set `ENV_FILE=your-file.env`

Key configuration areas:
- Database connection
- JWT authentication
- Stripe payments
- OAuth providers
- Email services

## 📖 **Detailed Guides**

### Development
- [Environment Setup](development/ENVIRONMENT_SETUP.md) - Complete dev environment configuration
- [API Development](development/API_DEVELOPMENT.md) - Adding new API endpoints
- [Database Management](development/DATABASE.md) - Migrations and models

### Deployment
- [Popular Platforms](deployment/DEPLOYMENT_POPULAR.md) - Railway, Vercel, Digital Ocean
- [Docker Deployment](deployment/DOCKER.md) - Containerized deployment
- [Environment Variables](deployment/ENVIRONMENT_VARIABLES.md) - Production configuration

### Frontend
- [Customization Guide](frontend/CUSTOMIZATION_GUIDE.md) - Branding and UI customization
- [Theme System](frontend/THEME_SYSTEM.md) - Material-UI theme configuration
- [Component Library](frontend/COMPONENTS.md) - Available UI components

### Features
- [Authentication System](features/AUTHENTICATION.md) - JWT, OAuth, user management
- [Payment Integration](features/PAYMENTS.md) - Server-side Stripe architecture and setup
- [Admin Dashboard](features/ADMIN.md) - User and payment monitoring interface

## 🛠 **Development Workflow**

1. **Initial Setup**
   ```bash
   task full-setup  # One-time setup
   ```

2. **Daily Development**
   ```bash
   task run-backend    # Start API (Terminal 1)
   task run-frontend   # Start UI (Terminal 2)
   ```

3. **After Backend Changes**
   ```bash
   task frontend:generate-client  # Update TypeScript client
   ```

4. **Database Changes**
   ```bash
   task db:migrate-create -- "Description"
   task db:migrate-up
   ```

## 🚀 **Deployment Options**

Choose your preferred deployment strategy:

### **Single Docker (Recommended for MVP)**
- **Platforms**: Railway, Render, Digital Ocean App Platform
- **Pros**: Simple, cost-effective, easy to manage
- **Setup**: `task deploy-railway-docker`

### **Separate Services (Recommended for Scale)**
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, Digital Ocean
- **Database**: Railway PostgreSQL, AWS RDS
- **Setup**: `task deploy-vercel-railway`

## 📞 **Support & Community**

- **Documentation Issues**: Check this documentation first
- **Development Issues**: See troubleshooting sections
- **Feature Requests**: Consider the modular architecture

## 🔄 **Updates & Maintenance**

This boilerplate follows semantic versioning and includes:
- Security updates
- Dependency updates
- New feature additions
- Performance improvements

Keep your installation updated by checking the repository for new releases.

---

**Ready to build your startup?** Start with the [Environment Setup](development/ENVIRONMENT_SETUP.md) guide!
