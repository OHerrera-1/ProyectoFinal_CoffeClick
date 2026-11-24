import React, { useState } from 'react';
import { INSUMOS_INICIALES } from '../data/mock';
import '../styles/inventario.css';

export default function Inventario() {
  const [insumos, setInsumos] = useState(INSUMOS_INICIALES);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todas');

  const categorias = ['Todas', ...new Set(INSUMOS_INICIALES.map((i) => i.categoria))];

  const actualizarStock = (id, delta) => {
    setInsumos((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, stock_actual: Math.max(0, item.stock_actual + delta) }
          : item
      )
    );
  };

  const filtrados = insumos.filter((item) => {
    const coincideTexto = item.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCat = categoria === 'Todas' || item.categoria === categoria;
    return coincideTexto && coincideCat;
  });

  return (
    <section>
      <div className="section-header">
        <h3>Control de Inventario e Insumos</h3>
      </div>

      <div className="inventory-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar insumo (ej. Pacamara, Leche, Vasos)..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          className="filter-select"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="table-card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Categor\u00eda</th>
              <th>Stock Actual</th>
              <th>Stock M\u00ednimo</th>
              <th>Estado</th>
              <th>Ajuste R\u00e1pido</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((item) => {
              const bajoStock = item.stock_actual <= item.stock_minimo;
              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.nombre}</strong>
                  </td>
                  <td>{item.categoria}</td>
                  <td>
                    {item.stock_actual} {item.unidad}
                  </td>
                  <td>
                    {item.stock_minimo} {item.unidad}
                  </td>
                  <td>
                    <span className={`status-pill ${bajoStock ? 'status-low' : 'status-ok'}`}>
                      {bajoStock ? 'Stock Bajo' : '\u00d3ptimo'}
                    </span>
                  </td>
                  <td>
                    <div className="stock-actions">
                      <button
                        type="button"
                        className="btn-step"
                        onClick={() => actualizarStock(item.id, -1)}
                        title="Descontar 1"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        className="btn-step"
                        onClick={() => actualizarStock(item.id, 1)}
                        title="Agregar 1"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
