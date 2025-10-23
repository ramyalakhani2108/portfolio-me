import { useState, useEffect } from "react";
import { useAuth } from "../../../supabase/auth";
import AdminLogin from "../admin/AdminLogin";
import AdminDashboard from "../admin/AdminDashboard";
import { LoadingScreen } from "../ui/loading-spinner";

export default function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check local storage for admin authentication first
    const adminAuth = localStorage.getItem("adminAuthenticated");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
    } else if (user && user.email === "admin@portfolio.dev") {
      // Also check if user is authenticated via Supabase with admin email
      setIsAuthenticated(true);
      localStorage.setItem("adminAuthenticated", "true");
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    // Clear all admin-related session data
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("auth_token");
    
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
    
    // Ensure we're logged out
    setIsAuthenticated(false);
  };

  if (loading) {
    return <LoadingScreen text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
