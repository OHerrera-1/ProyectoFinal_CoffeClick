// Los precios de venta incluyen el IVA.
//   FCF: IVA incluido en el precio. subtotal = total / 1.13, iva = total - subtotal
//   CCF: detalle con precio SIN IVA. subtotal = suma de líneas netas,
//        iva = 13% del subtotal, total = subtotal + iva
// Todo esta en centavos para evitar errores.

const IVA_RATE = 0.13;
const IVA_PCT = 13;

const aCentavos = (valor) => Math.round(Number(valor) * 100);
const aDolares = (centavos) => centavos / 100;

// monto / 1.13  ==  monto * 100 / 113
const quitarIvaC = (montoConIvaC) => Math.round((montoConIvaC * 100) / (100 + IVA_PCT));

const errorValidacion = (mensaje) => {
  const err = new Error(mensaje);
  err.status = 400;
  return err;
};

// Valida items (cantidad ENTERA >= 1) y junta productos repetidos
const normalizarItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw errorValidacion('Se requiere al menos un producto');
  }

  const acumulado = new Map();
  for (const item of items) {
    const productoId = Number(item.producto_id);
    const cantidad = Number(item.cantidad);

    if (!Number.isInteger(productoId) || productoId <= 0) {
      throw errorValidacion('Cada item requiere un producto_id válido');
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw errorValidacion('La cantidad de cada producto debe ser un entero mayor o igual a 1');
    }

    acumulado.set(productoId, (acumulado.get(productoId) || 0) + cantidad);
  }

  return Array.from(acumulado, ([producto_id, cantidad]) => ({ producto_id, cantidad }));
};

const calcularMontos = (items, tipo = 'FCF') => {
  if (!['FCF', 'CCF'].includes(tipo)) {
    throw errorValidacion('El tipo de factura debe ser FCF o CCF');
  }

  const lineas = items.map((item) => {
    const cantidad = Number(item.cantidad);
    const precioC = aCentavos(item.precio_unitario);

    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw errorValidacion('La cantidad de cada producto debe ser un entero mayor o igual a 1');
    }
    if (!Number.isFinite(precioC) || precioC < 0) {
      throw errorValidacion('El precio de un producto es inválido');
    }

    const totalLineaC = precioC * cantidad;      // con IVA
    const netoLineaC = quitarIvaC(totalLineaC);  // sin IVA
    return { item, cantidad, precioC, totalLineaC, netoLineaC };
  });

  let subtotalC;
  let ivaC;
  let totalC;

  if (tipo === 'CCF') {
    subtotalC = lineas.reduce((acc, l) => acc + l.netoLineaC, 0);
    ivaC = Math.round((subtotalC * IVA_PCT) / 100);
    totalC = subtotalC + ivaC;
  } else {
    totalC = lineas.reduce((acc, l) => acc + l.totalLineaC, 0);
    subtotalC = quitarIvaC(totalC);
    ivaC = totalC - subtotalC;
  }

  return {
    subtotal: aDolares(subtotalC),
    iva_monto: aDolares(ivaC),
    total: aDolares(totalC),
    // Lo que se guarda en detalle_facturas:
    // FCF -> precios con IVA, CCF -> precios sin IVA
    lineas: lineas.map((l) => ({
      producto_id: l.item.producto_id,
      nombre_producto: l.item.nombre_producto,
      cantidad: l.cantidad,
      precio_unitario: aDolares(tipo === 'CCF' ? quitarIvaC(l.precioC) : l.precioC),
      subtotal_linea: aDolares(tipo === 'CCF' ? l.netoLineaC : l.totalLineaC),
    })),
  };
};

module.exports = { calcularMontos, normalizarItems, IVA_RATE, IVA_PCT };