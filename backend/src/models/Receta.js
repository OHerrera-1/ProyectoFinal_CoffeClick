const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Receta = sequelize.define('Receta', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  insumo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
  },
}, {
  tableName: 'recetas',
  timestamps: false,
});

module.exports = Receta;
