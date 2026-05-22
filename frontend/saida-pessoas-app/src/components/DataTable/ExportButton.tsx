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
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-800 transition-colors"
      >
        Exportar ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 min-w-[160px]">
            <button
              onClick={exportCSV}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100"
            >
              CSV — Power BI / Excel
            </button>
            <button
              onClick={exportJSON}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
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
