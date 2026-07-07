import React from 'react';

/* ── Ícones de status de usuário (traçado fornecido) ──────────── */
const CircleDashedIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.1 2.182a10 10 0 0 1 3.8 0" />
    <path d="M13.9 21.818a10 10 0 0 1-3.8 0" />
    <path d="M17.609 3.721a10 10 0 0 1 2.69 2.7" />
    <path d="M2.182 13.9a10 10 0 0 1 0-3.8" />
    <path d="M20.279 17.609a10 10 0 0 1-2.7 2.69" />
    <path d="M21.818 10.1a10 10 0 0 1 0 3.8" />
    <path d="M3.721 6.391a10 10 0 0 1 2.7-2.69" />
    <path d="M6.391 20.279a10 10 0 0 1-2.69-2.7" />
  </svg>
);
const CircleDotIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);
const UserLockIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 16v-2a2 2 0 0 0-4 0v2" />
    <path d="M9.5 15H7a4 4 0 0 0-4 4v2" />
    <circle cx="10" cy="7" r="4" />
    <rect x="13" y="16" width="8" height="5" rx=".899" />
  </svg>
);

const STATUS_INFO: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  Pendente: { icon: <CircleDashedIcon />, color: '#92400E', bg: '#FEF3C7', label: 'Pendente de aprovação' },
  Ativo:    { icon: <CircleDotIcon />,    color: '#166534', bg: '#DCFCE7', label: 'Ativo' },
  Inativo:  { icon: <UserLockIcon />,     color: '#991B1B', bg: '#FEE2E2', label: 'Bloqueado' },
};

/** Indicador visual (ícone + rótulo) do status de uma conta de usuário. */
const UsuarioStatusPill: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS_INFO[status] ?? { icon: <CircleDashedIcon />, color: '#374151', bg: '#F3F4F6', label: status };
  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {s.icon}
      {s.label}
    </span>
  );
};

export default UsuarioStatusPill;
