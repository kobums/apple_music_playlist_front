import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import MusicKitAuth from './MusicKitAuth';
import PlaylistForm from './PlaylistForm';
import "./assets/css/reset.css"

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<MusicKitAuth />} />
          <Route path="/playlist" element={<PlaylistForm />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;