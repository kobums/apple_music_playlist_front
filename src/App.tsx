import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './auth/AuthContext';
import MusicKitAuth from './screens/MusicKitAuth';
import PlaylistForm from './screens/PlaylistForm';
import type { ReactElement } from 'react';

/**
 * `/playlist` used to be reachable without any token, which meant the form
 * happily posted empty credentials to the API.
 */
function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthorized } = useAuth();
  return isAuthorized ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<MusicKitAuth />} />
          <Route
            path="/playlist"
            element={
              <RequireAuth>
                <PlaylistForm />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
