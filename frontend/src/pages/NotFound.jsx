import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { AlertCircle } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-bold text-slate-100">404 - Resource Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md">
        The requested Kubernetes resource or page route does not exist in the current simulation cluster context.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
};

export default NotFound;
