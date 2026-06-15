import React, { useEffect, useRef, useState } from 'react';

/**
 * Campo único de PERÍODO (intervalo de datas), sem dependências externas.
 * Mostra "DD/MM/AAAA até DD/MM/AAAA" e abre um popover com os seletores De/Até.
 * Internamente continua trabalhando com dataInicio/dataFim ('YYYY-MM-DD').
 */
interface Props {
  dataInicio: string;
  dataFim: string;
  onChange: (dataInicio: string, dataFim: string) => void;
}

const fmt = (d: string) => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const DateRangePicker: React.FC<Props> = ({ dataInicio, dataFim, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const label =
    dataInicio && dataFim ? `${fmt(dataInicio)} até ${fmt(dataFim)}`
      : dataInicio ? `A partir de ${fmt(dataInicio)}`
      : dataFim ? `Até ${fmt(dataFim)}`
      : '';

  return (
    <div className="position-relative" ref={ref}>
      <div
        className="form-control form-control-sm d-flex align-items-center justify-content-between"
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}
      >
        <span className={label ? 'text-truncate' : 'text-muted text-truncate'}>
          {label || 'Selecione o período'}
        </span>
        <span className="text-muted ms-2 d-flex"><CalendarIcon /></span>
      </div>

      {open && (
        <div
          className="card shadow border-0 position-absolute mt-1 p-3"
          style={{ zIndex: 1060, minWidth: 240 }}
        >
          <label className="form-label form-label-sm mb-1 text-uppercase fw-semibold text-muted" style={{ fontSize: '0.68rem' }}>De</label>
          <input
            type="date"
            className="form-control form-control-sm mb-2"
            value={dataInicio}
            max={dataFim || undefined}
            onChange={(e) => onChange(e.target.value, dataFim)}
          />
          <label className="form-label form-label-sm mb-1 text-uppercase fw-semibold text-muted" style={{ fontSize: '0.68rem' }}>Até</label>
          <input
            type="date"
            className="form-control form-control-sm mb-3"
            value={dataFim}
            min={dataInicio || undefined}
            onChange={(e) => onChange(dataInicio, e.target.value)}
          />
          <div className="d-flex justify-content-between align-items-center">
            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none p-0 text-muted"
              onClick={() => onChange('', '')}
            >
              Limpar período
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
