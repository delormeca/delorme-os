# Popular Deployment Platforms

This guide covers the most popular and reliable deployment options for the CraftYourStartup boilerplate.

## 🚀 **Deployment Strategies**

### **Strategy 1: Single Docker (Recommended for MVP)**
- **Best for**: MVPs, small teams, cost-conscious deployments
- **Platforms**: Railway, Render, Digital Ocean App Platform
- **Pros**: Simple setup, lower cost, single service to manage
- **Cons**: Less scalable, single point of failure

### **Strategy 2: Separate Services (Recommended for Scale)**
- **Best for**: Production apps, scaling teams, high availability
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, Digital Ocean
- **Database**: Railway PostgreSQL, AWS RDS
- **Pros**: Better scalability, independent scaling, CDN benefits
- **Cons**: More complex, higher cost, multiple services to manage

## 🛤️ **Railway Deployment (Single Docker)**

Railway is the easiest platform for full-stack deployment.

### **Prerequisites**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### **Deployment Steps**
```bash
# 1. Build and test locally
task backend:docker-build

# 2. Initialize Railway project
railway new

# 3. Set environment variables
railway variables set SECRET_KEY=your-production-secret-key
railway variables set STRIPE_SECRET_KEY=sk_live_your_live_key
# ... add all production variables

# 4. Deploy
railway up
```

### **Environment Variables for Railway**
```env
# Required
SECRET_KEY=your-secure-production-key
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key  # Used by backend
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Database (Railway will provide)
DATABASE_URL=postgresql://user:pass@host:port/db

# Application
DOMAIN=https://your-app.railway.app
REDIRECT_AFTER_LOGIN=https://your-app.railway.app/dashboard

# Optional
GOOGLE_OAUTH2_CLIENT_ID=your_google_client_id
MAILCHIMP_API_KEY=your_mailchimp_key
```

### **Railway Database Setup**
```bash
# Add PostgreSQL service
railway add postgresql

# Get database URL
railway variables

# Update your environment with the provided DATABASE_URL
```

## ▲ **Vercel + Railway (Separate Services)**

For production-grade scalability, deploy frontend and backend separately.

### **Frontend to Vercel**

#### **1. Prepare Frontend**
```bash
cd frontend

# Create production build
npm run build

# Test build locally
npm run preview
```

#### **2. Deploy to Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_API_URL production
# Enter your Railway backend URL: https://your-backend.railway.app
```

#### **3. Configure Custom Domain**
1. In Vercel dashboard, go to your project
2. Settings → Domains
3. Add your custom domain
4. Update DNS records as instructed

### **Backend to Railway**
```bash
# 1. Create Railway project for backend only
railway new craftyourstartup-api

# 2. Set environment variables
railway variables set SECRET_KEY=your-production-secret
railway variables set DOMAIN=https://your-frontend-domain.com
railway variables set STRIPE_SECRET_KEY=sk_live_your_key

# 3. Deploy backend
railway up
```

## 🌊 **Digital Ocean App Platform**

Cost-effective alternative with good performance.

### **Single Docker Deployment**
```bash
# 1. Create App Spec
cat > .do/app.yaml << EOF
name: craftyourstartup
services:
- name: web
  source_dir: /
  github:
    repo: your-username/your-repo
    branch: main
  run_command: uvicorn main:app --host 0.0.0.0 --port 8080
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: SECRET_KEY
    value: your-production-secret
  - key: STRIPE_SECRET_KEY
    value: sk_live_your_key
databases:
- name: db
  engine: PG
  version: "13"
EOF

# 2. Deploy using doctl CLI
doctl apps create --spec .do/app.yaml
```

### **Separate Services on Digital Ocean**
```bash
# Frontend (Static Site)
doctl apps create --spec .do/frontend.yaml

# Backend (App Platform)  
doctl apps create --spec .do/backend.yaml

