const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Planilla, DetallePlanilla, Empleado } = require('../models');
const { calcularBoletaQuincenal, aCentavos, aDolares } = require('../utils/nominaCalculator');

const MS_DIA = 24 * 60 * 60 * 1000;

const pad = (n) => String(n).padStart(2, '0');
const aFecha = (anio, mes, dia) => `${anio}-${pad(mes)}-${pad(dia)}`;
const aUTC = (fechaStr) => {
  const [y, m, d] = fechaStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};


const calcularPeriodo = (anio, mes, quincena) => {
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const diaInicio = quincena === 1 ? 1 : 16;
  const diaFin = quincena === 1 ? 15 : ultimoDia;
  return {
    fecha_inicio: aFecha(anio, mes, diaInicio),
    fecha_fin: aFecha(anio, mes, diaFin),
    dias_periodo: diaFin - diaInicio + 1,
  };
};


const simularBoleta = (req, res, next) => {
  try {
    const { salario_mensual } = req.body;
    if (salario_mensual === undefined) {
      return res.status(400).json({ error: 'salario_mensual es requerido' });
    }
    const boleta = calcularBoletaQuincenal(salario_mensual);
    return res.json({ salario_mensual: Number(salario_mensual), ...boleta });
  } catch (error) {
    next(error);
  }
};

const generarPlanilla = async (req, res, next) => {
  const anio = parseInt(req.body.anio, 10);
  const mes = parseInt(req.body.mes, 10);
  const quincena = parseInt(req.body.quincena, 10);

  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    return res.status(400).json({ error: 'anio inválido' });
  }
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    return res.status(400).json({ error: 'mes debe estar entre 1 y 12' });
  }
  if (![1, 2].includes(quincena)) {
    return res.status(400).json({ error: 'quincena debe ser 1 o 2' });
  }

  const { fecha_inicio, fecha_fin, dias_periodo } = calcularPeriodo(anio, mes, quincena);
  const transaction = await sequelize.transaction();

  try {

    const existente = await Planilla.findOne({
      where: { anio, mes, quincena, estado: ['generada', 'pagada'] },
      transaction,
    });
    if (existente) {
      await transaction.rollback();
      return res.status(409).json({
        error: `Ya existe una planilla ${existente.estado} para esa quincena (id ${existente.id})`,
      });
    }

    const empleados = await Empleado.findAll({
      where: { es_activo: true, fecha_contratacion: { [Op.lte]: fecha_fin } },
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
      transaction,
    });

    if (empleados.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'No hay empleados activos para esa quincena' });
    }

    const inicioMs = aUTC(fecha_inicio);
    const finMs = aUTC(fecha_fin);

    const totales = { devengado: 0, isss: 0, afp: 0, renta: 0, deducciones: 0, neto: 0 };
    const detalles = empleados.map((emp) => {
     
      const contratacionMs = aUTC(String(emp.fecha_contratacion));
      const desdeMs = Math.max(inicioMs, contratacionMs);
      const diasTrabajados = Math.round((finMs - desdeMs) / MS_DIA) + 1;
      const proporcion = diasTrabajados / dias_periodo;

      const b = calcularBoletaQuincenal(emp.salario_mensual, proporcion);

      totales.devengado += aCentavos(b.devengado);
      totales.isss += aCentavos(b.isss);
      totales.afp += aCentavos(b.afp);
      totales.renta += aCentavos(b.renta);
      totales.deducciones += aCentavos(b.total_deducciones);
      totales.neto += aCentavos(b.salario_neto);

      return {
        empleado_id: emp.id,
        nombre_empleado: `${emp.nombre} ${emp.apellido}`,
        cargo: emp.cargo,
        salario_mensual: emp.salario_mensual,
        dias_trabajados: diasTrabajados,
        devengado: b.devengado,
        isss: b.isss,
        afp: b.afp,
        renta: b.renta,
        total_deducciones: b.total_deducciones,
        salario_neto: b.salario_neto,
      };
    });

    const planilla = await Planilla.create({
      anio,
      mes,
      quincena,
      fecha_inicio,
      fecha_fin,
      total_devengado: aDolares(totales.devengado),
      total_isss: aDolares(totales.isss),
      total_afp: aDolares(totales.afp),
      total_renta: aDolares(totales.renta),
      total_deducciones: aDolares(totales.deducciones),
      total_neto: aDolares(totales.neto),
    }, { transaction });

    await DetallePlanilla.bulkCreate(
      detalles.map(d => ({ ...d, planilla_id: planilla.id })),
      { transaction }
    );

    await transaction.commit();

    const completa = await Planilla.findByPk(planilla.id, {
      include: [{ model: DetallePlanilla, as: 'detalles' }],
    });
    return res.status(201).json(completa);
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const obtenerPlanillas = async (req, res, next) => {
  try {
    const { anio, mes, estado } = req.query;
    const where = {};
    if (anio) where.anio = parseInt(anio, 10);
    if (mes) where.mes = parseInt(mes, 10);
    if (estado) where.estado = estado;

    const planillas = await Planilla.findAll({
      where,
      order: [['anio', 'DESC'], ['mes', 'DESC'], ['quincena', 'DESC']],
    });
    return res.json(planillas);
  } catch (error) {
    next(error);
  }
};

const obtenerPlanilla = async (req, res, next) => {
  try {
    const planilla = await Planilla.findByPk(req.params.id, {
      include: [{ model: DetallePlanilla, as: 'detalles' }],
    });
    if (!planilla) return res.status(404).json({ error: 'Planilla no encontrada' });
    return res.json(planilla);
  } catch (error) {
    next(error);
  }
};

const obtenerBoleta = async (req, res, next) => {
  try {
    const planilla = await Planilla.findByPk(req.params.id);
    if (!planilla) return res.status(404).json({ error: 'Planilla no encontrada' });

    const detalle = await DetallePlanilla.findOne({
      where: { planilla_id: planilla.id, empleado_id: req.params.empleado_id },
    });
    if (!detalle) {
      return res.status(404).json({ error: 'El empleado no está en esa planilla' });
    }

    return res.json({
      planilla: {
        id: planilla.id,
        anio: planilla.anio,
        mes: planilla.mes,
        quincena: planilla.quincena,
        fecha_inicio: planilla.fecha_inicio,
        fecha_fin: planilla.fecha_fin,
        estado: planilla.estado,
      },
      boleta: detalle,
    });
  } catch (error) {
    next(error);
  }
};

const cambiarEstado = (estadoNuevo, mensaje) => async (req, res, next) => {
  try {
    const planilla = await Planilla.findByPk(req.params.id);
    if (!planilla) return res.status(404).json({ error: 'Planilla no encontrada' });

    if (planilla.estado !== 'generada') {
      return res.status(400).json({
        error: `Solo se puede cambiar una planilla en estado "generada" (actual: "${planilla.estado}")`,
      });
    }

    planilla.estado = estadoNuevo;
    if (estadoNuevo === 'pagada') planilla.fecha_pago = new Date();
    await planilla.save();

    return res.json({ mensaje, planilla });
  } catch (error) {
    next(error);
  }
};

const marcarPagada = cambiarEstado('pagada', 'Planilla marcada como pagada');
const anularPlanilla = cambiarEstado('anulada', 'Planilla anulada exitosamente');

module.exports = {
  simularBoleta,
  generarPlanilla,
  obtenerPlanillas,
  obtenerPlanilla,
  obtenerBoleta,
  marcarPagada,
  anularPlanilla,
};