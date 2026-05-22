import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { PerfilUsuario } from '../types';

/* ── SVG helper ─────────────────────────────────────────────── */
type Paths = string | string[];
const Svg = ({ d, size = 18 }: { d: Paths; size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round"
    width={size} height={size} style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const IC = {
  home:      ['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', 'M9 22V12h6v10'],
  list:      ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2',
               'M9 5a2 2 0 002 2h2a2 2 0 002-2', 'M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  person:    ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 11a4 4 0 100-8 4 4 0 000 8z'],
  box:       ['M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z'],
  lock:      ['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z',
               'M17 11V7a5 5 0 00-10 0v4'],
  briefcase: ['M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z',
               'M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2'],
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2',
               'M9 11a4 4 0 100-8 4 4 0 000 8z',
               'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
  building:  ['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'],
  cog:       ['M12 15a3 3 0 100-6 3 3 0 000 6z'],
  shield:    ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  logout:    ['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  chevD:     ['M6 9l6 6 6-6'],
  chevR:     ['M9 18l6-6-6-6'],
  bars:      ['M4 6h16', 'M4 12h16', 'M4 18h16'],
};

/* ── Collapse via CSS max-height (sem react-bootstrap) ──────── */
const CssCollapse: React.FC<{ isOpen: boolean; children: React.ReactNode }> = ({ isOpen, children }) => (
  <div style={{
    maxHeight: isOpen ? '300px' : '0',
    overflow: 'hidden',
    transition: 'max-height 0.2s ease',
  }}>
    {children}
  </div>
);

interface SidebarProps { collapsed: boolean; onToggle: () => void; }

const BG = 'rgb(15, 68, 106)';

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const perfil = user?.perfil as PerfilUsuario;

  const [open, setOpen] = useState({ solicitacoes: true, acessos: true, usuario: true });
  const toggle = (key: keyof typeof open) => setOpen(p => ({ ...p, [key]: !p[key] }));

  const canSee = (roles?: PerfilUsuario[]) => !roles || roles.includes(perfil);

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? ' active' : ''}`;
  const subCls = ({ isActive }: { isActive: boolean }) =>
    `nav-link py-1${isActive ? ' active' : ''}`;

  return (
    <aside
      className="sidebar d-flex flex-column"
      style={{
        backgroundColor: BG,
        width: collapsed ? '64px' : '240px',
        minWidth: collapsed ? '64px' : '240px',
        height: '100vh',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* ── Logo ── */}
      {!collapsed && (
        <div className="d-flex align-items-center justify-content-center py-3 border-bottom sidebar-border">
          <img
            src="/logo.png"
            alt="Chibatão"
            style={{ width: 180, height: 188, objectFit: 'contain' }}
          />
        </div>
      )}


      {/* ── Navegação ── */}
      <nav className="flex-grow-1 overflow-auto py-2 px-2 nav flex-column"
        style={{ gap: '2px' }}>

        <NavLink to="/inicio" className={navCls} title="Início">
          <Svg d={IC.home} />
          {!collapsed && <span className="ms-2">Início</span>}
        </NavLink>

        {/* Solicitações */}
        {canSee(['Solicitante', 'Gestor', 'RH', 'Admin']) && (
          <>
            <button className="sidebar-parent-btn" title="Solicitações"
              onClick={() => collapsed ? onToggle() : toggle('solicitacoes')}>
              <Svg d={IC.list} />
              {!collapsed && (
                <>
                  <span className="flex-grow-1 ms-2">Solicitações</span>
                  <Svg d={open.solicitacoes ? IC.chevD : IC.chevR} size={13} />
                </>
              )}
            </button>
            <CssCollapse isOpen={!collapsed && open.solicitacoes}>
              <div className="sidebar-submenu nav flex-column" style={{ gap: '2px' }}>
                <NavLink to="/solicitacoes/pessoas" className={subCls}>
                  <Svg d={IC.person} size={15} />
                  <span className="ms-2">Pessoas</span>
                </NavLink>
                <NavLink to="/solicitacoes/material" className={subCls}>
                  <Svg d={IC.box} size={15} />
                  <span className="ms-2">Material</span>
                </NavLink>
              </div>
            </CssCollapse>
          </>
        )}

        {/* Aprovações */}
        {canSee(['Gestor', 'RH', 'Portaria', 'Admin']) && (
          <>
            <button className="sidebar-parent-btn" title="Aprovações"
              onClick={() => collapsed ? onToggle() : toggle('acessos')}>
              <Svg d={IC.lock} />
              {!collapsed && (
                <>
                  <span className="flex-grow-1 ms-2">Aprovações</span>
                  <Svg d={open.acessos ? IC.chevD : IC.chevR} size={13} />
                </>
              )}
            </button>
            <CssCollapse isOpen={!collapsed && open.acessos}>
              <div className="sidebar-submenu nav flex-column" style={{ gap: '2px' }}>
                {canSee(['Gestor', 'Admin']) && (
                  <NavLink to="/acessos/gestor" className={subCls}>
                    <Svg d={IC.briefcase} size={15} />
                    <span className="ms-2">Gestor</span>
                  </NavLink>
                )}
                {canSee(['RH', 'Admin']) && (
                  <NavLink to="/acessos/rh" className={subCls}>
                    <Svg d={IC.users} size={15} />
                    <span className="ms-2">RH</span>
                  </NavLink>
                )}
                {canSee(['Portaria', 'Admin']) && (
                  <NavLink to="/acessos/portaria" className={subCls}>
                    <Svg d={IC.building} size={15} />
                    <span className="ms-2">Portaria</span>
                  </NavLink>
                )}
              </div>
            </CssCollapse>
          </>
        )}

        {/* Usuário */}
        <button className="sidebar-parent-btn" title="Usuário"
          onClick={() => collapsed ? onToggle() : toggle('usuario')}>
          <Svg d={IC.person} />
          {!collapsed && (
            <>
              <span className="flex-grow-1 ms-2">Usuário</span>
              <Svg d={open.usuario ? IC.chevD : IC.chevR} size={13} />
            </>
          )}
        </button>
        <CssCollapse isOpen={!collapsed && open.usuario}>
          <div className="sidebar-submenu nav flex-column">
            <NavLink to="/usuario/perfil" className={subCls}>
              <Svg d={IC.cog} size={15} />
              <span className="ms-2">Perfil</span>
            </NavLink>
          </div>
        </CssCollapse>

        {/* Administração */}
        {perfil === 'Admin' && (
          <NavLink to="/admin" className={navCls} title="Administração">
            <Svg d={IC.shield} />
            {!collapsed && <span className="ms-2">Administração</span>}
          </NavLink>
        )}
      </nav>

      {/* ── Rodapé ── */}
      <div className="border-top sidebar-border p-3">
        {!collapsed && (
          <div className="mb-2" style={{ overflow: 'hidden' }}>
            <div className="fw-medium small text-truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {user?.nome}
            </div>
            <div className="small text-truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {user?.perfil}
            </div>
          </div>
        )}
        <button className="sidebar-parent-btn" title="Sair"
          onClick={() => { logout(); navigate('/login'); }}>
          <Svg d={IC.logout} />
          {!collapsed && <span className="ms-2">Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;