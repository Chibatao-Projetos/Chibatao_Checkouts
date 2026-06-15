import React from 'react';
import DateRangePicker from '../ui/DateRangePicker';

export interface Filters {
  nome?: string;
  status: string;
  setor?: string;
  tipoSaida: string;
  destino?: string;
  dataInicio: string;
  dataFim: string;
}

interface FilterPanelProps {
  filters: Filters;
  onChange: (key: string, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  loading?: boolean;
  showNome?: boolean;
  showSetor?: boolean;
  showDestino?: boolean;
}

const LBL = 'form-label text-uppercase fw-semibold text-muted mb-1';
const lblStyle: React.CSSProperties = { fontSize: '0.68rem', letterSpacing: '0.05em' };
const col = 'col-12 col-sm-6 col-md-4 col-lg-3';

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const EraserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4L13 5l6 6-9.3 9.3a1 1 0 0 1-1.4 0Z" />
    <path d="M22 21H7M5 11l6 6" />
  </svg>
);

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters, onChange, onApply, onClear, loading = false,
  showNome = false, showSetor = false, showDestino = false,
}) => (
  <div className="card border-0 shadow-sm rounded-3 mb-3">
    <div className="card-body p-3 p-md-4">
      <form onSubmit={(e) => { e.preventDefault(); onApply(); }}>
        <div className="row g-3 align-items-end">

          {showNome && (
            <div className={col}>
              <label className={LBL} style={lblStyle}>Nome</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={filters.nome ?? ''}
                onChange={(e) => onChange('nome', e.target.value)}
                placeholder="Buscar nome…"
              />
            </div>
          )}

          <div className={col}>
            <label className={LBL} style={lblStyle}>Período</label>
            <DateRangePicker
              dataInicio={filters.dataInicio}
              dataFim={filters.dataFim}
              onChange={(i, f) => { onChange('dataInicio', i); onChange('dataFim', f); }}
            />
          </div>

          <div className={col}>
            <label className={LBL} style={lblStyle}>Status</label>
            <select
              className="form-select form-select-sm"
              value={filters.status}
              onChange={(e) => onChange('status', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="AguardandoGestor">Ag. Gestor</option>
              <option value="AguardandoRH">Ag. RH</option>
              <option value="LiberadoPortaria">Lib. Portaria</option>
              <option value="EmTransito">Em Trânsito</option>
              <option value="Concluido">Concluído</option>
              <option value="Reprovado">Reprovado</option>
            </select>
          </div>

          <div className={col}>
            <label className={LBL} style={lblStyle}>Tipo de Saída</label>
            <select
              className="form-select form-select-sm"
              value={filters.tipoSaida}
              onChange={(e) => onChange('tipoSaida', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Particular">Particular</option>
              <option value="AServico">À Serviço</option>
            </select>
          </div>

          {showSetor && (
            <div className={col}>
              <label className={LBL} style={lblStyle}>Setor</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={filters.setor ?? ''}
                onChange={(e) => onChange('setor', e.target.value)}
                placeholder="Filtrar setor…"
              />
            </div>
          )}

          {showDestino && (
            <div className={col}>
              <label className={LBL} style={lblStyle}>Destino</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={filters.destino ?? ''}
                onChange={(e) => onChange('destino', e.target.value)}
                placeholder="Local ou unidade…"
              />
            </div>
          )}

          {/* Ações — alinhadas à direita */}
          <div className="col-12 d-flex justify-content-end gap-2 mt-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 px-3"
              onClick={onClear}
              disabled={loading}
            >
              <EraserIcon /> Limpar
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1 px-3"
              disabled={loading}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm" role="status" /> Filtrando…</>
                : <><SearchIcon /> Filtrar</>}
            </button>
          </div>

        </div>
      </form>
    </div>
  </div>
);

export default FilterPanel;
