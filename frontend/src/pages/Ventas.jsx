import React, { useEffect, useRef, useState } from 'react';
import { PRODUCTOS_ESTRELLA } from '../data/mock';
import '../styles/ventas.css';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

const dinero = (valor) => `$${Number(valor).toFixed(2)}`;

export default function Ventas() {
  const [modo, setModo] = useState('prueba');
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [mostrarResumen, setMostrarResumen] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [errorProductos, setErrorProductos] = useState('');
  const [facturaRegistrada, setFacturaRegistrada] = useState(null);

  const peticionProductos = useRef(null);
  const bloqueo = useRef(false);

  async function cargarProductos() {
    peticionProductos.current?.abort();

    const controlador = new AbortController();
    peticionProductos.current = controlador;

    setCargando(true);
    setErrorProductos('');
    setProductos([]);

    try {
      const respuesta = await fetch(
        `${API_URL}/inventario/productos`,
        { signal: controlador.signal }
      );

      if (!respuesta.ok) {
        throw new Error(
          `No se pudieron consultar los productos (${respuesta.status}).`
        );
      }

      const datos = await respuesta.json();

      if (
        !Array.isArray(datos) ||
        datos.some(
          (producto) =>
            producto.id == null ||
            typeof producto.nombre !== 'string' ||
            producto.precio_venta == null ||
            !Number.isFinite(Number(producto.precio_venta)) ||
            Number(producto.precio_venta) < 0
        )
      ) {
        throw new Error('El catálogo recibido tiene un formato inesperado.');
      }

      if (!controlador.signal.aborted) {
        setProductos(
          datos
            .filter((producto) => producto.es_activo !== false)
            .map((producto) => ({
              ...producto,
              precio: Number(producto.precio_venta),
              origen: 'backend',
            }))
        );
      }
    } catch (err) {
      if (controlador.signal.aborted) return;

      setErrorProductos(
        err instanceof TypeError
          ? 'No se pudo conectar con el backend.'
          : err.message
      );
    } finally {
      if (!controlador.signal.aborted) {
        setCargando(false);
      }
    }
  }

  useEffect(() => {
    if (modo === 'backend') {
      cargarProductos();
    } else {
      setCargando(false);
    }

    return () => peticionProductos.current?.abort();
  }, [modo]);

  function cambiarModo(evento) {
    if (bloqueo.current) return;

    if (
      carrito.length > 0 &&
      !window.confirm('Cambiar de modo vaciará la orden. ¿Continuar?')
    ) {
      return;
    }

    peticionProductos.current?.abort();

    setModo(evento.target.value);
    setCarrito([]);
    setProductos([]);
    setMostrarResumen(false);
    setFacturaRegistrada(null);
    setError('');
    setErrorProductos('');
    setBusqueda('');
  }

  function agregarProducto(producto) {
    if (bloqueo.current) return;

    const cantidadActual =
      carrito.find((item) => item.id === producto.id)?.cantidad || 0;

    if (
      modo === 'backend' &&
      producto.tipo === 'reventa' &&
      producto.stock_actual != null &&
      cantidadActual + 1 > Number(producto.stock_actual)
    ) {
      setError(`Stock insuficiente de ${producto.nombre}.`);
      return;
    }

    setError('');
    setMostrarResumen(false);

    setCarrito((actual) => {
      const existe = actual.find((item) => item.id === producto.id);

      if (existe) {
        return actual.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }

      return [...actual, { ...producto, cantidad: 1 }];
    });
  }

  function restarProducto(id) {
    if (bloqueo.current) return;

    setMostrarResumen(false);

    setCarrito((actual) =>
      actual
        .map((producto) =>
          producto.id === id
            ? { ...producto, cantidad: producto.cantidad - 1 }
            : producto
        )
        .filter((producto) => producto.cantidad > 0)
    );
  }

  function quitarProducto(id) {
    if (bloqueo.current) return;

    setMostrarResumen(false);
    setCarrito((actual) => actual.filter((item) => item.id !== id));
  }

  function vaciarOrden() {
    if (bloqueo.current) return;

    setCarrito([]);
    setMostrarResumen(false);
  }

  async function registrarVenta() {
    if (bloqueo.current) return;

    setError('');

    if (
      modo !== 'backend' ||
      cargando ||
      errorProductos ||
      carrito.length === 0 ||
      carrito.some(
        (item) =>
          item.origen !== 'backend' ||
          !Number.isSafeInteger(item.cantidad) ||
          item.cantidad <= 0
      )
    ) {
      setError('La venta requiere una orden con productos reales del backend.');
      return;
    }

    if (!window.confirm('¿Registrar esta venta de consumidor final?')) {
      return;
    }

    bloqueo.current = true;
    setGuardando(true);
    setFacturaRegistrada(null);

    try {
      const respuesta = await fetch(`${API_URL}/facturacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'FCF',
          nombre_cliente: nombreCliente.trim() || 'Consumidor Final',
          items: carrito.map((item) => ({
            producto_id: item.id,
            cantidad: item.cantidad,
          })),
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo registrar la venta.');
      }

      setFacturaRegistrada(datos);
      setCarrito([]);
      setNombreCliente('');
      setMostrarResumen(false);

      await cargarProductos();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Se perdió la conexión. Antes de reintentar, revisá el historial para confirmar si la venta se registró.'
          : err instanceof SyntaxError
            ? 'La respuesta no pudo interpretarse. Revisá el historial antes de reintentar.'
            : err.message
      );
    } finally {
      bloqueo.current = false;
      setGuardando(false);
    }
  }

  const catalogo =
    modo === 'prueba'
      ? PRODUCTOS_ESTRELLA.map((producto) => ({
          ...producto,
          origen: 'prueba',
        }))
      : productos;

  const productosFiltrados = catalogo.filter((producto) =>
    producto.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  const total = carrito.reduce(
    (suma, item) => suma + item.precio * item.cantidad,
    0
  );

  return (
    <section className="ventas">
      <header className="ventas__encabezado">
        <h1>Punto de venta</h1>
        <p>Seleccioná los productos para comenzar una venta.</p>
        <p>
          {modo === 'prueba'
            ? 'Modo de prueba: no registra facturas ni modifica inventario.'
            : 'Modo backend: las ventas confirmadas registran facturas y afectan el inventario.'}
        </p>
      </header>

      {error && <p role="alert">{error}</p>}

      <div className="ventas__contenido">
        <section className="ventas__panel">
          <h2>Productos</h2>

          <div className="ventas__datos">
            <label htmlFor="modoVentas">Origen de los productos</label>
            <select
              id="modoVentas"
              value={modo}
              onChange={cambiarModo}
              disabled={guardando}
            >
              <option value="prueba">Productos de prueba</option>
              <option value="backend">Productos reales del backend</option>
            </select>
          </div>

          {modo === 'backend' && (
            <button
              type="button"
              onClick={cargarProductos}
              disabled={cargando || guardando}
            >
              {cargando ? 'Cargando...' : 'Actualizar productos'}
            </button>
          )}

          <input
            type="search"
            aria-label="Buscar producto"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />

          {errorProductos && <p role="alert">{errorProductos}</p>}

          {cargando ? (
            <p role="status">Consultando productos...</p>
          ) : (
            <>
              {!errorProductos && productosFiltrados.length === 0 && (
                <p>No hay productos para mostrar.</p>
              )}

              <div className="ventas__productos">
                {productosFiltrados.map((producto) => (
                  <article
                    className="ventas__producto"
                    key={producto.id}
                  >
                    <span>{producto.categoria}</span>
                    <h3>{producto.nombre}</h3>
                    <p>{producto.descripcion}</p>
                    <strong>{dinero(producto.precio)}</strong>

                    <button
                      type="button"
                      disabled={
                        guardando ||
                        (
                          modo === 'backend' &&
                          producto.tipo === 'reventa' &&
                          producto.stock_actual != null &&
                          Number(producto.stock_actual) < 1
                        )
                      }
                      onClick={() => agregarProducto(producto)}
                    >
                      Agregar a la orden
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="ventas__panel">
          <h2>Orden actual</h2>

          <div className="ventas__datos">
            <label htmlFor="nombreCliente">Nombre del cliente</label>
            <input
              id="nombreCliente"
              type="text"
              placeholder="Consumidor Final"
              value={nombreCliente}
              disabled={guardando}
              onChange={(evento) => {
                setNombreCliente(evento.target.value);
                setMostrarResumen(false);
              }}
            />

            <label htmlFor="tipoFactura">Tipo de comprobante</label>
            <select id="tipoFactura" disabled value="FCF">
              <option value="FCF">Consumidor final</option>
              <option value="CCF">
                Crédito fiscal — pendiente de conectar clientes
              </option>
            </select>
          </div>

          {carrito.length === 0 ? (
            <p className="ventas__vacio">
              Todavía no agregaste productos.
            </p>
          ) : (
            <>
              <ul>
                {carrito.map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.nombre} × {item.cantidad}
                      {' — '}
                      {dinero(item.precio * item.cantidad)}
                    </span>

                    <button
                      type="button"
                      disabled={guardando}
                      onClick={() => restarProducto(item.id)}
                    >
                      −1
                    </button>

                    <button
                      type="button"
                      disabled={guardando}
                      onClick={() => quitarProducto(item.id)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>

              <p>
                <strong>
                  {modo === 'prueba' ? 'Total de prueba' : 'Total estimado'}
                  : {dinero(total)}
                </strong>
              </p>

              <button
                type="button"
                disabled={guardando}
                onClick={vaciarOrden}
              >
                Vaciar orden
              </button>

              <button
                type="button"
                disabled={guardando}
                onClick={() => setMostrarResumen(true)}
              >
                Ver resumen
              </button>

              <button
                type="button"
                disabled={
                  modo !== 'backend' ||
                  guardando ||
                  cargando ||
                  Boolean(errorProductos)
                }
                onClick={registrarVenta}
              >
                {guardando ? 'Registrando...' : 'Registrar venta real'}
              </button>

              {mostrarResumen && (
                <div className="ventas__panel">
                  <h3>Resumen de la orden</h3>

                  <ul>
                    {carrito.map((item) => (
                      <li key={item.id}>
                        {item.nombre} × {item.cantidad}
                        {' — '}
                        {dinero(item.precio * item.cantidad)}
                      </li>
                    ))}
                  </ul>

                  <p>Esta vista no registra una factura.</p>
                  <p>
                    Cliente: {nombreCliente.trim() || 'Consumidor Final'}
                  </p>
                  <p>Tipo: FCF</p>
                  <p>Total estimado: {dinero(total)}</p>

                  <button
                    type="button"
                    onClick={() => setMostrarResumen(false)}
                  >
                    Cerrar resumen
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {facturaRegistrada && (
        <section className="ventas__panel">
          <h2>Venta registrada</h2>
          <p>Correlativo: {facturaRegistrada.numero_correlativo}</p>
          <p>Cliente: {facturaRegistrada.nombre_cliente}</p>
          <p>Tipo: {facturaRegistrada.tipo}</p>

          <ul>
            {(facturaRegistrada.detalles || []).map((detalle) => (
              <li key={detalle.id ?? detalle.producto_id}>
                {detalle.nombre_producto} × {detalle.cantidad}
                {' — '}
                {dinero(detalle.subtotal_linea)}
              </li>
            ))}
          </ul>

          <p>Subtotal: {dinero(facturaRegistrada.subtotal)}</p>
          <p>IVA: {dinero(facturaRegistrada.iva_monto)}</p>
          <p>
            <strong>Total: {dinero(facturaRegistrada.total)}</strong>
          </p>

          <button
            type="button"
            onClick={() => setFacturaRegistrada(null)}
          >
            Cerrar comprobante
          </button>
        </section>
      )}
    </section>
  );
}