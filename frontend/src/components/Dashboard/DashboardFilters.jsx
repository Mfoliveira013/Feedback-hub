import React from "react";

export default function DashboardFilters({
  filters,
  onChange,
  onClear,
  tipoOptions = [],
  titleOptions = [],
  setorOptions = [],
  userOptions = [],
}) {
  function handle(event) {
    const { name, value } = event.target;
    onChange(name, value);
  }

  return (
    <section className="fh-card">
      <div className="fh-card-body grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="block">
          <span className="fh-field-label">De:</span>
          <input
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handle}
            className="fh-input"
          />
        </label>

        <label className="block">
          <span className="fh-field-label">Ate:</span>
          <input
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handle}
            className="fh-input"
          />
        </label>

        <label className="block">
          <span className="fh-field-label">Tipo da Avaliacao:</span>
          <select name="tipo" value={filters.tipo} onChange={handle} className="fh-select">
            {tipoOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="fh-field-label">Titulo da Avaliacao:</span>
          <select name="titulo" value={filters.titulo} onChange={handle} className="fh-select">
            {titleOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="fh-field-label">Setor (Destinatario):</span>
          <select name="setor" value={filters.setor} onChange={handle} className="fh-select">
            {setorOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="fh-field-label">Usuario (Destinatario):</span>
          <select
            name="usuario"
            value={filters.usuario}
            onChange={handle}
            className="fh-select"
          >
            {userOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2 xl:col-span-6">
          <button type="button" onClick={onClear} className="fh-button-secondary px-6">
            Limpar
          </button>
        </div>
      </div>
    </section>
  );
}
