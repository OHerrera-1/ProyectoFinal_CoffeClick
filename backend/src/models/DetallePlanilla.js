const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DetallePlanilla = sequelize.define('DetallePlanilla', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  planilla_id: { type: DataTypes.INTEGER, allowNull: false },
  empleado_id: { type: DataTypes.INTEGER, allowNull: false },
  nombre_empleado: { type: DataTypes.STRING(200), allowNull: false },
  cargo: { type: DataTypes.STRING(30), allowNull: false },
  salario_mensual: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  dias_trabajados: { type: DataTypes.INTEGER, allowNull: false },
  devengado: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  isss: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  afp: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  renta: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  total_deducciones: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  salario_neto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, 

{
  tableName: 'detalle_planillas',
  timestamps: false,
});

module.exports = DetallePlanilla;