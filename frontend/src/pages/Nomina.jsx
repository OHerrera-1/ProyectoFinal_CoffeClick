import React, { useEffect, useRef, useState } from 'react';
import '../styles/ventas.css';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

export default function Nomina() {
  const hoy = new Date();

  const [periodo, setPeriodo] = useState({
    anio: hoy.getFullYear(),
    mes: hoy.getMonth() + 1,
    quincena: hoy.getDate() <= 15 ? 1 : 2,
  });

const [procesando, setProcesando] = useState(false);
const [error, setError] = useState('');
const [planillaSeleccionada, setPlanillaSeleccionada] = useState(null);
const [boletaSeleccionada, setBoletaSeleccionada] = useState(null);
const bloqueo = useRef(false);

const [planillas, setPlanillas] = useState([]);
const [cargandoLista, setCargandoLista] = useState(true);
const [errorLista, setErrorLista] = useState('');
const peticionLista = useRef(null);

async function cargarPlanillas() {
  peticionLista.current?.abort();

  const controlador = new AbortController();
  peticionLista.current = controlador;

  setCargandoLista(true);
  setErrorLista('');

  try {
    const respuesta = await fetch(`${API_URL}/nomina/planillas`, {
      signal: controlador.signal,
    });

    if (!respuesta.ok) {
      throw new Error(
        `No se pudieron consultar las planillas (${respuesta.status}).`
      );
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos)) {
      throw new Error('El servidor devolvió un formato inesperado.');
    }

    if (!controlador.signal.aborted) {
      setPlanillas(datos);
    }
  } catch (err) {
    if (controlador.signal.aborted) return;

    setErrorLista(
      err instanceof TypeError
        ? 'No se pudo conectar con el backend.'
        : err.message
    );
  } finally {
    if (!controlador.signal.aborted) {
      setCargandoLista(false);
    }
  }
}

useEffect(() => {
  cargarPlanillas();

  return () => peticionLista.current?.abort();
}, []);

async function verPlanilla(id) {
  if (bloqueo.current) return;

  bloqueo.current = true;
  setProcesando(true);
  setError('');

  try {
    const respuesta = await fetch(
      `${API_URL}/nomina/planillas/${id}`
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.error || 'No se pudo consultar la planilla.'
      );
    }

    setPlanillaSeleccionada(resultado);
    setBoletaSeleccionada(null);
  } catch (err) {
    setError(
      err instanceof TypeError
        ? 'No se pudo conectar con el backend.'
        : err.message
    );
  } finally {
    bloqueo.current = false;
    setProcesando(false);
  }
}

async function cambiarEstadoPlanilla(planilla, accion) {
  if (bloqueo.current || planilla.estado !== 'generada') return;

  const confirmar = window.confirm(
    accion === 'pagar'
      ? '¿Confirmás que esta planilla ya fue pagada?'
      : '¿Querés anular esta planilla?'
  );

  if (!confirmar) return;

  bloqueo.current = true;
  setProcesando(true);
  setError('');

  try {
    const respuesta = await fetch(
      `${API_URL}/nomina/planillas/${planilla.id}/${accion}`,
      { method: 'PATCH' }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.error || 'No se pudo actualizar la planilla.'
      );
    }

    setPlanillaSeleccionada((actual) =>
      actual?.id === planilla.id ? null : actual
    );

    await cargarPlanillas();
  } catch (err) {
    setError(
      err instanceof TypeError
        ? 'No se pudo conectar con el backend.'
        : err.message
    );
  } finally {
    bloqueo.current = false;
    setProcesando(false);
  }
}

async function verBoleta(empleadoId) {
  if (bloqueo.current || !planillaSeleccionada) return;

  bloqueo.current = true;
  setProcesando(true);
  setError('');
  setBoletaSeleccionada(null);

  try {
    const respuesta = await fetch(
      `${API_URL}/nomina/planillas/${planillaSeleccionada.id}/boleta/${empleadoId}`
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.error || 'No se pudo consultar la boleta.'
      );
    }

    setBoletaSeleccionada(resultado);
  } catch (err) {
    setError(
      err instanceof TypeError
        ? 'No se pudo conectar con el backend.'
        : err.message
    );
  } finally {
    bloqueo.current = false;
    setProcesando(false);
  }
}


