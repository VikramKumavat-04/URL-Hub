import { createRoute } from '@tanstack/react-router';
import DashboardPage from '../pages/DashboardPage.jsx';

const createDashboardRoute = (rootRoute) => {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: DashboardPage,
  });
};

export default createDashboardRoute;