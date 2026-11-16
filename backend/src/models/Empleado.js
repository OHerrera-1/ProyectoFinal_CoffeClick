const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Empleado = sequelize.define('Empleado', {
    id: { type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true },

    nombre: { type: DataTypes.STRING(100), allowNull: false },
    apellido: { type: DataTypes.STRING(100), allowNull: false },
    dui: { type: DataTypes.STRING(10), allowNull: true, unique: true },
    nit: { type: DataTypes.STRING(20), allowNull: true },
    cargo: { type: DataTypes.ENUM('barista', 'cajero', 'gerente'), allowNull: false },
    salario_mensual: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    fecha_contratacion: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    telefono: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(100), allowNull: true },
    es_activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, 

{
  tableName: 'empleados',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});
