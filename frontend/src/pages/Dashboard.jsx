import React from 'react';
import { DollarSign, Receipt, Award, AlertTriangle } from 'lucide-react';
import { KPIS_DIA, PRODUCTOS_ESTRELLA } from '../data/mock';
import '../styles/dashboard.css';

const ICON_MAP = {
  ventas: DollarSign,
  facturas: Receipt,
  estrella: Award,
  alertas: AlertTriangle,
};

export default function Dashboard() {
  return (
    <section>
      <div className="kpi-grid">
        {KPIS_DIA.map((kpi) => {
          const IconComponent = ICON_MAP[kpi.id] || Award;
          return (
            <article key={kpi.id} className="kpi-card">
              <div>
                <div className="kpi-label">{kpi.label}</div>
                <div className="kpi-value">{kpi.value}</div>
                <div className="kpi-trend">{kpi.trend}</div>
              </div>
              <div className="kpi-icon">
                <IconComponent size={22} />
              </div>
            </article>
          );
        })}
      </div>

      <div className="section-header">
        <h3>Vitrina de Productos Estrella</h3>
      </div>

      <div className="showcase-grid">
        {PRODUCTOS_ESTRELLA.map((prod) => (
          <article key={prod.id} className="product-card">
            <div>
              <span className="product-badge">{prod.categoria}</span>
              <h4 style={{ marginTop: '0.6rem' }}>{prod.nombre}</h4>
              <p className="product-desc" style={{ marginTop: '0.35rem' }}>
                {prod.descripcion}
              </p>
            </div>

            <div className="product-footer">
              <span className="product-price">${prod.precio.toFixed(2)}</span>
              <span className="product-sales">{prod.vendidosHoy} vendidos hoy</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
