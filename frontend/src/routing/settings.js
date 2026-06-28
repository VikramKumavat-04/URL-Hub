import { createRoute } from '@tanstack/react-router';
import SettingsPage from '../pages/SettingsPage.jsx';

const createSettingsRoute = (rootRoute) => {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: SettingsPage,
  });
};

export default createSettingsRoute;
