#!/usr/bin/env python3
"""
Stripe Payment Setup Guide
"""

def print_header(title: str):
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def main():
    """Show simple setup instructions"""
    print_header("🚀 Stripe Payment Setup")
    
    print("Follow these steps to set up Stripe payments:")
    print()
    
    steps = [
        "1. Copy environment file:",
        "   cp local.env.example local.env",
        "",
        "2. Add your Stripe test keys to local.env:",
        "   STRIPE_SECRET_KEY=sk_test_your_key",
        "   STRIPE_PUBLISHABLE_KEY=pk_test_your_key", 
        "   STRIPE_WEBHOOK_SECRET=whsec_your_secret",
        "",
        "3. Create products in Stripe:",
        "   task payments:products-create",
        "",
        "4. Test your setup:",
        "   task payments:test-integration",
        "",
        "5. Check status:",
        "   task payments:status",
        "",
        "🎉 That's it! Your Stripe integration is ready.",
        "",
        "💡 For production: use 'task payments:setup-prod'"
    ]
    
    for step in steps:
        print(f"   {step}")
    
    print()

if __name__ == "__main__":
    main()
