const { sequelize } = require('../config/database');
const { Factura, DetalleFactura, Producto, Insumo, Receta, Cliente } = require('../models');
const { calcularMontos } = require('../utils/ivaCalculator');
const { generarCorrelativo } = require('../utils/correlativoHelper');

const crearFactura = async (req, res, next) => {
  const { tipo, cliente_id, nombre_cliente, items, cajero_id } = req.body;

  if (!tipo || !['FCF', 'CCF'].includes(tipo)) {
    return res.status(400).json({ error: 'El tipo de factura debe ser FCF o CCF' });
  }

  if (tipo === 'CCF' && !cliente_id) {
    return res.status(400).json({ error: 'El CCF requiere un cliente registrado' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un producto' });
  }

  const transaction = await sequelize.transaction();

  try {
    const productosIds = items.map(i => i.producto_id);
    const productos = await Producto.findAll({
      where: { id: productosIds, es_activo: true },
      include: [{ model: Receta, as: 'receta', include: [{ model: Insumo, as: 'insumo' }] }],
      transaction,
    });

    if (productos.length !== productosIds.length) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Uno o más productos no existen o están inactivos' });
    }

    const productosMap = {};
    productos.forEach(p => { productosMap[p.id] = p; });

    const itemsConPrecio = items.map(item => ({
      ...item,
      precio_unitario: parseFloat(productosMap[item.producto_id].precio_venta),
      nombre_producto: productosMap[item.producto_id].nombre,
    }));

    for (const item of itemsConPrecio) {
      const producto = productosMap[item.producto_id];
      if (producto.tipo === 'elaborado') {
        for (const recetaItem of producto.receta) {
          const cantidadNecesaria = recetaItem.cantidad * item.cantidad;
          const insumo = recetaItem.insumo;

          if (parseFloat(insumo.stock_actual) < cantidadNecesaria) {
            await transaction.rollback();
            return res.status(400).json({
              error: `Stock insuficiente de "${insumo.nombre}" para preparar "${producto.nombre}"`,
              stock_disponible: insumo.stock_actual,
              stock_requerido: cantidadNecesaria,
            });
          }
        }
      } else {
        const stockProducto = parseFloat(producto.precio_venta);
        if (typeof producto.stock_reventa !== 'undefined' && producto.stock_reventa < item.cantidad) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Stock insuficiente del producto "${producto.nombre}"`,
          });
        }
      }
    }

    const { subtotal, iva_monto, total } = calcularMontos(itemsConPrecio);

    const numero_correlativo = await generarCorrelativo(tipo, transaction);

    let clienteNombre = nombre_cliente || 'Consumidor Final';
    if (cliente_id) {
      const cliente = await Cliente.findByPk(cliente_id, { transaction });
      if (!cliente) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Cliente no encontrado' });
      }
      clienteNombre = cliente.nombre;
    }

    const factura = await Factura.create({
      tipo,
      numero_correlativo,
      cliente_id: cliente_id || null,
      nombre_cliente: clienteNombre,
      subtotal,
      iva_monto,
      total,
      cajero_id: cajero_id || null,
    }, { transaction });

    const detalles = itemsConPrecio.map(item => ({
      factura_id: factura.id,
      producto_id: item.producto_id,
      nombre_producto: item.nombre_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal_linea: parseFloat((item.precio_unitario * item.cantidad).toFixed(2)),
    }));

    await DetalleFactura.bulkCreate(detalles, { transaction });

    for (const item of itemsConPrecio) {
      const producto = productosMap[item.producto_id];
      if (producto.tipo === 'elaborado') {
        for (const recetaItem of producto.receta) {
          const cantidadDescontar = recetaItem.cantidad * item.cantidad;
          await Insumo.increment(
            { stock_actual: -cantidadDescontar },
            { where: { id: recetaItem.insumo_id }, transaction }
          );
        }
      }
    }

    await transaction.commit();

    const facturaCompleta = await Factura.findByPk(factura.id, {
      include: [
        { model: DetalleFactura, as: 'detalles' },
        { model: Cliente, as: 'cliente' },
      ],
    });

    return res.status(201).json(facturaCompleta);
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const obtenerFacturas = async (req, res, next) => {
  try {
    const { tipo, estado, fecha_inicio, fecha_fin } = req.query;
    const where = {};

    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (fecha_inicio || fecha_fin) {
      const { Op } = require('sequelize');
      where.fecha_emision = {};
      if (fecha_inicio) where.fecha_emision[Op.gte] = new Date(fecha_inicio);
      if (fecha_fin) where.fecha_emision[Op.lte] = new Date(fecha_fin);
    }

    const facturas = await Factura.findAll({
      where,
      include: [
        { model: DetalleFactura, as: 'detalles' },
        { model: Cliente, as: 'cliente' },
      ],
      order: [['fecha_emision', 'DESC']],
    });

    return res.json(facturas);
  } catch (error) {
    next(error);
  }
};

const obtenerFactura = async (req, res, next) => {
  try {
    const factura = await Factura.findByPk(req.params.id, {
      include: [
        { model: DetalleFactura, as: 'detalles' },
        { model: Cliente, as: 'cliente' },
      ],
    });

    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });

    return res.json(factura);
  } catch (error) {
    next(error);
  }
};

const anularFactura = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const factura = await Factura.findByPk(req.params.id, {
      include: [{ model: DetalleFactura, as: 'detalles' }],
      transaction,
    });

    if (!factura) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    if (factura.estado === 'anulada') {
      await transaction.rollback();
      return res.status(400).json({ error: 'La factura ya está anulada' });
    }

    for (const detalle of factura.detalles) {
      const producto = await Producto.findByPk(detalle.producto_id, {
        include: [{ model: Receta, as: 'receta' }],
        transaction,
      });

      if (producto && producto.tipo === 'elaborado') {
        for (const recetaItem of producto.receta) {
          const cantidadRestaurar = recetaItem.cantidad * detalle.cantidad;
          await Insumo.increment(
            { stock_actual: cantidadRestaurar },
            { where: { id: recetaItem.insumo_id }, transaction }
          );
        }
      }
    }

    factura.estado = 'anulada';
    await factura.save({ transaction });

    await transaction.commit();
    return res.json({ mensaje: 'Factura anulada exitosamente', factura });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  crearFactura,
  obtenerFacturas,
  obtenerFactura,
  anularFactura,
};
