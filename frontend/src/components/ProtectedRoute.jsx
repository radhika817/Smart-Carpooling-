import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        <p className="text-slate-600 text-sm font-medium">Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <div className="p-4 rounded-full bg-red-50 border border-red-200 text-red-600 shadow-xs">
          <span className="text-2xl">🛑</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-600 max-w-md">
          This area is restricted to {allowedRoles.join(' or ')} accounts. Your account role is {user?.role}.
        </p>
      </div>
    );
  }

  return children;
};
