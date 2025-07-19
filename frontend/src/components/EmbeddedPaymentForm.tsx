import React, { useState } from 'react';
import {
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/apiService';

interface EmbeddedPaymentFormProps {
  priceId: string;
  planName: string;
  price: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EmbeddedPaymentForm: React.FC<EmbeddedPaymentFormProps> = ({
  priceId,
  planName,
  price,
  onSuccess,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !currentUser) {
      setError('Payment system not ready or user not authenticated');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create PaymentIntent on backend
      const idToken = await currentUser.getIdToken(true);
      const response = await apiService.post('/api/create-payment-intent', {
        price_id: priceId,
        user_id: currentUser.uid,
      }, idToken);

      const { client_secret } = response.data;

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: currentUser.email,
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        // Manually upgrade user since webhooks aren't configured yet
        try {
          const upgradeResponse = await apiService.post('/api/user/upgrade', {}, idToken);
          console.log('User upgraded:', upgradeResponse.data);
        } catch (upgradeError) {
          console.error('Failed to upgrade user:', upgradeError);
          // Still call onSuccess even if upgrade fails - payment succeeded
        }
        onSuccess?.();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Subscribe to {planName}</CardTitle>
        <p className="text-sm text-gray-600">{price}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-md">
            <CardElement options={cardElementOptions} />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={!stripe || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Subscribe'}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmbeddedPaymentForm;