import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { CallProvider } from './context/CallContext.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ChatPage } from './pages/ChatPage.jsx';

function RequireAuth({ children }) {
  const { status } = useAuth();
  if (status === 'loading') return <div className="center-loading">Loading…</div>;
  if (status !== 'authenticated') return <Navigate to="/login" replace />;
  return children;
}

function RequireGuest({ children }) {
  const { status } = useAuth();
  if (status === 'loading') return <div className="center-loading">Loading…</div>;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RequireGuest>
            <LoginPage />
          </RequireGuest>
        }
      />
      <Route
        path="/register"
        element={
          <RequireGuest>
            <RegisterPage />
          </RequireGuest>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <ChatPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
            <AppRoutes />
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
