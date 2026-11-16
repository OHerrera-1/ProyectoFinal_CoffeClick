const Cliente = require('./Cliente');
const Producto = require('./Producto');
const Insumo = require('./Insumo');
const Receta = require('./Receta');
const Factura = require('./Factura');
const DetalleFactura = require('./DetalleFactura');
const Empleado = require('./Empleado');
const Planilla = require('./Planilla');
const DetallePlanilla = require('./DetallePlanilla');

Factura.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Cliente.hasMany(Factura, { foreignKey: 'cliente_id', as: 'facturas' });

Factura.hasMany(DetalleFactura, { foreignKey: 'factura_id', as: 'detalles' });
DetalleFactura.belongsTo(Factura, { foreignKey: 'factura_id', as: 'factura' });

DetalleFactura.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Producto.hasMany(DetalleFactura, { foreignKey: 'producto_id', as: 'detalles_facturas' });

Producto.hasMany(Receta, { foreignKey: 'producto_id', as: 'receta' });
Receta.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

Receta.belongsTo(Insumo, { foreignKey: 'insumo_id', as: 'insumo' });
Insumo.hasMany(Receta, { foreignKey: 'insumo_id', as: 'recetas' });

Planilla.hasMany(DetallePlanilla, { foreignKey: 'planilla_id', as: 'detalles' });
DetallePlanilla.belongsTo(Planilla, { foreignKey: 'planilla_id', as: 'planilla' });

Empleado.hasMany(DetallePlanilla, { foreignKey: 'empleado_id', as: 'boletas' });
DetallePlanilla.belongsTo(Empleado, { foreignKey: 'empleado_id', as: 'empleado' });

module.exports = {
  Cliente,
  Producto,
  Insumo,
  Receta,
  Factura,
  DetalleFactura,
  Empleado,
  Planilla,
  DetallePlanilla,
};
