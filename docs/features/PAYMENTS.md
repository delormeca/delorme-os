# Payment System Architecture

The CraftYourStartup boilerplate implements a **server-side payment architecture** using Stripe Checkout Sessions for maximum security and simplicity.

## 🏗 **Architecture Overview**

### **Server-Side Payment Flow**
```
Frontend → Backend API → Stripe Checkout → Stripe Webhooks → Backend Processing
```

1. **Frontend**: Calls backend API to create checkout session
2. **Backend**: Creates Stripe checkout session with product details
3. **Redirect**: User is redirected to Stripe's hosted checkout page
4. **Payment**: User completes payment on Stripe's secure platform
5. **Webhook**: Stripe notifies backend of payment status
6. **Redirect**: User returns to success/cancel page

### **Why Server-Side?**
- ✅ **Maximum Security**: No sensitive data in frontend
- ✅ **PCI Compliance**: Stripe handles all card data
- ✅ **Simplified Frontend**: No complex payment forms
- ✅ **Reliable Webhooks**: Server-side webhook handling
- ✅ **Better UX**: Stripe's optimized checkout experience

## 🔧 **Configuration**

### **Backend Environment Variables**
```env
# Required for payment processing
STRIPE_SECRET_KEY=sk_test_your_secret_key        # Server-side operations
STRIPE_PUBLISHABLE_KEY=pk_test_your_public_key   # Used for validation only
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret  # Webhook verification

# Product Price IDs (auto-created by setup script)
STRIPE_PRICE_STARTER=price_test_placeholder
STRIPE_PRICE_PRO=price_test_placeholder
STRIPE_PRICE_PREMIUM_SUB=price_test_placeholder
STRIPE_PRICE_ENTERPRISE_SUB=price_test_placeholder
```

### **Frontend Environment Variables**
```env
# Only needs API URL - no Stripe keys required
VITE_API_URL=https://your-backend-api.com
```

**Important**: The frontend does **NOT** need Stripe keys because all payment processing happens server-side.

## 🚀 **Payment Setup Process**

### **1. Stripe Account Setup**
```bash
# Create Stripe account at stripe.com
# Get API keys from dashboard
# Update local.env with your keys
```

### **2. Initialize Payment System**
```bash
# Setup payment integration
task payments:setup

# Create Stripe products and prices
task payments:products-create

# Test the integration
task payments:test-integration
```

### **3. Webhook Configuration**
```bash
# In Stripe dashboard:
# 1. Go to Webhooks section
# 2. Add endpoint: https://your-domain.com/api/payments/webhook
# 3. Select events:
#    - checkout.session.completed
#    - customer.subscription.created
#    - customer.subscription.updated
#    - customer.subscription.deleted
#    - invoice.payment_succeeded
#    - invoice.payment_failed
# 4. Copy webhook secret to environment
```

## 💳 **Payment Flow Implementation**

### **Frontend Payment Trigger**
```typescript
// components/Pricing/PricingCards.tsx
import { useCheckoutWithProduct } from '@/hooks/api/usePayments';

const PricingCard = ({ product }) => {
  const { checkoutWithProduct, isLoading } = useCheckoutWithProduct();
  
  const handlePurchase = () => {
    // This calls the backend API to create a checkout session
    checkoutWithProduct(product.id);
    // User will be redirected to Stripe checkout
  };
  
  return (
    <Button onClick={handlePurchase} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Subscribe'}
    </Button>
  );
};
```