# Database (Managed Database)
doctl databases create craftyourstartup-db --engine pg --region nyc1
```

## 🎯 **Render Deployment**

Simple alternative to Railway with good free tier.

### **Backend Setup**
1. Connect GitHub repository
2. Choose "Web Service"
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### **Environment Variables**
```env
PYTHON_VERSION=3.11.0
SECRET_KEY=your-production-secret
STRIPE_SECRET_KEY=sk_live_your_key
DATABASE_URL=postgresql://user:pass@host/db
```

### **Database Setup**
1. Create PostgreSQL service in Render
2. Copy connection string to `DATABASE_URL`

## 🔧 **Production Configuration**

### **Environment Variables Checklist**

#### **Security (Required)**
- [ ] `SECRET_KEY` - Strong random string (32+ chars)
- [ ] `DATABASE_URL` - Production database connection
- [ ] `DOMAIN` - Your production domain

#### **Payments (If using Stripe)**
- [ ] `STRIPE_SECRET_KEY` - Live key (sk_live_...)
- [ ] `STRIPE_PUBLISHABLE_KEY` - Live key (pk_live_...)
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook secret

#### **Authentication (Optional)**
- [ ] `GOOGLE_OAUTH2_CLIENT_ID` - Production OAuth app
- [ ] `GOOGLE_OAUTH2_SECRET` - Production OAuth secret

#### **Email (Optional)**
- [ ] `MAILCHIMP_API_KEY` - Transactional email API
- [ ] `FROM_EMAIL` - Your domain email
- [ ] `SUPPORT_EMAIL` - Support contact

### **Database Migration**
```bash
# After deployment, run migrations
ENV_FILE=prod.env task db:migrate-up

# Or via deployment platform CLI
railway run alembic upgrade head
```

### **SSL/HTTPS Setup**
Most platforms handle SSL automatically:
- **Railway**: Automatic HTTPS
- **Vercel**: Automatic HTTPS + CDN
- **Digital Ocean**: Automatic HTTPS
- **Render**: Automatic HTTPS

### **Custom Domain Setup**
1. **Purchase domain** (Namecheap, GoDaddy, etc.)
2. **Configure DNS**:
   ```
   Type: CNAME
   Name: www
   Value: your-app.platform.app
   
   Type: A
   Name: @
   Value: platform-ip-address
   ```
3. **Update environment variables**:
   ```env
   DOMAIN=https://yourdomain.com
   REDIRECT_AFTER_LOGIN=https://yourdomain.com/dashboard
   ```

## 📊 **Platform Comparison**

| Platform | Free Tier | Pricing | Ease of Use | Performance | Best For |
|----------|-----------|---------|-------------|-------------|----------|
| **Railway** | $5/month | $0.10/GB-hour | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Full-stack apps |
| **Vercel** | Yes | $20/month | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Frontend only |
| **Digital Ocean** | No | $12/month | ⭐⭐⭐ | ⭐⭐⭐⭐ | Cost-conscious |
| **Render** | Yes | $7/month | ⭐⭐⭐⭐ | ⭐⭐⭐ | Simple deployments |

## 🚨 **Production Checklist**

Before going live:

### **Security**
- [ ] Strong secret keys generated
- [ ] Database credentials secured
- [ ] HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled

### **Performance**
- [ ] Database indexes optimized
- [ ] Static files served via CDN
- [ ] Gzip compression enabled
- [ ] Database connection pooling configured

### **Monitoring**
- [ ] Health check endpoints working
- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring setup
- [ ] Database monitoring enabled

### **Backup**
- [ ] Database backups automated
- [ ] Environment variables backed up
- [ ] Code repository secured
- [ ] Recovery procedures documented

## 🆘 **Troubleshooting**

### **Common Deployment Issues**

#### **Build Failures**
```bash
# Check build logs
railway logs

# Test build locally
task backend:docker-build
docker run -p 8020:8020 craftyourstartup
```

#### **Database Connection Issues**
```bash
# Verify database URL format
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:port/db

# Test connection
railway run python -c "from app.config import config; print('DB OK' if config.database_url else 'DB ERROR')"
```

#### **Environment Variable Issues**
```bash
# List all variables
railway variables

# Test configuration loading
railway run python dev.py test-config
```

## 📈 **Scaling Considerations**

### **Traffic Growth**
- **0-1K users**: Single Docker deployment
- **1K-10K users**: Separate frontend/backend
- **10K+ users**: Add Redis caching, CDN, load balancer

### **Database Scaling**
- **Small**: Single PostgreSQL instance
- **Medium**: Read replicas
- **Large**: Database sharding, connection pooling

### **Cost Optimization**
- Monitor usage regularly
- Use appropriate instance sizes
- Implement caching strategies
- Optimize database queries

Your production deployment is now ready! 🚀

## 📞 **Getting Help**

If you encounter deployment issues:
1. Check platform-specific documentation
2. Review deployment logs
3. Test locally with production environment
4. Check environment variable configuration
