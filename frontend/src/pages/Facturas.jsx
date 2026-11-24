import React, { useEffect, useRef, useState } from 'react';
import '../styles/ventas.css';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  const peticion = useRef(null);
  const [anulando, setAnulando] = useState(false);
const bloqueoAnulacion = useRef(false);

  async function cargarFacturas() {
    peticion.current?.abort();

    const controlador = new AbortController();
    peticion.current = controlador;

    setCargando(true);
    setError('');
    setFacturaSeleccionada(null);

    try {
      const respuesta = await fetch(`${API_URL}/facturacion`, {
        signal: controlador.signal,
      });

      if (!respuesta.ok) {
        throw new Error(
          `No se pudieron consultar las facturas (${respuesta.status}).`
        );
      }

      const datos = await respuesta.json();

      if (!Array.isArray(datos)) {
        throw new Error('El servidor devolvió un formato inesperado.');
      }

      if (!controlador.signal.aborted) {
        setFacturas(datos);
      }
    } catch (err) {
      if (controlador.signal.aborted) return;

      setError(
        err instanceof TypeError
          ? 'No se pudo conectar con el backend. Verificá que esté encendido.'
          : err.message
      );
    } finally {
      if (!controlador.signal.aborted) {
        setCargando(false);
      }
    }
  }
async function anularFactura(factura) {
  if (bloqueoAnulacion.current || factura.estado === 'anulada') {
    return;
  }

  const confirmar = window.confirm(
    `¿Querés anular la factura ${factura.numero_correlativo}?`
  );

  if (!confirmar) return;

  bloqueoAnulacion.current = true;
  setAnulando(true);
  setError('');

  try {
    const respuesta = await fetch(
      `${API_URL}/facturacion/${factura.id}/anular`,
      { method: 'PATCH' }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || 'No se pudo anular la factura.');
    }

    await cargarFacturas();
  } catch (err) {
    setError(
      err instanceof TypeError
        ? 'No se pudo conectar con el backend.'
        : err.message
    );
  } finally {
    bloqueoAnulacion.current = false;
    setAnulando(false);
  }
}
  useEffect(() => {
    cargarFacturas();

    return () => peticion.current?.abort();
  }, []);

  return (
    <section className="ventas">
      <header className="ventas__encabezado">
        <h1>Historial de facturas</h1>
        <p>Consultá las facturas registradas en el sistema.</p>
      </header>

      <section className="ventas__panel">
        <button
          type="button"
          onClick={cargarFacturas}
          disabled={cargando}
        >
          {cargando ? 'Cargando...' : 'Actualizar facturas'}
        </button>

        {cargando ? (
          <p role="status">Consultando facturas...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : facturas.length === 0 ? (
          <p>No hay facturas registradas.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Correlativo</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {facturas.map((factura) => (
                  <tr key={factura.id}>
                    <td>{factura.numero_correlativo}</td>
                    <td>{factura.nombre_cliente}</td>
                    <td>{factura.tipo}</td>
                    <td>${Number(factura.total).toFixed(2)}</td>
                    <td>{factura.estado}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setFacturaSeleccionada(factura)}
                      >
                        Ver detalle
                      </button>
                      <button
  type="button"
  onClick={() => anularFactura(factura)}
  disabled={anulando || cargando || factura.estado === 'anulada'}
>
  {anulando ? 'Procesando...' : 'Anular factura'}
</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {facturaSeleccionada && (
        <section className="ventas__panel">
          <h2>Detalle de factura</h2>

          <p>
            Correlativo: {facturaSeleccionada.numero_correlativo}
          </p>
          <p>Cliente: {facturaSeleccionada.nombre_cliente}</p>
          <p>Tipo: {facturaSeleccionada.tipo}</p>
          <p>Estado: {facturaSeleccionada.estado}</p>

          <ul>
            {(facturaSeleccionada.detalles || []).map((detalle) => (
              <li key={detalle.id}>
                {detalle.nombre_producto} × {detalle.cantidad}
                {' — '}
                ${Number(detalle.subtotal_linea).toFixed(2)}
              </li>
            ))}
          </ul>

          <p>
            Subtotal: $
            {Number(facturaSeleccionada.subtotal).toFixed(2)}
          </p>
          <p>
            IVA: $
            {Number(facturaSeleccionada.iva_monto).toFixed(2)}
          </p>
          <p>
            <strong>
              Total: $
              {Number(facturaSeleccionada.total).toFixed(2)}
            </strong>
          </p>

          <button
            type="button"
            onClick={() => setFacturaSeleccionada(null)}
          >
            Cerrar detalle
          </button>
        </section>
      )}
    </section>
  );
}