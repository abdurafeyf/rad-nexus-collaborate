
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType?: 'doctor' | 'patient' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, userType }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to login');
    }
  }, [loading, user]);

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

  // Check if the user type matches (based on user metadata)
  if (userType && user.user_metadata?.user_type && user.user_metadata.user_type !== userType) {
    // If user is trying to access a page they're not authorized for,
    // redirect them to their appropriate dashboard
    const correctUserType = user.user_metadata.user_type;
    return <Navigate to={`/${correctUserType}/dashboard`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
