
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType?: 'doctor' | 'patient' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, userType }) => {
  const { user, userType: currentUserType, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to login');
    } else if (!loading && user && userType && currentUserType !== userType) {
      console.log(`User type mismatch. Required: ${userType}, Current: ${currentUserType}`);
    }
  }, [loading, user, userType, currentUserType]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with return URL
    return <Navigate to={`/login/${userType || 'patient'}`} state={{ from: location }} replace />;
  }

  // Check if the user type matches
  if (userType && currentUserType && currentUserType !== userType) {
    // If user is trying to access a page they're not authorized for,
    // redirect them to their appropriate dashboard
    return <Navigate to={`/${currentUserType}/dashboard`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
