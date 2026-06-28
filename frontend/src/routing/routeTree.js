import { createRootRoute } from '@tanstack/react-router';
import RootLayout from '../RootLayout.jsx';

// Create root route first
export const rootRoute = createRootRoute({
  component: RootLayout,
});

// Import route factories after root route is created
import createHomeRoute from './homepage.js';
import createAuthRoute from './auth.route.js';
import createDashboardRoute from './dashboard.js';
import createAdvancedDashboardRoute from './advanced-dashboard.js';
import createSettingsRoute from './settings.js';

// Create routes using the factory functions
const homeRoute = createHomeRoute(rootRoute);
const authRoute = createAuthRoute(rootRoute);
const dashboardRoute = createDashboardRoute(rootRoute);
const advancedDashboardRoute = createAdvancedDashboardRoute(rootRoute);
const settingsRoute = createSettingsRoute(rootRoute);

export const routeTree = rootRoute.addChildren([
  authRoute,
  homeRoute,
  dashboardRoute,
  advancedDashboardRoute,
  settingsRoute,
]);

