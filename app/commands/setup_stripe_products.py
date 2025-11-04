"""
Script to create Stripe test products for local development and testing.
Run this script to set up all the products defined in your payment config.
"""

import os
import sys
import stripe

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.config.payments import payment_config, load_products_from_config

def setup_stripe_products():
    """Create all products and prices in Stripe test mode"""
    
    # Set Stripe API key
    stripe.api_key = payment_config.stripe.api_key
    
    if not stripe.api_key or "placeholder" in stripe.api_key:
        print("❌ Error: Please set your real Stripe test API key in local.env")
        print("   STRIPE_SECRET_KEY=sk_test_your_actual_key_here")
        return
    
    print("🔧 Setting up Stripe test products...")
    created_products = []
    
    # Load products from config
    products = load_products_from_config()
    
    for product_id, product_config in products.items():
        try:
            print(f"\n📦 Creating product: {product_config.name}")
            
            # Create product
            stripe_product = stripe.Product.create(
                name=product_config.name,
                description=product_config.description,
                metadata={
                    "boilerplate_id": product_id,
                    "type": product_config.type,
                }
            )
            
            # Create price
            price_data = {
                "product": stripe_product.id,
                "unit_amount": product_config.price_cents,
                "currency": product_config.currency,
            }
            
            if product_config.type == "subscription":
                price_data["recurring"] = {"interval": "month"}
            
            stripe_price = stripe.Price.create(**price_data)
            
            created_products.append({
                "name": product_config.name,
                "price_id": stripe_price.id,
                "product_id": stripe_product.id,
                "type": product_config.type,
                "amount": product_config.price_cents / 100
            })
            
            print(f"   ✅ Product ID: {stripe_product.id}")
            print(f"   ✅ Price ID: {stripe_price.id}")
            print(f"   💰 Amount: ${product_config.price_cents / 100}")
            
        except stripe.StripeError as e:
            print(f"   ❌ Error creating {product_config.name}: {e}")
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
    
    print("\n" + "="*50)
    print("🎉 Stripe products created successfully!")
    print("="*50)
    
    print("\n📋 Update your local.env with these price IDs:")
    for product in created_products:
        # Map product names to correct environment variable names
        name_mapping = {
            "Starter Plan": "STRIPE_PRICE_STARTER",
            "Pro Plan": "STRIPE_PRICE_PRO", 
            "Premium Subscription": "STRIPE_PRICE_PREMIUM_SUB",
            "Enterprise Subscription": "STRIPE_PRICE_ENTERPRISE_SUB"
        }
        env_var = name_mapping.get(product['name'], f"STRIPE_PRICE_{product['name'].upper().replace(' ', '_')}")
        print(f"{env_var}={product['price_id']}")
    
    print("\n🧪 Test card numbers:")
    print("   Success: 4242 4242 4242 4242")
    print("   Decline: 4000 0000 0000 0002")
    print("   Insufficient funds: 4000 0000 0000 0341")
    print("   Use any future date for expiry and any 3-digit CVC")
    
    return created_products

if __name__ == "__main__":
    setup_stripe_products()
