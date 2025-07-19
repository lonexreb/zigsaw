import React from 'react';
import { Link } from 'react-router-dom';

const SuccessPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
      <p className="text-lg mb-6">Your subscription has been activated.</p>
      <Link to="/workflow" className="text-blue-500 hover:underline">Go to Dashboard</Link>
    </div>
  );
};

export default SuccessPage;