async function generarPlanilla(evento) {
  evento.preventDefault();

  if (bloqueo.current) return;

  setError('');

  const datos = {
    anio: Number(periodo.anio),
    mes: Number(periodo.mes),
    quincena: Number(periodo.quincena),
  };

  if (
    !Number.isInteger(datos.anio) ||
    datos.anio < 2000 ||
    datos.anio > 2100 ||
    !Number.isInteger(datos.mes) ||
    datos.mes < 1 ||
    datos.mes > 12 ||
    ![1, 2].includes(datos.quincena)
  ) {
    setError('Revisá el año, mes y quincena.');
    return;
  }

  const confirmar = window.confirm(
    `¿Generar la quincena ${datos.quincena} de ${datos.mes}/${datos.anio}?`
  );

  if (!confirmar) return;

  bloqueo.current = true;
  setProcesando(true);

  try {
    const respuesta = await fetch(`${API_URL}/nomina/planillas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.error || 'No se pudo generar la planilla.'
      );
    }

    setPlanillaSeleccionada(resultado);
    setBoletaSeleccionada(null);
    await cargarPlanillas();
  } catch (err) {
    setError(
      err instanceof TypeError
        ? 'No se pudo conectar con el backend.'
        : err.message
    );
  } finally {
    bloqueo.current = false;
    setProcesando(false);
  }
}

  function actualizarPeriodo(evento) {
    const { name, value } = evento.target;

    setPeriodo((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  return (
    <section className="ventas">
      <header className="ventas__encabezado">
        <h1>Nómina y planillas</h1>
        <p>Generá las planillas quincenales y consultá las boletas.</p>
      </header>

      <section className="ventas__panel">
        <h2>Generar planilla</h2>

       <form className="ventas__datos" onSubmit={generarPlanilla}>
          <label htmlFor="nomina-anio">Año</label>
          <input
            id="nomina-anio"
            name="anio"
            type="number"
            min="2000"
            max="2100"
            step="1"
            value={periodo.anio}
            onChange={actualizarPeriodo}
            required
          />

          <label htmlFor="nomina-mes">Mes</label>
          <select
            id="nomina-mes"
            name="mes"
            value={periodo.mes}
            onChange={actualizarPeriodo}
          >
            {[
              'Enero', 'Febrero', 'Marzo', 'Abril',
              'Mayo', 'Junio', 'Julio', 'Agosto',
              'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
            ].map((mes, indice) => (
              <option key={indice + 1} value={indice + 1}>
                {mes}
              </option>
            ))}
          </select>

          <label htmlFor="nomina-quincena">Quincena</label>
          <select
            id="nomina-quincena"
            name="quincena"
            value={periodo.quincena}
            onChange={actualizarPeriodo}
          >
            <option value="1">Primera: del 1 al 15</option>
            <option value="2">Segunda: del 16 al fin de mes</option>
          </select>
         <button type="submit" disabled={procesando}>
    {procesando ? 'Generando...' : 'Generar planilla'}
  </button>

  {error && <p role="alert">{error}</p>}
</form>
      </section>

            <section className="ventas__panel">
  <h2>Historial de planillas</h2>

  <button
    type="button"
    onClick={cargarPlanillas}
    disabled={cargandoLista || procesando}
  >
    {cargandoLista ? 'Cargando...' : 'Actualizar planillas'}
  </button>

  {cargandoLista ? (
    <p role="status">Consultando planillas...</p>
  ) : errorLista ? (
    <p role="alert">{errorLista}</p>
  ) : planillas.length === 0 ? (
    <p>No hay planillas registradas.</p>
  ) : (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Período</th>
            <th>Quincena</th>
            <th>Total neto</th>
            <th>Boleta</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {planillas.map((planilla) => (
            <tr key={planilla.id}>
              <td>{planilla.mes}/{planilla.anio}</td>
              <td>{planilla.quincena}</td>
              <td>${Number(planilla.total_neto).toFixed(2)}</td>
              <td>{planilla.estado}</td>
              <td>
  <button
    type="button"
    disabled={procesando}
    onClick={() => verPlanilla(planilla.id)}
  >
    Ver detalle
  </button>

            <button
  type="button"
  disabled={procesando || planilla.estado !== 'generada'}
  onClick={() => cambiarEstadoPlanilla(planilla, 'pagar')}
>
  Marcar pagada
</button>

<button
  type="button"
  disabled={procesando || planilla.estado !== 'generada'}
  onClick={() => cambiarEstadoPlanilla(planilla, 'anular')}
>
  Anular planilla
</button>

</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>

            {planillaSeleccionada && (
  <section className="ventas__panel">
    <h2>Detalle de planilla</h2>

    <p>
      Período: {planillaSeleccionada.mes}/
      {planillaSeleccionada.anio}
      {' — Quincena '}
      {planillaSeleccionada.quincena}
    </p>

    <p>Estado: {planillaSeleccionada.estado}</p>

    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Empleado</th>
            <th>Devengado</th>
            <th>ISSS</th>
            <th>AFP</th>
            <th>Renta</th>
            <th>Deducciones</th>
            <th>Neto</th>
          </tr>
        </thead>

        <tbody>
          {(planillaSeleccionada.detalles || []).map((detalle) => (
            <tr key={detalle.id ?? detalle.empleado_id}>
              <td>{detalle.nombre_empleado}</td>
              <td>${Number(detalle.devengado).toFixed(2)}</td>
              <td>${Number(detalle.isss).toFixed(2)}</td>
              <td>${Number(detalle.afp).toFixed(2)}</td>
              <td>${Number(detalle.renta).toFixed(2)}</td>
              <td>
                ${Number(detalle.total_deducciones).toFixed(2)}
              </td>
              <td>${Number(detalle.salario_neto).toFixed(2)}</td>

              <td>
  <button
    type="button"
    disabled={procesando}
    onClick={() => verBoleta(detalle.empleado_id)}
  >
    Ver boleta
  </button>
</td>
            </tr>
            
          ))}
        </tbody>
      </table>
    </div>

    <p>
      Total devengado: $
      {Number(planillaSeleccionada.total_devengado).toFixed(2)}
    </p>

    <p>
      Total deducciones: $
      {Number(planillaSeleccionada.total_deducciones).toFixed(2)}
    </p>

    <p>
      <strong>
        Total neto: $
        {Number(planillaSeleccionada.total_neto).toFixed(2)}
      </strong>
    </p>

    <button
      type="button"
      disabled={procesando}
      onClick={() => setPlanillaSeleccionada(null)}
    >
      Cerrar detalle
    </button>
  </section>
)}

{planillaSeleccionada && boletaSeleccionada && (
  <section className="ventas__panel">
    <h2>Boleta de pago</h2>

    <p>
      Empleado: {boletaSeleccionada.boleta.nombre_empleado}
    </p>
    <p>Cargo: {boletaSeleccionada.boleta.cargo}</p>

    <p>
      Período: {boletaSeleccionada.planilla.fecha_inicio}
      {' al '}
      {boletaSeleccionada.planilla.fecha_fin}
    </p>

    <p>
      Estado de planilla: {boletaSeleccionada.planilla.estado}
    </p>

    <p>
      Salario mensual: $
      {Number(boletaSeleccionada.boleta.salario_mensual).toFixed(2)}
    </p>
    <p>
      Días trabajados: {boletaSeleccionada.boleta.dias_trabajados}
    </p>
    <p>
      Devengado: $
      {Number(boletaSeleccionada.boleta.devengado).toFixed(2)}
    </p>
    <p>
      ISSS: $
      {Number(boletaSeleccionada.boleta.isss).toFixed(2)}
    </p>
    <p>
      AFP: $
      {Number(boletaSeleccionada.boleta.afp).toFixed(2)}
    </p>
    <p>
      Renta: $
      {Number(boletaSeleccionada.boleta.renta).toFixed(2)}
    </p>
    <p>
      Total deducciones: $
      {Number(boletaSeleccionada.boleta.total_deducciones).toFixed(2)}
    </p>

    <p>
      <strong>
        Neto a pagar: $
        {Number(boletaSeleccionada.boleta.salario_neto).toFixed(2)}
      </strong>
    </p>

    <button
      type="button"
      onClick={() => setBoletaSeleccionada(null)}
    >
      Cerrar boleta
    </button>
  </section>
)}
    </section>
  );
}