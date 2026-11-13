const IVA_RATE = 0.13;

const calcularMontos = (items) => {
  const total = items.reduce((acc, item) => {
    return acc + parseFloat(item.precio_unitario) * item.cantidad;
  }, 0);

  const subtotal = parseFloat((total / (1 + IVA_RATE)).toFixed(2));
  const iva_monto = parseFloat((total - subtotal).toFixed(2));

  return {
    subtotal,
    iva_monto,
    total: parseFloat(total.toFixed(2)),
  };
};

module.exports = { calcularMontos, IVA_RATE };
