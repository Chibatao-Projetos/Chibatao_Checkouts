import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebarCollapsed', String(next));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar fixa à esquerda */}
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />

      {/* Coluna direita: Topbar + conteúdo */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onToggle={handleToggle} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
