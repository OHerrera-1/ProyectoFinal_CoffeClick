const { Empleado } = require('../models');

const CARGOS = ['barista', 'cajero', 'gerente'];
const DUI_REGEX = /^\d{8}-\d$/;

const validarSalario = (salario) => {
  const n = Number(salario);
  return Number.isFinite(n) && n > 0;
};

const obtenerEmpleados = async (req, res, next) => {
  try {
    const { cargo, solo_activos } = req.query;
    const where = {};
    if (cargo) where.cargo = cargo;
    if (solo_activos !== 'false') where.es_activo = true;

    const empleados = await Empleado.findAll({
      where,
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
    });
    return res.json(empleados);
  } catch (error) {
    next(error);
  }
};

const obtenerEmpleado = async (req, res, next) => {
  try {
    const empleado = await Empleado.findByPk(req.params.id);
    if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });
    return res.json(empleado);
  } catch (error) {
    next(error);
  }
};

const crearEmpleado = async (req, res, next) => {
  try {
    const {
      nombre, apellido, dui, nit, cargo, salario_mensual,
      fecha_contratacion, telefono, email,
    } = req.body;

    if (!nombre || !apellido || !cargo || salario_mensual === undefined) {
      return res.status(400).json({
        error: 'nombre, apellido, cargo y salario_mensual son requeridos',
      });
    }
    if (!CARGOS.includes(cargo)) {
      return res.status(400).json({ error: 'cargo debe ser barista, cajero o gerente' });
    }
    if (!validarSalario(salario_mensual)) {
      return res.status(400).json({ error: 'salario_mensual debe ser un número mayor a 0' });
    }
    if (dui && !DUI_REGEX.test(dui)) {
      return res.status(400).json({ error: 'El DUI debe tener el formato 00000000-0' });
    }

    const empleado = await Empleado.create({
      nombre,
      apellido,
      dui: dui || null,
      nit,
      cargo,
      salario_mensual,
      fecha_contratacion: fecha_contratacion || undefined,
      telefono,
      email,
    });

    return res.status(201).json(empleado);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ya existe un empleado con ese DUI' });
    }
    next(error);
  }
};

const actualizarEmpleado = async (req, res, next) => {
  try {
    const empleado = await Empleado.findByPk(req.params.id);
    if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });

    const {
      nombre, apellido, dui, nit, cargo, salario_mensual,
      fecha_contratacion, telefono, email,
    } = req.body;

    if (cargo !== undefined && !CARGOS.includes(cargo)) {
      return res.status(400).json({ error: 'cargo debe ser barista, cajero o gerente' });
    }
    if (salario_mensual !== undefined && !validarSalario(salario_mensual)) {
      return res.status(400).json({ error: 'salario_mensual debe ser un número mayor a 0' });
    }
    if (dui && !DUI_REGEX.test(dui)) {
      return res.status(400).json({ error: 'El DUI debe tener el formato 00000000-0' });
    }

    await empleado.update({
      nombre: nombre ?? empleado.nombre,
      apellido: apellido ?? empleado.apellido,
      dui: dui ?? empleado.dui,
      nit: nit ?? empleado.nit,
      cargo: cargo ?? empleado.cargo,
      salario_mensual: salario_mensual ?? empleado.salario_mensual,
      fecha_contratacion: fecha_contratacion ?? empleado.fecha_contratacion,
      telefono: telefono ?? empleado.telefono,
      email: email ?? empleado.email,
    });

    return res.json(empleado);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ya existe un empleado con ese DUI' });
    }
    next(error);
  }
};

// Baja lógica: sus planillas anteriores se conservan
const eliminarEmpleado = async (req, res, next) => {
  try {
    const empleado = await Empleado.findByPk(req.params.id);
    if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });

    await empleado.update({ es_activo: false });
    return res.json({ mensaje: 'Empleado dado de baja correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerEmpleados,
  obtenerEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
};