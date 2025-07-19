import React from 'react';
import { Link } from 'react-router-dom';

const CancelPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Cancelled</h1>
      <p className="text-lg mb-6">Your subscription process was cancelled. You can try again.</p>
      <Link to="/subscription" className="text-blue-500 hover:underline">Back to Subscription Plans</Link>
    </div>
  );
};

export default CancelPage;
