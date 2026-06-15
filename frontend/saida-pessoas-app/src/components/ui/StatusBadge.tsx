import React from 'react';
import type { StatusSolicitacao } from '../../types';

/** Badge (pill) padronizada de status de solicitação, reutilizável em qualquer tela. */
const CONFIG: Record<StatusSolicitacao, { label: string; cls: string; style?: React.CSSProperties }> = {
  AguardandoGestor: { label: 'Ag. Gestor',     cls: 'text-bg-warning' },
  AguardandoRH:     { label: 'Ag. RH',         cls: 'text-bg-primary' },
  LiberadoPortaria: { label: 'Lib. Portaria',  cls: 'text-bg-success' },
  EmTransito:       { label: 'Em Trânsito',    cls: '', style: { backgroundColor: '#fd7e14', color: '#fff' } },
  Concluido:        { label: 'Concluído',      cls: 'text-bg-secondary' },
  Reprovado:        { label: 'Reprovado',      cls: 'text-bg-danger' },
};

const StatusBadge: React.FC<{ status: StatusSolicitacao }> = ({ status }) => {
  const c = CONFIG[status] ?? { label: status, cls: 'text-bg-secondary' };
  return (
    <span
      className={`badge rounded-pill ${c.cls}`}
      style={{ fontWeight: 600, fontSize: '0.72rem', padding: '0.4em 0.75em', letterSpacing: '0.02em', ...c.style }}
    >
      {c.label}
    </span>
  );
};

export default StatusBadge;
