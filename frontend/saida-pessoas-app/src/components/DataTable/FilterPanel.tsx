import React from 'react';

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
  onClear: () => void;
  showNome?: boolean;
  showSetor?: boolean;
  showDestino?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters, onChange, onClear,
  showNome = false, showSetor = false, showDestino = false,
}) => (
  <div className="card border-0 shadow-sm mb-3">
    <div className="card-body py-3">
      <div className="row g-2 align-items-end">

        {showNome && (
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label form-label-sm mb-1">Nome</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={filters.nome ?? ''}
              onChange={e => onChange('nome', e.target.value)}
              placeholder="Buscar nome…"
            />
          </div>
        )}

        <div className="col-6 col-md-4 col-lg-2">
          <label className="form-label form-label-sm mb-1">Status</label>
          <select
            className="form-select form-select-sm"
            value={filters.status}
            onChange={e => onChange('status', e.target.value)}
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

        {showSetor && (
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label form-label-sm mb-1">Setor</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={filters.setor ?? ''}
              onChange={e => onChange('setor', e.target.value)}
              placeholder="Filtrar setor…"
            />
          </div>
        )}

        <div className="col-6 col-md-4 col-lg-2">
          <label className="form-label form-label-sm mb-1">Tipo de Saída</label>
          <select
            className="form-select form-select-sm"
            value={filters.tipoSaida}
            onChange={e => onChange('tipoSaida', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="Particular">Particular</option>
            <option value="AServico">À Serviço</option>
          </select>
        </div>

        {showDestino && (
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label form-label-sm mb-1">Destino</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={filters.destino ?? ''}
              onChange={e => onChange('destino', e.target.value)}
              placeholder="Local ou unidade…"
            />
          </div>
        )}

        <div className="col-6 col-md-4 col-lg-2">
          <label className="form-label form-label-sm mb-1">Data Início</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={filters.dataInicio}
            onChange={e => onChange('dataInicio', e.target.value)}
          />
        </div>

        <div className="col-6 col-md-4 col-lg-2">
          <label className="form-label form-label-sm mb-1">Data Fim</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={filters.dataFim}
            onChange={e => onChange('dataFim', e.target.value)}
          />
        </div>

        <div className="col-auto">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClear}>
            Limpar
          </button>
        </div>

      </div>
    </div>
  </div>
);

export default FilterPanel;