import React, { useState } from 'react';
import type { SolicitacaoResponse } from '../../types';

interface ExportButtonProps {
  data: SolicitacaoResponse[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ data }) => {
  const [open, setOpen] = useState(false);

  const download = (content: string, filename: string, mime: string) => {
    const bom = mime === 'text/csv' ? '﻿' : '';
    const blob = new Blob([bom + content], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportCSV = () => {
    const headers = [
      'ID', 'Nome', 'Setor', 'Destino', 'Tipo', 'Retorno',
      'Data Solicitação', 'Status', 'Vigilante', 'Hora Saída', 'Hora Retorno',
    ];
    const rows = data.map((s) => [
      s.id,
      `"${s.nome}"`,
      `"${s.setor}"`,
      `"${s.destino}"`,
      s.tipoSaida === 'AServico' ? 'À Serviço' : 'Particular',
      s.previsaoRetorno ? 'Sim' : 'Não',
      new Date(s.dataSolicitacao).toLocaleString('pt-BR'),
      s.status,
      `"${s.nomeVigilante ?? ''}"`,
      s.horaSaida ? new Date(s.horaSaida).toLocaleString('pt-BR') : '',
      s.horaRetorno ? new Date(s.horaRetorno).toLocaleString('pt-BR') : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const date = new Date().toISOString().split('T')[0];
    download(csv, `solicitacoes_${date}.csv`, 'text/csv');
  };

  const exportJSON = () => {
    const date = new Date().toISOString().split('T')[0];
    download(JSON.stringify(data, null, 2), `solicitacoes_${date}.json`, 'application/json');
  };

  return (
    <div className="position-relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5M12 15V3" />
        </svg>
        Exportar
      </button>
      {open && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1040 }} onClick={() => setOpen(false)} />
          <div
            className="position-absolute end-0 mt-1 bg-white border rounded shadow-sm"
            style={{ zIndex: 1050, minWidth: 190 }}
          >
            <button
              type="button"
              onClick={exportCSV}
              className="btn btn-link text-decoration-none text-dark w-100 text-start px-3 py-2 border-bottom small"
            >
              CSV — Power BI / Excel
            </button>
            <button
              type="button"
              onClick={exportJSON}
              className="btn btn-link text-decoration-none text-dark w-100 text-start px-3 py-2 small"
            >
              JSON — API / BI
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
