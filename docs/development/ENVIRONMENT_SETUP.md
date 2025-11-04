# Environment Setup Guide

This guide walks you through setting up your development environment for the CraftYourStartup boilerplate.

## 📋 **Prerequisites**

Before starting, ensure you have these installed:

- [Python 3.11+](https://www.python.org/downloads/)
- [Poetry](https://python-poetry.org/docs/#installation) (Python dependency management)
- [Node.js 18+](https://nodejs.org/) (Frontend development)
- [Docker](https://docs.docker.com/get-docker/) (Database)
- [Taskfile](https://taskfile.dev/#/installation) (Task runner)

### **Quick Verification**
```bash
python --version    # Should be 3.11+
poetry --version    # Should be 1.0+
node --version      # Should be 18+
docker --version    # Should be 20+
task --version      # Should be 3.0+
```

## 🚀 **Automated Setup (Recommended)**

The fastest way to get started:

```bash
# Clone the repository
git clone <your-repo-url>
cd craftyourstartup-boilerplate

# Complete automated setup
task full-setup
```

This automatically:
- ✅ Installs backend dependencies (Poetry)
- ✅ Installs frontend dependencies (npm)
- ✅ Creates environment files from examples
- ✅ Sets up payment integration structure
- ✅ Starts database services

## 🔧 **Manual Setup (Step by Step)**

If you prefer to understand each step:

### **1. Backend Setup**
```bash
# Install Python dependencies
task backend:install

# Or manually:
poetry install
```

### **2. Frontend Setup**
```bash
# Install Node.js dependencies
task frontend:install

# Or manually:
cd frontend && npm install && cd ..
```

### **3. Environment Configuration**
```bash
# Create environment files
task setup-env

# This creates:
# - local.env (from local.env.example)
# - prod.env (from prod.env.example)
```

### **4. Database Setup**
```bash
# Start PostgreSQL database
task db:docker-start

# Apply database migrations
task db:migrate-up

# Create admin user (optional)
task db:user-create -- --email admin@yourdomain.com --password admin123 --full_name "Admin User"
```

## ⚙️ **Environment Configuration**

### **Local Development (`local.env`)**

After running `task setup-env`, update these key values in `local.env`:

```env
# Database (already configured for local development)
db_username=craftyourstartup
db_password=craftyourstartup
db_host=localhost
db_port=54323
db_database=craftyourstartup

# Security (change for production)
secret_key=dev-secret-key-change-in-production

# Application URLs
domain=http://localhost:5173
redirect_after_login=http://localhost:5173/dashboard

# Stripe (get from https://stripe.com) - Backend only
STRIPE_SECRET_KEY=sk_test_your_test_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key  # Used by backend for validation
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret

# Google OAuth (optional)
google_oauth2_client_id=your_google_client_id
google_oauth2_secret=your_google_client_secret

# Email (optional for local dev)
mailchimp_api_key=your_mailchimp_key
```

### **Production (`prod.env`)**

For production deployment, update `prod.env` with:
- Secure database credentials
- Strong secret keys
- Production domain URLs
- Live Stripe keys
- Production email service

## 🔌 **Payment Integration Setup**

### **1. Create Stripe Account**
1. Go to [stripe.com](https://stripe.com) and create an account
2. Get your test API keys from the dashboard
3. Update `local.env` with your keys

### **2. Setup Payment Integration**
```bash
# Initialize payment system
task payments:setup

# Create test products
task payments:products-create

# Test the integration
task payments:test-integration
```

### **3. Configure Webhooks**
1. In Stripe dashboard, go to Webhooks
2. Add endpoint: `http://localhost:8020/api/payments/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`
4. Copy webhook secret to `local.env`

## 🧪 **Verify Installation**

### **1. Test Configuration**
```bash
# Test backend configuration
task backend:config-test

# Should show:
# ✅ Configuration loaded successfully
# ✅ Database URL configured
# ✅ Payment domain configured
```

### **2. Start Development Servers**
```bash
# Terminal 1: Backend
task run-backend
# Should start at http://localhost:8020

# Terminal 2: Frontend  
task run-frontend
# Should start at http://localhost:5173
```

### **3. Test API Client Generation**
```bash
# Generate TypeScript client (after backend is running)
task frontend:generate-client

# Should create/update frontend/src/client/
```

### **4. Health Check**
```bash
# Check all services
task health-check

# Should show:
# ✅ Backend running (http://localhost:8020)
# ✅ Frontend running (http://localhost:5173)
# ✅ Database running (PostgreSQL)
```

## 🌐 **Access Your Application**

After successful setup:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8020
- **API Documentation**: http://localhost:8020/docs
- **Admin Interface**: http://localhost:8020/admin/

## 🐛 **Troubleshooting**

### **Database Issues**
```bash
# Check if Docker is running
docker ps

# Restart database
task db:docker-restart

# Check database logs
task db:docker-logs
```

### **Frontend Issues**
```bash
# Clear node modules and reinstall
task frontend:clean-install

# Fix common build issues
task frontend:troubleshoot
```

### **Backend Issues**
```bash
# Check Python environment
poetry env info

# Reinstall dependencies
poetry install --sync

# Test configuration loading
poetry run python dev.py test-config
```

### **Port Conflicts**
If ports 5173 or 8020 are in use:

```bash
# Check what's using the ports
lsof -i :5173
lsof -i :8020

# Kill processes if needed
kill -9 <PID>
```

## 🔄 **Daily Development Workflow**

Once set up, your daily workflow is:

```bash
# 1. Start backend (Terminal 1)
task run-backend

# 2. Start frontend (Terminal 2)
task run-frontend

# 3. After backend API changes (Terminal 3)
task frontend:generate-client
```

## 📝 **Environment Variables Reference**

### **Required for Basic Functionality**
- `secret_key` - JWT signing key
- `db_*` - Database connection
- `domain` - Application domain

### **Required for Payments**
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_WEBHOOK_SECRET` - Webhook verification

### **Optional Features**
- `google_oauth2_*` - Google OAuth login
- `mailchimp_api_key` - Email sending
- `aws_*` - File storage (if using S3)

## ✅ **Next Steps**

After completing environment setup:

1. **Customize Your App**: See [Frontend Customization Guide](../frontend/CUSTOMIZATION_GUIDE.md)
2. **Deploy to Production**: See [Deployment Guide](../deployment/DEPLOYMENT_POPULAR.md)
3. **Add Features**: See [API Development Guide](API_DEVELOPMENT.md)

Your development environment is now ready! 🎉
