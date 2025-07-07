import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute render:', { user: !!user, profile: !!profile, loading, profileLoading, pathname: location.pathname });

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If user exists but no profile, redirect to create profile
  // But allow access to the create-profile page itself
  if (!profile && location.pathname !== '/create-profile') {
    return <Navigate to="/create-profile" />;
  }

  // If user has a profile but is trying to access create-profile, redirect to home
  if (profile && location.pathname === '/create-profile') {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;