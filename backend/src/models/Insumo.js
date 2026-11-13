const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Insumo = sequelize.define('Insumo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  unidad_medida: {
    type: DataTypes.ENUM('g', 'ml', 'unidad', 'kg', 'L'),
    allowNull: false,
  },
  stock_actual: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
    defaultValue: 0,
  },
  stock_minimo: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
    defaultValue: 0,
  },
  costo_unitario: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0,
  },
  es_activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'insumos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Insumo;