### **Backend Checkout Session Creation**
```python
# app/services/payment_manager.py
async def create_checkout_session(self, request: CreateCheckoutRequest):
    """Create Stripe checkout session"""
    
    # Get product configuration
    product_config = self.config.products[request.product_id]
    
    # Create checkout session parameters
    session_params = {
        "success_url": f"{self.config.domain}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{self.config.domain}/payment/cancel",
        "customer_email": self.current_user.email,
        "metadata": {
            "user_id": str(self.current_user.user_id),
            "product_id": request.product_id,
        },
    }
    
    # Configure for subscription vs one-time payment
    if product_config.type == "subscription":
        session_params.update({
            "mode": "subscription",
            "line_items": [{"price": product_config.stripe_price_id, "quantity": 1}],
        })
    else:
        session_params.update({
            "mode": "payment", 
            "line_items": [{"price": product_config.stripe_price_id, "quantity": 1}],
        })
    
    # Create session with Stripe
    session = stripe.checkout.Session.create(**session_params)
    
    return CheckoutSessionResponse(
        checkout_url=session.url,
        session_id=session.id,
        expires_at=datetime.fromtimestamp(session.expires_at),
    )
```

### **Webhook Processing**
```python
# app/services/webhook_handler.py
async def handle_webhook(self, request: Request):
    """Process Stripe webhook events"""
    
    # Validate webhook signature
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    event = stripe.Webhook.construct_event(
        payload, sig_header, self.config.stripe.webhook_secret
    )
    
    # Process different event types
    if event["type"] == "checkout.session.completed":
        await self._handle_checkout_completed(event["data"]["object"])
    elif event["type"] == "customer.subscription.created":
        await self._handle_subscription_created(event["data"]["object"])
    # ... handle other events
```

## 🎯 **Supported Payment Types**

### **Subscriptions**
- Monthly/yearly recurring billing
- Trial periods supported
- Automatic renewal
- Proration for plan changes
- Cancellation handling

### **One-Time Payments**
- Single product purchases
- Digital downloads
- Service packages
- Credits/tokens

## 🔐 **Security Features**

### **Webhook Security**
- Signature verification for all webhooks
- Idempotency handling for duplicate events
- Secure event processing with database transactions

### **Data Protection**
- No payment data stored locally
- All sensitive operations server-side
- Stripe handles PCI compliance
- Encrypted communication throughout

### **Error Handling**
- Comprehensive error logging
- Graceful failure handling
- User-friendly error messages
- Automatic retry logic

## 🛠 **Development Testing**

### **Test Mode Setup**
```bash
# Use Stripe test keys (sk_test_*, pk_test_*)
# Test webhooks with Stripe CLI
stripe listen --forward-to localhost:8020/api/payments/webhook

# Test payments with test card numbers
# 4242424242424242 - Successful payment
# 4000000000000002 - Card declined
```

### **Testing Checklist**
- [ ] Successful subscription creation
- [ ] Successful one-time payment
- [ ] Payment failure handling
- [ ] Webhook event processing
- [ ] Customer portal access
- [ ] Subscription cancellation

## 📊 **Analytics & Monitoring**

### **Payment Metrics**
- Conversion rates by plan
- Monthly recurring revenue (MRR)
- Churn analysis
- Failed payment tracking

### **Stripe Dashboard**
- Real-time payment monitoring
- Customer management
- Subscription analytics
- Dispute handling

## 🚨 **Production Checklist**

### **Before Going Live**
- [ ] Switch to live Stripe keys
- [ ] Configure production webhook endpoint
- [ ] Test live payment flow
- [ ] Set up monitoring and alerts
- [ ] Configure backup webhook endpoints
- [ ] Document incident response procedures

### **Monitoring Setup**
- [ ] Payment success/failure alerts
- [ ] Webhook processing monitoring
- [ ] Revenue tracking dashboard
- [ ] Customer support integration

## 🔄 **Common Operations**

### **Managing Subscriptions**
```bash
# Cancel subscription
task payments:cancel-subscription -- user@example.com

# Update subscription plan
task payments:change-plan -- user@example.com --plan pro

# Handle failed payments
task payments:retry-payment -- subscription_id
```

### **Troubleshooting**
```bash
# Check payment configuration
task payments:test-integration

# Validate webhook setup
task payments:test-webhooks

# Review payment logs
task payments:logs -- --last-24h
```

The server-side payment architecture provides a secure, scalable foundation for your startup's billing needs while maintaining simplicity for developers and users alike.
