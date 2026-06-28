import { createRoute } from '@tanstack/react-router';
import AuthPage from '../pages/AuthPage.jsx';

const createAuthRoute = (rootRoute) => {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/auth',
    component: AuthPage,
  });
};

export default createAuthRoute;