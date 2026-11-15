const { sequelize } = require('../config/database');
const { Producto, Receta, Insumo } = require('../models');

const obtenerProductos = async (req, res, next) => {
  try {
    const { tipo, solo_activos } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (solo_activos !== 'false') where.es_activo = true;

    const productos = await Producto.findAll({
      where,
      include: [{ model: Receta, as: 'receta', include: [{ model: Insumo, as: 'insumo' }] }],
      order: [['nombre', 'ASC']],
    });

    return res.json(productos);
  } catch (error) {
    next(error);
  }
};

const obtenerProducto = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ model: Receta, as: 'receta', include: [{ model: Insumo, as: 'insumo' }] }],
    });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json(producto);
  } catch (error) {
    next(error);
  }
};

const crearProducto = async (req, res, next) => {
  try {
    const { nombre, descripcion, tipo, categoria, precio_venta, stock_actual, stock_minimo } = req.body;

    if (!nombre || !tipo || !precio_venta) {
      return res.status(400).json({ error: 'nombre, tipo y precio_venta son requeridos' });
    }

    if (!['elaborado', 'reventa'].includes(tipo)) {
      return res.status(400).json({ error: 'tipo debe ser elaborado o reventa' });
    }

    const producto = await Producto.create({
      nombre,
      descripcion,
      tipo,
      categoria,
      precio_venta,
      stock_actual: tipo === 'reventa' ? (stock_actual ?? 0) : null,
      stock_minimo: tipo === 'reventa' ? (stock_minimo ?? 0) : null,
    });

    return res.status(201).json(producto);
  } catch (error) {
    next(error);
  }
};

const actualizarProducto = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    const { nombre, descripcion, categoria, precio_venta, stock_minimo, es_activo } = req.body;

    await producto.update({
      nombre: nombre ?? producto.nombre,
      descripcion: descripcion ?? producto.descripcion,
      categoria: categoria ?? producto.categoria,
      precio_venta: precio_venta ?? producto.precio_venta,
      stock_minimo: stock_minimo ?? producto.stock_minimo,
      es_activo: es_activo ?? producto.es_activo,
    });

    return res.json(producto);
  } catch (error) {
    next(error);
  }
};

const eliminarProducto = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    await producto.update({ es_activo: false });
    return res.json({ mensaje: 'Producto desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};

const obtenerReceta = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ model: Receta, as: 'receta', include: [{ model: Insumo, as: 'insumo' }] }],
    });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    if (producto.tipo !== 'elaborado') {
      return res.status(400).json({ error: 'Solo los productos elaborados tienen receta' });
    }
    return res.json(producto.receta);
  } catch (error) {
    next(error);
  }
};

const guardarReceta = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const producto = await Producto.findByPk(req.params.id, { transaction });
    if (!producto) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (producto.tipo !== 'elaborado') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Solo los productos elaborados tienen receta' });
    }

    const { ingredientes } = req.body;
    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Se requiere al menos un ingrediente' });
    }

    const insumosIds = ingredientes.map(i => i.insumo_id);
    const insumosExisten = await Insumo.count({ where: { id: insumosIds }, transaction });
    if (insumosExisten !== insumosIds.length) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Uno o más insumos no existen' });
    }

    await Receta.destroy({ where: { producto_id: producto.id }, transaction });

    const nuevaReceta = ingredientes.map(i => ({
      producto_id: producto.id,
      insumo_id: i.insumo_id,
      cantidad: i.cantidad,
    }));

    await Receta.bulkCreate(nuevaReceta, { transaction });
    await transaction.commit();

    const recetaActualizada = await Receta.findAll({
      where: { producto_id: producto.id },
      include: [{ model: Insumo, as: 'insumo' }],
    });

    return res.json(recetaActualizada);
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const agregarIngrediente = async (req, res, next) => {
  try {
    const { insumo_id, cantidad } = req.body;
    if (!insumo_id || !cantidad) {
      return res.status(400).json({ error: 'insumo_id y cantidad son requeridos' });
    }

    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    if (producto.tipo !== 'elaborado') {
      return res.status(400).json({ error: 'Solo los productos elaborados tienen receta' });
    }

    const insumo = await Insumo.findByPk(insumo_id);
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });

    const existente = await Receta.findOne({ where: { producto_id: producto.id, insumo_id } });
    if (existente) {
      await existente.update({ cantidad });
      return res.json(existente);
    }

    const item = await Receta.create({ producto_id: producto.id, insumo_id, cantidad });
    return res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

const eliminarIngrediente = async (req, res, next) => {
  try {
    const { id: producto_id, insumo_id } = req.params;

    const item = await Receta.findOne({ where: { producto_id, insumo_id } });
    if (!item) return res.status(404).json({ error: 'Ingrediente no encontrado en la receta' });

    await item.destroy();
    return res.json({ mensaje: 'Ingrediente eliminado de la receta' });
  } catch (error) {
    next(error);
  }
};

const ajustarStockReventa = async (req, res, next) => {
  try {
    const { cantidad, tipo } = req.body;
    if (!cantidad || !tipo || !['entrada', 'salida', 'ajuste'].includes(tipo)) {
      return res.status(400).json({ error: 'cantidad y tipo (entrada|salida|ajuste) son requeridos' });
    }

    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    if (producto.tipo !== 'reventa') {
      return res.status(400).json({ error: 'Solo se puede ajustar stock de productos de reventa' });
    }

    let nuevoStock;
    if (tipo === 'entrada') {
      nuevoStock = parseFloat(producto.stock_actual ?? 0) + parseFloat(cantidad);
    } else if (tipo === 'salida') {
      nuevoStock = parseFloat(producto.stock_actual ?? 0) - parseFloat(cantidad);
      if (nuevoStock < 0) {
        return res.status(400).json({ error: 'El ajuste resultaría en stock negativo' });
      }
    } else {
      nuevoStock = parseFloat(cantidad);
    }

    await producto.update({ stock_actual: nuevoStock });
    return res.json(producto);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerReceta,
  guardarReceta,
  agregarIngrediente,
  eliminarIngrediente,
  ajustarStockReventa,
};
