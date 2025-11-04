#!/usr/bin/env python3
"""
Test script to verify payment integration setup
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config.payments import payment_config, load_products_from_config
from app.config.base import config
from app.services.payment_manager import PaymentManager
from app.db import get_async_db_session

async def test_payment_setup():
    """Test the payment configuration"""
    
    print("Testing Payment Integration Setup...")
    print("="*50)
    
    # Test configuration
    print(f"Environment: {config.env}")
    print(f"Domain: {payment_config.domain}")
    
    # Load and test products
    products = load_products_from_config()
    print(f"Products configured: {len(products)}")
    
    # Test products
    print("\nConfigured Products:")
    for product_id, product in products.items():
        print(f"  - {product.name} ({product_id}): ${product.price_cents/100}")
    
    # Test Stripe connection
    try:
        import stripe
        stripe.api_key = payment_config.stripe.api_key
        
        # Try to list products
        products = stripe.Product.list(limit=1)
        print(f"\n✅ Stripe connection successful")
        
    except Exception as e:
        print(f"\n❌ Stripe connection failed: {e}")
    
    # Test database connection
    try:
        async for db in get_async_db_session():
            print("✅ Database connection successful")
            break
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
    
    print("\nSetup test completed!")

if __name__ == "__main__":
    asyncio.run(test_payment_setup())
