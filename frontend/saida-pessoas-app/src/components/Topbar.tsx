import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
interface PageConfig { title: string; subtitle?: string }
interface TopbarProps { onToggle: () => void; }

// Ícone hamburguer inline
const BarsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();

const Topbar: React.FC<TopbarProps> = ({ onToggle }) => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const firstName = user?.nome?.split(' ')[0] ?? '';
  const setor     = user?.setor ?? '';

  const config = ((): PageConfig => {
    const map: Record<string, PageConfig> = {
      '/inicio':                { title: 'Início',                    subtitle: `${greeting()}, ${firstName}! Aqui está o resumo do dia.` },
      '/solicitacoes/pessoas':  { title: 'Minhas Solicitações',       subtitle: 'Histórico de todas as suas solicitações de saída.' },
      '/solicitacoes/material': { title: 'Solicitações — Material',   subtitle: 'Módulo em desenvolvimento.' },
      '/acessos/gestor':        { title: 'Aprovações — Gestor',       subtitle: `Aprovações pendentes do setor ${setor}.` },
      '/acessos/rh':            { title: 'Aprovações — RH',           subtitle: 'Validações e aprovações de Recursos Humanos.' },
      '/acessos/portaria':      { title: 'Controle de Portaria',      subtitle: 'Registro de saídas e retornos em tempo real.' },
      '/usuario/perfil':        { title: 'Meu Perfil',                subtitle: 'Informações cadastrais e segurança da conta.' },
      '/nova-solicitacao':      { title: 'Nova Solicitação de Saída', subtitle: 'Preencha os dados para solicitar autorização.' },
      '/admin':                 { title: 'Administração',             subtitle: 'Gerenciamento de usuários e perfis de acesso.' },
    };
    return map[pathname] ?? { title: 'Painel' };
  })();

  return (
    <nav
      className="navbar border-bottom"
      style={{ backgroundColor: 'rgb(15, 68, 106)', minHeight: '64px', flexShrink: 0 }}
    >
      <div className="container-fluid">
        {/* Esquerda: hamburguer + título agrupados */}
        <div className="d-flex align-items-center gap-2 flex-grow-1">
          <button
            onClick={onToggle}
            className="btn border-0 p-1"
            style={{ color: 'rgba(255,255,255,0.85)', flexShrink: 0 }}
            title="Expandir/Recolher menu"
          >
            <BarsIcon />
          </button>

          <div className="d-flex flex-column justify-content-center">
            <span className="fw-bold text-white" style={{ fontSize: '1.4rem', lineHeight: 1.2 }}>
              {config.title}
            </span>
            {config.subtitle && (
              <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>
                {config.subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Usuário */}
        <div className="d-flex align-items-center gap-3">
          <span
            className="d-none d-sm-block text-white"
            style={{ fontSize: '0.875rem', fontWeight: 500 }}
          >
            {user?.nome}
          </span>
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
            style={{
              width: 36, height: 36,
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              fontSize: '0.875rem',
              userSelect: 'none',
              flexShrink: 0,
            }}
            title={user?.nome}
          >
            {initials(user?.nome ?? 'U')}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Topbar;