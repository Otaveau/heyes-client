import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navigation from './components/common/Navigation';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Spinner from './components/ui/spinner';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Imports lazy pour le code splitting
const CalendarView = React.lazy(() =>
  import('./components/calendar/CalendarView').then(m => ({ default: m.CalendarView }))
);
const Login = React.lazy(() => import('./components/auth/Login'));
const Register = React.lazy(() => import('./components/auth/Register'));
const OwnerManagement = React.lazy(() => import('./components/owner/OwnerManagement'));
const TeamManagement = React.lazy(() => import('./components/team/TeamManagement'));

const PrivateWrapper = ({ children }) => {
  const { state } = useAuth();
  return state.loading ? <Spinner /> : (state.isAuthenticated ? children : <Navigate to="/login" replace />);
};

const PublicOnlyWrapper = ({ children }) => {
  const { state } = useAuth();
  return state.loading ? <Spinner /> : (state.isAuthenticated ? <Navigate to="/calendar" replace /> : children);
};


const RootRedirect = () => {
  const { state } = useAuth();
  return state.loading ? <Spinner /> : (
    state.isAuthenticated ? <Navigate to="/calendar" replace /> : <Navigate to="/login" replace />
  );
};

const AppContent = () => {
  const { state } = useAuth();

  if (state.loading) {
    return <Spinner />;
  }

  return (
    <BrowserRouter>
      {state.isAuthenticated && <Navigation />}
      <div className="flex justify-center mx-auto px-4 pt-5 transition-colors duration-200 bg-white dark:bg-gray-900 min-h-screen">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<PublicOnlyWrapper><Login /></PublicOnlyWrapper>} />
            <Route path="/register" element={<PublicOnlyWrapper><Register /></PublicOnlyWrapper>} />
            <Route path="/calendar" element={<PrivateWrapper><CalendarView /></PrivateWrapper>} />
            <Route path="/owners" element={<PrivateWrapper><OwnerManagement /></PrivateWrapper>} />
            <Route path="/teams" element={<PrivateWrapper><TeamManagement /></PrivateWrapper>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
   );
};

const App = () => (
  <AuthProvider>
    <ThemeProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light" // Sera remplacé par "dark" automatiquement en mode sombre
      />
      <AppContent />
    </ThemeProvider>
  </AuthProvider>
);

export default App;