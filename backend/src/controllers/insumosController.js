const { Op } = require('sequelize');
const { Insumo } = require('../models');

const obtenerInsumos = async (req, res, next) => {
  try {
    const { solo_activos } = req.query;
    const where = {};
    if (solo_activos !== 'false') where.es_activo = true;

    const insumos = await Insumo.findAll({ where, order: [['nombre', 'ASC']] });
    return res.json(insumos);
  } catch (error) {
    next(error);
  }
};

const obtenerInsumo = async (req, res, next) => {
  try {
    const insumo = await Insumo.findByPk(req.params.id);
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });
    return res.json(insumo);
  } catch (error) {
    next(error);
  }
};

const crearInsumo = async (req, res, next) => {
  try {
    const { nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario } = req.body;

    if (!nombre || !unidad_medida) {
      return res.status(400).json({ error: 'nombre y unidad_medida son requeridos' });
    }

    const insumo = await Insumo.create({
      nombre,
      unidad_medida,
      stock_actual: stock_actual ?? 0,
      stock_minimo: stock_minimo ?? 0,
      costo_unitario: costo_unitario ?? 0,
    });

    return res.status(201).json(insumo);
  } catch (error) {
    next(error);
  }
};

const actualizarInsumo = async (req, res, next) => {
  try {
    const insumo = await Insumo.findByPk(req.params.id);
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });

    const { nombre, unidad_medida, stock_minimo, costo_unitario } = req.body;

    await insumo.update({
      nombre: nombre ?? insumo.nombre,
      unidad_medida: unidad_medida ?? insumo.unidad_medida,
      stock_minimo: stock_minimo ?? insumo.stock_minimo,
      costo_unitario: costo_unitario ?? insumo.costo_unitario,
    });

    return res.json(insumo);
  } catch (error) {
    next(error);
  }
};

const eliminarInsumo = async (req, res, next) => {
  try {
    const insumo = await Insumo.findByPk(req.params.id);
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });

    await insumo.update({ es_activo: false });
    return res.json({ mensaje: 'Insumo desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};

const ajustarStock = async (req, res, next) => {
  try {
    const { cantidad, tipo } = req.body;

    if (!cantidad || !tipo || !['entrada', 'salida', 'ajuste'].includes(tipo)) {
      return res.status(400).json({ error: 'cantidad y tipo (entrada|salida|ajuste) son requeridos' });
    }

    const insumo = await Insumo.findByPk(req.params.id);
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });

    let nuevoStock;
    if (tipo === 'entrada') {
      nuevoStock = parseFloat(insumo.stock_actual) + parseFloat(cantidad);
    } else if (tipo === 'salida') {
      nuevoStock = parseFloat(insumo.stock_actual) - parseFloat(cantidad);
      if (nuevoStock < 0) {
        return res.status(400).json({ error: 'El ajuste resultaría en stock negativo' });
      }
    } else {
      nuevoStock = parseFloat(cantidad);
    }

    await insumo.update({ stock_actual: nuevoStock });
    return res.json(insumo);
  } catch (error) {
    next(error);
  }
};

const obtenerAlertas = async (req, res, next) => {
  try {
    const insumos = await Insumo.findAll({
      where: {
        es_activo: true,
        stock_actual: { [Op.lte]: Insumo.sequelize.col('stock_minimo') },
      },
      order: [['stock_actual', 'ASC']],
    });

    return res.json({ total: insumos.length, insumos });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerInsumos,
  obtenerInsumo,
  crearInsumo,
  actualizarInsumo,
  eliminarInsumo,
  ajustarStock,
  obtenerAlertas,
};
