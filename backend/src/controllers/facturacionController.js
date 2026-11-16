const { sequelize } = require('../config/database');
const { Factura, DetalleFactura, Producto, Insumo, Receta, Cliente } = require('../models');
const { calcularMontos, normalizarItems } = require('../utils/ivaCalculator');
const { generarCorrelativo } = require('../utils/correlativoHelper');

const crearFactura = async (req, res, next) => {
  const { tipo, cliente_id, nombre_cliente, items, cajero_id } = req.body;

  if (!tipo || !['FCF', 'CCF'].includes(tipo)) {
    return res.status(400).json({ error: 'El tipo de factura debe ser FCF o CCF' });
  }

  if (tipo === 'CCF' && !cliente_id) {
    return res.status(400).json({ error: 'El CCF requiere un cliente registrado' });
  }

 let itemsNormalizados;
  try {
    itemsNormalizados = normalizarItems(items);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }

  const transaction = await sequelize.transaction();
  

  try {
    const productosIds = itemsNormalizados.map(i => i.producto_id);

    if (productos.length !== productosIds.length) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Uno o más productos no existen o están inactivos' });
    }

    const productosMap = {};
    productos.forEach(p => { productosMap[p.id] = p; });

     const itemsConPrecio = itemsNormalizados.map(item => ({
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
        if (producto.stock_actual !== null && parseFloat(producto.stock_actual) < item.cantidad) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Stock insuficiente del producto "${producto.nombre}"`,
            stock_disponible: producto.stock_actual,
            stock_requerido: item.cantidad,
          });
        }
      }
    }

    const { subtotal, iva_monto, total, lineas } = calcularMontos(itemsConPrecio, tipo);
  
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

    const detalles = lineas.map(linea => ({
      factura_id: factura.id,
      producto_id: linea.producto_id,
      nombre_producto: linea.nombre_producto,
      cantidad: linea.cantidad,
      precio_unitario: linea.precio_unitario,
      subtotal_linea: linea.subtotal_linea,
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
      } else {
        if (producto.stock_actual !== null) {
          await Producto.increment(
            { stock_actual: -item.cantidad },
            { where: { id: producto.id }, transaction }
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
      } else if (producto && producto.stock_actual !== null) {
        await Producto.increment(
          { stock_actual: detalle.cantidad },
          { where: { id: producto.id }, transaction }
        );
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
