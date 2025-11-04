// Example React component using the payment hooks
import React from 'react';
import { useProducts, useCheckoutWithProduct } from '@/hooks/api/usePayments';

const PricingPage = () => {
  const { data: products, isLoading } = useProducts();
  const { checkoutWithProduct, isLoading: checkoutLoading } = useCheckoutWithProduct();

  const handlePurchase = (productId: string) => {
    checkoutWithProduct(productId);
  };

  if (isLoading) return <div>Loading products...</div>;

  return (
    <div>
      <h1>Choose Your Plan</h1>
      {products?.map(product => (
        <div key={product.id} style={{ border: '1px solid #ccc', padding: '20px', margin: '10px' }}>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <p><strong>${product.price_cents / 100}</strong> {product.type === 'subscription' ? '/month' : 'one-time'}</p>
          <ul>
            {product.features.map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
          <button 
            onClick={() => handlePurchase(product.id)}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? 'Processing...' : 'Purchase'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default PricingPage;
