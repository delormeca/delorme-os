# Add Stripe Payment Feature

Extend the Stripe integration with a new payment feature.

**Arguments**: `$ARGUMENTS` - Description of payment feature (e.g., "add lifetime deal one-time purchase option")

## Steps:

1. **Create Stripe Product & Price** (choose one method):
   
   **Method A: Stripe Dashboard**
   - Go to Stripe Dashboard → Products
   - Create product with price
   - Copy price ID (starts with `price_`)
   
   **Method B: Script**
   - Edit `app/commands/setup_stripe_products.py`
   - Add product/price definition
   - Run: `poetry run python app/commands/setup_stripe_products.py`

2. **Add Price ID to Config**
   - Edit `app/config/payments.py`
   - Add new price ID constant
   - Update `local.env` with: `STRIPE_PRICE_NEW_PRODUCT=price_xxx`

3. **Update Payment Manager**
   - Edit `app/services/payment_manager.py`
   - Add method for new checkout type
   - Handle product-specific logic

4. **Handle Webhook Events**
   - Edit `app/services/webhook_handler.py`
   - Add event handlers if needed
   - Update user plan/permissions after purchase
   - Send confirmation emails

5. **Update Controller**
   - Edit `app/controllers/payments.py`
   - Add endpoint for new checkout session
   - Return session URL for redirect

6. **Frontend Integration**
   - Run: `task frontend:generate-client`
   - Edit `frontend/src/hooks/api/usePayments.ts`
   - Add mutation hook for new payment type
   - Create UI button/form in relevant page

7. **Test Payment Flow**
   ```bash
   # Start Stripe webhook listener
   stripe listen --forward-to localhost:8000/api/payments/webhook
   
   # Test in browser with test cards
   # Success: 4242 4242 4242 4242
   # Decline: 4000 0000 0000 0002
   ```

8. **Update Database Models** (if needed)
   - Edit `app/models.py`
   - Create migration: `task db:migrate-create -- "add payment feature"`
   - Apply: `task db:migrate-up`

## Example Flow:

For adding "lifetime deal":
1. Create "Lifetime Access" product in Stripe
2. Add `STRIPE_PRICE_LIFETIME` to payments config
3. Add `create_lifetime_checkout()` to payment_manager.py
4. Handle `checkout.session.completed` in webhook_handler.py
5. Add `/payments/lifetime/checkout` endpoint
6. Create `useLifetimeDealCheckout()` hook
7. Add "Buy Lifetime" button in pricing page

See existing patterns in:
- `app/services/payment_manager.py`
- `app/services/webhook_handler.py`
- `frontend/src/pages/Pricing.tsx`

