# Delorme OS - AI-Powered SaaS Platform

The ultimate production-ready full-stack SaaS platform **optimized for AI-first development**. Complete with Stripe payments, admin panel, analytics, integrations, RBAC, **plus comprehensive Cursor rules and Claude Code optimization**.

## 📚 **Complete Documentation**

📖 **[View Full Documentation](docs/README.md)** - Comprehensive guides for development, deployment, and customization

## 🚀 **Quick Start**

Get up and running in minutes:

### Prerequisites

- [Python 3.11+](https://www.python.org/downloads/)
- [Poetry](https://python-poetry.org/docs/#installation)
- [Docker](https://docs.docker.com/get-docker/)
- [Taskfile](https://taskfile.dev/#/installation)
- [Node.js 18+](https://nodejs.org/) (for frontend)

### Complete Setup (One Command)

```bash
# Complete project setup for new developers
task full-setup
```

This automatically:
- ✅ Installs all dependencies (backend & frontend)
- ✅ Sets up environment files
- ✅ Starts local database
- ✅ Applies database migrations

### Development Workflow

```bash
# 1. Start backend (Terminal 1)
task run-backend

# 2. Generate API client (Terminal 2)
task generate-client

# 3. Start frontend (Terminal 3)  
task run-frontend
```

**Access your app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8020
- API Docs: http://localhost:8020/docs

## 🏗 **Architecture**

### **Core Technologies**
- **Backend**: FastAPI + SQLModel + PostgreSQL + Alembic
- **Frontend**: React 18 + TypeScript + Vite + Material-UI  
- **Authentication**: JWT + OAuth (Google)
- **Payments**: Stripe integration
- **API Client**: Auto-generated TypeScript client from OpenAPI

### **Production Features**
- ✅ **Authentication**: JWT + Google OAuth + Password Reset
- ✅ **Stripe Payments**: Subscriptions + One-time + Webhooks + Customer Portal
- ✅ **Admin Panel**: SQLAdmin with Payment Analytics & User Insights dashboards
- ✅ **Analytics**: Basic, Advanced, Premium reporting + Team analytics
- ✅ **Integrations**: Webhook templates + Third-party catalog (Slack, Zapier, etc.)
- ✅ **RBAC System**: Feature permissions + Plan-based access control
- ✅ **Email**: Mailchimp Transactional (password reset, notifications)
- ✅ **Content**: Article CRUD with publish/draft status
- ✅ **UI**: Material-UI v6 + Dark Mode + Responsive layouts
- ✅ **Database**: PostgreSQL + SQLModel + Alembic migrations
- ✅ **Docker**: Full containerization + compose setup
- ✅ **Testing**: pytest + vitest + comprehensive fixtures

### **AI Development Assistant (EXCLUSIVE)**
- 🤖 **18 Optimized Cursor Rules** (<500 lines each, all with descriptions)
  - Frontend patterns, backend architecture, database, payments, RBAC, deployment
- 🤖 **Claude Code Package**:
  - `CLAUDE.md` - Comprehensive project context (~400 lines)
  - `.claude/settings.json` - Pre-configured tool permissions
  - `.claude/commands/` - 5 custom slash commands (new-api-endpoint, new-component, add-payment-feature, create-migration, run-tests, fix-lint)
  - `docs/claude-workflows/` - AI pair programming guides
- 🤖 **Dual AI Support**: Works perfectly with BOTH Cursor AND Claude Code
- 🤖 **Instant Productivity**: AI knows your codebase structure immediately
- 🤖 **Enforced Patterns**: Consistent code via AI rules

## 🚀 **Deployment**

Choose your deployment strategy:

```bash
# See all deployment options
task deploy-help

# Deploy to Railway (single Docker - simplest)
task deploy-railway-docker

# Deploy to Vercel + Railway (separate services - scalable)
task deploy-vercel-railway
```

**Supported platforms:**
- Railway (recommended)
- Vercel + Railway
- Render
- Digital Ocean
- Heroku

## 📖 **Documentation**

- **[📚 Complete Documentation](docs/README.md)** - Start here for comprehensive guides
- **[🛠 Environment Setup](docs/development/ENVIRONMENT_SETUP.md)** - Configure your environment
- **[🚀 Popular Deployments](docs/deployment/DEPLOYMENT_POPULAR.md)** - Deploy to production
- **[🎨 Frontend Customization](docs/frontend/CUSTOMIZATION_GUIDE.md)** - Customize the UI

### **Quick Setup Guide**
```bash
# 1. Complete automated setup
task full-setup

# 2. Update environment files with your keys
# Edit local.env with your Stripe keys, database settings, etc.

# 3. Start development
task run-backend     # Terminal 1
task run-frontend    # Terminal 2
```

## 🔧 **Common Commands**

```bash
# Development
task full-setup          # Complete project setup
task run-backend         # Start backend
task run-frontend        # Start frontend  
task generate-client     # Sync API types

# Database
task alembic-revision-local -- "Migration name"
task alembic-upgrade-local

# Code Quality
task test-backend        # Run backend tests
task test-frontend       # Run frontend tests
task lint-backend        # Lint backend code
task format-backend      # Format backend code
```

## 🎯 **What's Included**

- **Authentication system** with Google OAuth
- **User dashboard** with modern UI
- **Article/content management** system
- **Payment processing** with Stripe
- **Admin interface** for monitoring users and payments
- **API documentation** auto-generated
- **Database migrations** with Alembic
- **Docker setup** for easy deployment
- **CI/CD workflows** ready to use

## 🤖 **AI-First Development**

This boilerplate is optimized for AI coding assistants:

### **Using Cursor** (Recommended)
- All 18 Cursor rules are automatically loaded
- Just start coding - Cursor knows the patterns
- Type `@` to reference rules by name

### **Using Claude Code**
```bash
# Install Claude Code CLI
curl -fsSL https://claude.ai/install.sh | sh

# Start Claude in your project
cd delorme-os
claude

# Use custom commands
/new-api-endpoint GET /api/users/{id}/stats
/new-component UserStatsCard
/add-payment-feature lifetime deal purchase
/create-migration add email_verified to users
/run-tests
/fix-lint
```

See [Claude Code Getting Started](docs/claude-workflows/getting-started.md) for full guide.

## 💡 **Next Steps**

1. **Setup**: Run `task full-setup` - complete automated installation
2. **Environment**: Update `local.env` with Stripe keys & Google OAuth
3. **Payment Setup**: Run `task payments:setup` to initialize Stripe products
4. **Create Admin**: Run `task db:user-create` for admin panel access
5. **Start Coding**: Use Cursor or Claude Code - they know your codebase!
6. **Customize**: Modify branding, add features - AI assists you
7. **Deploy**: Railway, Vercel, or Digital Ocean - see deployment guides

### **AI Coding Tips**
- Read `CLAUDE.md` to see what context AI has
- Check `.cursor/rules/` for all available patterns
- Use `/` in Claude Code to see custom commands
- AI knows: architecture, patterns, common commands, gotchas

### **Need Help?**
- 📖 **Full Documentation**: [docs/README.md](docs/README.md)
- 🛠 **Setup Issues**: [docs/development/ENVIRONMENT_SETUP.md](docs/development/ENVIRONMENT_SETUP.md)
- 🚀 **Deployment**: [docs/deployment/DEPLOYMENT_POPULAR.md](docs/deployment/DEPLOYMENT_POPULAR.md)

Happy building! 🚀
