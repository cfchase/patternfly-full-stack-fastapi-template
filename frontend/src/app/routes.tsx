import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import { NotFound } from '@app/NotFound/NotFound';
import { ProtectedRoute } from '@components/ProtectedRoute';
import { flattenedRoutes } from './routeConfig';

const AppRoutes = (): React.ReactElement => (
  <Routes>
    {flattenedRoutes.map(({ path, element }, idx) => {
      // Login route doesn't need protection
      if (path === '/login') {
        return <Route path={path} element={element} key={idx} />;
      }
      // All other routes are protected
      return <Route path={path} element={<ProtectedRoute>{element}</ProtectedRoute>} key={idx} />;
    })}
    <Route element={<NotFound />} />
  </Routes>
);

export { AppRoutes };
