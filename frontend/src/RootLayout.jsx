import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar';

export default function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const currentPath = location.pathname;

      // Protected routes that require authentication
      const protectedRoutes = ['/', '/dashboard', '/advanced-dashboard', '/settings'];
      const isProtectedRoute = protectedRoutes.includes(currentPath);

      // If not authenticated and trying to access protected route, redirect to auth
      if (!isAuthenticated && isProtectedRoute) {
        navigate({ to: '/auth', replace: true });
      }
      // If authenticated and on auth page, redirect to home
      else if (isAuthenticated && currentPath === '/auth') {
        navigate({ to: '/', replace: true });
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [location.pathname, navigate, isAuthenticated]);

  useEffect(() => {
    const savedSettings = localStorage.getItem("userSettings");
    if (!savedSettings) return;

    try {
      const settings = JSON.parse(savedSettings);
      document.body.classList.toggle("theme-dark", Boolean(settings.darkMode));
    } catch {
      document.body.classList.remove("theme-dark");
    }
  }, []);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <Outlet />
    </div>
  );
}
