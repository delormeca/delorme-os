# Admin Dashboard

The CraftYourStartup boilerplate includes a comprehensive admin dashboard built with SQLAdmin, providing a powerful interface for managing users, payments, and business analytics.

## 🔗 **Access**

**Admin URL**: http://localhost:8020/admin/ (note the trailing slash is required)

**Important**: SQLAdmin requires a trailing slash in the URL. Accessing `http://localhost:8020/admin` (without trailing slash) will return a 404 error.

## 🔐 **Authentication**

The admin panel uses secure authentication with:
- **Login Required**: Only superuser accounts can access the admin
- **Bcrypt Hashing**: Secure password verification
- **Session Management**: Persistent login sessions

### **Creating Admin Users**
```bash
# Create superuser account
task db:user-create -- --email admin@yourdomain.com --password securepassword --full_name "Admin User"

# Or using dev script
poetry run python dev.py create-super admin@yourdomain.com "Admin User"
```

## 📊 **Features**

### **User Management**
- **View Users**: Browse all user accounts in a table format
- **Search**: Find users by email, name, or Stripe customer ID
- **Filter**: Filter by account type, verification status, admin status
- **Basic Info**: View user details

### **Purchase Tracking**
- **View Purchases**: Browse all purchase transactions
- **Search**: Find purchases by transaction ID or product type
- **Filter**: Filter by product type, success status, currency
- **Transaction Details**: Amount, date, Stripe transaction ID

### **Subscription Monitoring**
- **View Subscriptions**: Browse all user subscriptions
- **Search**: Find subscriptions by Stripe ID or plan name
- **Filter**: Filter by plan type and subscription status
- **Status Tracking**: Monitor active, canceled, expired subscriptions

## 🎨 **Custom Analytics Dashboards**

### **Payment Analytics Dashboard**
- **Total Revenue**: Sum of all successful purchases
- **Transaction Count**: Number of successful transactions
- **Active Subscriptions**: Count of currently active subscriptions
- **Recent Transactions**: Last 10 successful purchases with customer details

### **User Insights Dashboard**
- **Total Users**: Count of all registered users
- **Account Distribution**: Breakdown by account type (free, premium, etc.)
- **Top Spenders**: List of users with highest total purchase amounts
- **Purchase Activity**: Number of purchases per user

## 🔧 **Technical Details**

### **Built With**
- **SQLAdmin**: FastAPI admin interface
- **AsyncSession**: Async database operations
- **Custom Templates**: Custom admin interface
- **FontAwesome Icons**: Modern UI elements

### **Security Features**
- **Superuser Only**: Restricted to admin accounts
- **Session Security**: Secure session management
- **Password Protection**: Bcrypt password hashing
- **CSRF Protection**: Built-in security measures

### **Performance**
- **Async Operations**: Non-blocking database queries
- **Optimized Queries**: Efficient data retrieval
- **Pagination**: Large dataset handling
- **Caching**: Session and query optimization

## 🚀 **Deployment**

### **Production Setup**
```bash
# Ensure admin user exists
ENV_FILE=prod.env task db:user-create -- --email admin@yourdomain.com --password securepassword --full_name "Admin"

# Access admin panel
https://yourdomain.com/admin/
```

### **Environment Variables**
No additional configuration required - the admin panel uses the same database and authentication settings as the main application.

## 🔍 **Troubleshooting**

### **Common Issues**

#### **404 Error on Admin Access**
- **Cause**: Missing trailing slash in URL
- **Solution**: Use `http://localhost:8020/admin/` (with trailing slash)

#### **Login Failed**
- **Cause**: User is not a superuser
- **Solution**: Create admin user with `is_superuser=True`
```bash
task db:user-create -- --email admin@example.com --password pass --full_name "Admin"
```

#### **Database Connection Issues**
- **Cause**: Database not running or misconfigured
- **Solution**: Check database connection and run migrations
```bash
task db:docker-start
task db:migrate-up
```

## 📈 **Analytics Available**

- **Revenue Metrics**: Total revenue and transaction counts
- **User Metrics**: User count and account type distribution
- **Subscription Metrics**: Active subscription count
- **Customer Insights**: Top spending customers and purchase history

The admin dashboard provides essential business metrics to help you monitor your users, track revenue, and understand your customer base.
