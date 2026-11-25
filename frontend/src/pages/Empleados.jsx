import React, { useEffect, useRef, useState } from 'react';
import '../styles/ventas.css';
const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

export default function Empleados() {
      const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    dui: '',
    cargo: 'barista',
    salario_mensual: '',
    fecha_contratacion: '',
    telefono: '',
    email: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);

function editarEmpleado(empleado) {
  setEmpleadoEditando(empleado.id);
  setError('');
  setMensaje('');

  setFormulario({
    nombre: empleado.nombre || '',
    apellido: empleado.apellido || '',
    dui: empleado.dui || '',
    cargo: empleado.cargo || 'barista',
    salario_mensual: empleado.salario_mensual ?? '',
    fecha_contratacion: empleado.fecha_contratacion
      ? empleado.fecha_contratacion.slice(0, 10)
      : '',
    telefono: empleado.telefono || '',
    email: empleado.email || '',
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
const [error, setError] = useState('');
const [mensaje, setMensaje] = useState('');
const bloqueo = useRef(false);

const [empleados, setEmpleados] = useState([]);
const [cargandoLista, setCargandoLista] = useState(true);
const [errorLista, setErrorLista] = useState('');
const peticionLista = useRef(null);

async function cargarEmpleados() {
  peticionLista.current?.abort();

  const controlador = new AbortController();
  peticionLista.current = controlador;

  setCargandoLista(true);
  setErrorLista('');

  try {
    const respuesta = await fetch(
      `${API_URL}/nomina/empleados?solo_activos=false`,
      { signal: controlador.signal }
    );

    if (!respuesta.ok) {
      throw new Error(
        `No se pudieron consultar los empleados (${respuesta.status}).`
      );
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos)) {
      throw new Error('El servidor devolvió un formato inesperado.');
    }

    if (!controlador.signal.aborted) {
      setEmpleados(datos);
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
  cargarEmpleados();

  return () => peticionLista.current?.abort();
}, []);

async function darDeBaja(empleado) {
  if (bloqueo.current) return;

  const confirmar = window.confirm(
    `¿Dar de baja a ${empleado.nombre} ${empleado.apellido}?`
  );

  if (!confirmar) return;

  bloqueo.current = true;
  setGuardando(true);
  setError('');
  setMensaje('');

  try {
    const respuesta = await fetch(
      `${API_URL}/nomina/empleados/${empleado.id}`,
      { method: 'DELETE' }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.error || 'No se pudo dar de baja al empleado.'
      );
    }

    setMensaje('Empleado dado de baja correctamente.');
    await cargarEmpleados();
  } catch (err) {
    setError(
      err instanceof TypeError
        ? 'No se pudo conectar con el backend.'
        : err.message
    );
  } finally {
    bloqueo.current = false;
    setGuardando(false);
  }
}

async function guardarEmpleado(evento) {
  evento.preventDefault();

  if (bloqueo.current) return;

  setError('');
  setMensaje('');

  const salario = Number(formulario.salario_mensual);

  if (
    !formulario.nombre.trim() ||
    !formulario.apellido.trim() ||
    !Number.isFinite(salario) ||
    salario <= 0
  ) {
    setError('Ingresá nombre, apellido y un salario mayor a cero.');
    return;
  }

  const datos = {
    ...formulario,
    nombre: formulario.nombre.trim(),
    apellido: formulario.apellido.trim(),
    dui: formulario.dui.trim(),
    salario_mensual: salario,
  };

  if (!datos.fecha_contratacion) {
    delete datos.fecha_contratacion;
  }

  bloqueo.current = true;
  setGuardando(true);

  try {
    const url = empleadoEditando !== null
  ? `${API_URL}/nomina/empleados/${empleadoEditando}`
  : `${API_URL}/nomina/empleados`;

const respuesta = await fetch(url, {
  method: empleadoEditando !== null ? 'PUT' : 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(datos),
});

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.error || 'No se pudo guardar el empleado.'
      );
    }

   setMensaje(
  empleadoEditando !== null
    ? 'Empleado actualizado correctamente.'
    : 'Empleado registrado correctamente.'
);

setEmpleadoEditando(null);

setFormulario({
  nombre: '',
  apellido: '',
  dui: '',
  cargo: 'barista',
  salario_mensual: '',
  fecha_contratacion: '',
  telefono: '',
  email: '',
});
    await cargarEmpleados();
  } catch (err) {
    setError(
      err instanceof TypeError
        ? 'No se pudo conectar con el backend.'
        : err.message
    );
  } finally {
    bloqueo.current = false;
    setGuardando(false);
  }
}

  function actualizarCampo(evento) {
    const { name, value } = evento.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  }
  return (
    <section className="ventas">
      <header className="ventas__encabezado">
        <h1>Empleados</h1>
        <p>Registrá y administrá el personal de la cafetería.</p>
      </header>
    <section className="ventas__panel">
  <h2>
  {empleadoEditando !== null
    ? 'Editar empleado'
    : 'Datos del empleado'}
</h2>

  {error && <p role="alert">{error}</p>}
  {mensaje && <p role="status">{mensaje}</p>}

  <form className="ventas__datos" onSubmit={guardarEmpleado}>
    <label htmlFor="empleado-nombre">Nombre</label>
    <input
      id="empleado-nombre"
      name="nombre"
      value={formulario.nombre}
      onChange={actualizarCampo}
      required
    />

    <label htmlFor="empleado-apellido">Apellido</label>
    <input
      id="empleado-apellido"
      name="apellido"
      value={formulario.apellido}
      onChange={actualizarCampo}
      required
    />

    <label htmlFor="empleado-dui">DUI</label>
    <input
      id="empleado-dui"
      name="dui"
      placeholder="00000000-0"
      pattern="[0-9]{8}-[0-9]"
      maxLength={10}
      value={formulario.dui}
      onChange={actualizarCampo}
    />

    <label htmlFor="empleado-cargo">Cargo</label>
    <select
      id="empleado-cargo"
      name="cargo"
      value={formulario.cargo}
      onChange={actualizarCampo}
    >
      <option value="barista">Barista</option>
      <option value="cajero">Cajero</option>
      <option value="gerente">Gerente</option>
    </select>

    <label htmlFor="empleado-salario">Salario mensual ($)</label>
    <input
      id="empleado-salario"
      name="salario_mensual"
      type="number"
      min="0.01"
      step="0.01"
      value={formulario.salario_mensual}
      onChange={actualizarCampo}
      required
    />

    <label htmlFor="empleado-fecha">Fecha de contratación</label>
    <input
      id="empleado-fecha"
      name="fecha_contratacion"
      type="date"
      value={formulario.fecha_contratacion}
      onChange={actualizarCampo}
    />

    <label htmlFor="empleado-telefono">Teléfono</label>
    <input
      id="empleado-telefono"
      name="telefono"
      type="tel"
      value={formulario.telefono}
      onChange={actualizarCampo}
    />

    <label htmlFor="empleado-email">Correo electrónico</label>
    <input
      id="empleado-email"
      name="email"
      type="email"
      value={formulario.email}
      onChange={actualizarCampo}
    />
    <button type="submit" disabled={guardando}>
  {guardando
    ? 'Guardando...'
    : empleadoEditando !== null
      ? 'Guardar cambios'
      : 'Guardar empleado'}
</button>

{empleadoEditando !== null && (
  <button
    type="button"
    disabled={guardando}
    onClick={() => {
      setEmpleadoEditando(null);
      setError('');
      setMensaje('');

      setFormulario({
        nombre: '',
        apellido: '',
        dui: '',
        cargo: 'barista',
        salario_mensual: '',
        fecha_contratacion: '',
        telefono: '',
        email: '',
      });
    }}
  >
    Cancelar edición
  </button>
)}
  </form>
</section>
      <section className="ventas__panel">
        <h2>Personal registrado</h2>
        <button
  type="button"
  onClick={cargarEmpleados}
  disabled={cargandoLista || guardando}
>
  {cargandoLista ? 'Cargando...' : 'Actualizar empleados'}
</button>

{cargandoLista ? (
  <p role="status">Consultando empleados...</p>
) : errorLista ? (
  <p role="alert">{errorLista}</p>
) : empleados.length === 0 ? (
  <p>No hay empleados registrados.</p>
) : (
  <div style={{ overflowX: 'auto' }}>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Cargo</th>
          <th>DUI</th>
          <th>Salario mensual</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        {empleados.map((empleado) => (
          <tr key={empleado.id}>
            <td>
              {empleado.nombre} {empleado.apellido}
            </td>
            <td>{empleado.cargo}</td>
            <td>{empleado.dui || '—'}</td>
            <td>
              ${Number(empleado.salario_mensual).toFixed(2)}
            </td>
            <td>{empleado.es_activo ? 'Activo' : 'Inactivo'}</td>
            <td>
  <button
    type="button"
    onClick={() => editarEmpleado(empleado)}
    disabled={guardando || !empleado.es_activo}
  >
    Editar
  </button>
  <button
  type="button"
  onClick={() => darDeBaja(empleado)}
  disabled={
    guardando ||
    !empleado.es_activo ||
    empleadoEditando !== null
  }
>
  Dar de baja
</button>
</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
      </section>
    </section>
  );
}