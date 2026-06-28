import { createRoute } from '@tanstack/react-router';
import AdvancedDashboard from '../pages/AdvancedDashboard.jsx';

const createAdvancedDashboardRoute = (rootRoute) => {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/advanced-dashboard',
    component: AdvancedDashboard,
  });
};

export default createAdvancedDashboardRoute;
