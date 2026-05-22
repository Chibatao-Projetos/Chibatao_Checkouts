import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthLayout from './components/AuthLayout';

import LoginPage             from './pages/LoginPage';
import SignUpPage            from './pages/SignUpPage';
import InicioPage            from './pages/InicioPage';
import SolicitacoesPessoasPage from './pages/SolicitacoesPessoasPage';
import SolicitacoesMatPage   from './pages/SolicitacoesMatPage';
import AcessosGestorPage     from './pages/AcessosGestorPage';
import AcessosRHPage         from './pages/AcessosRHPage';
import AcessosPortariaPage   from './pages/AcessosPortariaPage';
import PerfilPage            from './pages/PerfilPage';
import SolicitacaoFormPage   from './pages/SolicitacaoFormPage';
import AdminPage             from './pages/AdminPage';

// Redirect authenticated users away from guest routes
const GuestRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/inicio" replace /> : element;
};

// Admin-only guard within authenticated context
const AdminRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user } = useAuth();
  return user?.perfil === 'Admin' ? element : <Navigate to="/inicio" replace />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Public */}
    <Route path="/login"  element={<GuestRoute element={<LoginPage />} />} />
    <Route path="/signup" element={<GuestRoute element={<SignUpPage />} />} />

    {/* Authenticated — wrapped in AuthLayout (sidebar) */}
    <Route element={<AuthLayout />}>
      <Route path="/inicio"                  element={<InicioPage />} />
      <Route path="/solicitacoes/pessoas"    element={<SolicitacoesPessoasPage />} />
      <Route path="/solicitacoes/material"   element={<SolicitacoesMatPage />} />
      <Route path="/acessos/gestor"          element={<AcessosGestorPage />} />
      <Route path="/acessos/rh"             element={<AcessosRHPage />} />
      <Route path="/acessos/portaria"        element={<AcessosPortariaPage />} />
      <Route path="/usuario/perfil"          element={<PerfilPage />} />
      <Route path="/nova-solicitacao"        element={<SolicitacaoFormPage />} />
      <Route path="/admin"                   element={<AdminRoute element={<AdminPage />} />} />
      {/* Legacy redirect */}
      <Route path="/dashboard"              element={<Navigate to="/inicio" replace />} />
    </Route>

    <Route path="*" element={<Navigate to="/inicio" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
