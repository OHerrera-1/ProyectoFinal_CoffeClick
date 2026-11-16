const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Planilla = sequelize.define('Planilla', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  anio: { type: DataTypes.INTEGER, allowNull: false },
  mes: { type: DataTypes.INTEGER, allowNull: false },
  quincena: { type: DataTypes.INTEGER, allowNull: false }, // 1 = días 1-15, 2 = 16-fin de mes
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
  estado: {
    type: DataTypes.ENUM('generada', 'pagada', 'anulada'),
    allowNull: false,
    defaultValue: 'generada',
  },
  total_devengado: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  total_isss: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  total_afp: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  total_renta: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  total_deducciones: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  total_neto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  fecha_pago: { type: DataTypes.DATE, allowNull: true },
},

{
  tableName: 'planillas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Planilla;