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
import AdminPage             from './pages/AdminPage';
import AdminUsuarioDetalhePage from './pages/AdminUsuarioDetalhePage';

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

// Enquanto uma sessão salva localmente está sendo revalidada contra o backend,
// não renderiza nenhuma rota — evita mostrar telas autenticadas antes de confirmar o token.
const FullPageLoader: React.FC = () => (
  <div className="d-flex align-items-center justify-content-center vh-100 text-muted small">
    Carregando…
  </div>
);

const AppRoutes: React.FC = () => {
  const { checking } = useAuth();
  if (checking) return <FullPageLoader />;

  return (
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
        <Route path="/admin"                   element={<AdminRoute element={<AdminPage />} />} />
        <Route path="/admin/usuarios/:id"      element={<AdminRoute element={<AdminUsuarioDetalhePage />} />} />
        {/* Legacy redirects */}
        <Route path="/dashboard"               element={<Navigate to="/inicio" replace />} />
        <Route path="/nova-solicitacao"        element={<Navigate to="/solicitacoes/pessoas" replace state={{ abrirNovaSolicitacao: true }} />} />
      </Route>

      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
