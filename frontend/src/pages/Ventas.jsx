import React, { useState } from 'react';
import { PRODUCTOS_ESTRELLA } from '../data/mock';
import '../styles/ventas.css';

export default function Ventas() {
      const [carrito, setCarrito] = useState([]);
      const [busqueda, setBusqueda] = useState('');
      const [nombreCliente, setNombreCliente] = useState('');
const [tipoFactura, setTipoFactura] = useState('FCF');
const [mostrarResumen, setMostrarResumen] = useState(false);

  function agregarProducto(producto) {
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
  function quitarProducto(id) {
  setCarrito((actual) =>
    actual.filter((item) => item.id !== id)
  );
}
  const total = carrito.reduce(
  (suma, item) => suma + item.precio * item.cantidad,
  0
);
  return (
    <section className="ventas">
      <header className="ventas__encabezado">
        <h1>Punto de venta</h1>
        <p>Seleccioná los productos para comenzar una venta.</p>
        <p>Modo de prueba: estos productos no vienen de la base de datos.</p>
      </header>

      <div className="ventas__contenido">
        <section className="ventas__panel">
          <h2>Productos</h2>
          <input
  type="search"
  aria-label="Buscar producto"
  placeholder="Buscar producto..."
  value={busqueda}
  onChange={(evento) => setBusqueda(evento.target.value)}
/>

          <div className="ventas__productos">
            {PRODUCTOS_ESTRELLA.filter((producto) =>
  producto.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
).map((producto) => (
              <article className="ventas__producto" key={producto.id}>
                <span>{producto.categoria}</span>
                <h3>{producto.nombre}</h3>
                <p>{producto.descripcion}</p>
                <strong>${producto.precio.toFixed(2)}</strong>
                <button
  type="button"
  onClick={() => agregarProducto(producto)}
>
  Agregar a la orden
</button>
              </article>
            ))}
          </div>
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
    onChange={(evento) => setNombreCliente(evento.target.value)}
  />

  <label htmlFor="tipoFactura">Tipo de comprobante</label>
  <select
    id="tipoFactura"
    value={tipoFactura}
    onChange={(evento) => setTipoFactura(evento.target.value)}
  >
    <option value="FCF">Consumidor final</option>
    <option value="CCF" disabled>
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
  {item.nombre} × {item.cantidad}
  {' — '}
  ${(item.precio * item.cantidad).toFixed(2)}

  <button
    type="button"
    onClick={() =>
      setCarrito((actual) =>
        actual
          .map((producto) =>
            producto.id === item.id
              ? { ...producto, cantidad: producto.cantidad - 1 }
              : producto
          )
          .filter((producto) => producto.cantidad > 0)
      )
    }
  >
    −1
  </button>

  <button
    type="button"
    onClick={() =>
      setCarrito((actual) =>
        actual.filter((producto) => producto.id !== item.id)
      )
    }
  >
    Quitar
  </button>
</li>
      ))}
    </ul>

    <p>
      <strong>Total de prueba: ${total.toFixed(2)}</strong>
    </p>
    <button
  type="button"
  onClick={() => setCarrito([])}
>
  Vaciar orden
</button>
<button
  type="button"
  onClick={() => setMostrarResumen(true)}
>
  Ver resumen de prueba
</button>

{mostrarResumen && (
  <div className="ventas__panel">
    <h3>Resumen de prueba</h3>
    <ul>
  {carrito.map((item) => (
    <li key={item.id}>
      {item.nombre} × {item.cantidad}
      {' — '}
      ${(item.precio * item.cantidad).toFixed(2)}
    </li>
  ))}
</ul>
    <p>Esta vista no registra una factura.</p>
    <p>
      Cliente: {nombreCliente.trim() || 'Consumidor Final'}
    </p>
    <p>Tipo: {tipoFactura}</p>
    <p>Total: ${total.toFixed(2)}</p>

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
    </section>
  );
}