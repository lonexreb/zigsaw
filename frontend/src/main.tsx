import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51RGx5nQoFZzVaNKXfx2mlIN8rma3qeKilAFyjPTxpgQtIbSCaF9wXkMSLcGMAQxsAnaj8qoV9hfwagy24RS0cyaw00RZ2QJX0z');

createRoot(document.getElementById("root")!).render(
  <Elements stripe={stripePromise}>
    <App />
  </Elements>
);
