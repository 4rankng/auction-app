import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { ROUTES } from '../models/constants';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        <h2 className="text-2xl font-medium text-gray-900 mt-4 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link to={ROUTES.HOME}>
          <Button variant="primary">Go to Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
