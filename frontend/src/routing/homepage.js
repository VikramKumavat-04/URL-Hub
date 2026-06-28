import { createRoute } from '@tanstack/react-router';
import HomePage from '../pages/HomePage';

const createHomeRoute = (rootRoute) => {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: HomePage,
  });
};

export default createHomeRoute;