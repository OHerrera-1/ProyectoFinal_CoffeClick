const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Factura = sequelize.define('Factura', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tipo: {
    type: DataTypes.ENUM('FCF', 'CCF'),
    allowNull: false,
  },
  numero_correlativo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  fecha_emision: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  nombre_cliente: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  iva_monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('emitida', 'anulada'),
    allowNull: false,
    defaultValue: 'emitida',
  },
  cajero_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'facturas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Factura;
