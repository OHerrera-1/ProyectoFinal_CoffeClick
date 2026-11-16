require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./src/config/database');
const inventarioRoutes = require('./src/routes/inventario'); //Linea Duplicada
const nominaRoutes = require('./src/routes/nomina');  
require('./src/models/index');

const facturacionRoutes = require('./src/routes/facturacion');
const inventarioRoutes = require('./src/routes/inventario'); //Linea Duplicada
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/facturacion', facturacionRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/nomina', nominaRoutes); 

app.use(errorHandler);

sequelize.authenticate()
  .then(() => sequelize.sync({ alter: false }))
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error de conexión a la base de datos:', err);
    process.exit(1);
  });


  /**
 * ======================================================================================
 * AUDITORÍA TÉCNICA - BACKEND 
 * Revisión de cumplimiento según los requerimientos del PDF y buenas prácticas.
 * ======================================================================================
 */

// --------------------------------------------------------------------------------------
// 1. FALTAN 2 MÓDULOS CORE (Solo existen 3)
// --------------------------------------------------------------------------------------
// TODO: Implementar el módulo de Compras y Proveedores.
// const comprasRoutes = require('./src/routes/compras');
// app.use('/api/compras', comprasRoutes);
// - Lógica requerida: Registrar facturas de compra de insumos, que estas afecten 
//   el inventario (aumenten el stock) y generen cuentas por pagar.

// TODO: Implementar el módulo de Caja y Flujos.
// const cajaRoutes = require('./src/routes/caja');
// app.use('/api/caja', cajaRoutes);
// - Lógica requerida: Necesitas endpoints para aperturar turno, cerrar turno 
//   y hacer el cuadre (efectivo, tarjetas, pagos digitales).

// --------------------------------------------------------------------------------------
// 2. ACTUALIZACIÓN EN EL MANEJO DE ASINCRONÍA Y ERRORES
// --------------------------------------------------------------------------------------
// TODO: Cambiar el uso de .then() y .catch() en el arranque del servidor.
// - Refactorizar a async/await con try/catch para cumplir estrictamente con la rúbrica.
/*
const iniciarServidor = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: false });
        app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
    } catch (error) {
        console.error('Error de conexión a la base de datos:', error);
        process.exit(1);
    }
};
iniciarServidor();
*/

// --------------------------------------------------------------------------------------
// 3. LÓGICA COMPLEJA DE INVENTARIO 
// --------------------------------------------------------------------------------------
// TODO: Se necesitan más requerimientos para las tablas: 
// Productos, Insumos, Producto_Insumo.
// - Cuando se reciba la venta (endpoint de facturación), el backend debe buscar 
//   la receta del producto, multiplicar los insumos por la cantidad vendida y 
//   hacer un UPDATE restando el stock en la tabla de Insumos.
// - Implementar alertas cuando el stock caiga por debajo del mínimo.

// --------------------------------------------------------------------------------------
// 4. DISCREPANCIA CON EL ORM
// --------------------------------------------------------------------------------------
// ADVERTENCIA: El package.json tiene Sequelize instalado (y pg, pg-hstore).
// - Si el docente exige estrictamente Prisma (según la imagen guía), debes 
//   rehacer la carpeta src/config/database.js, reestructurar los modelos y 
//   cambiar las dependencias en el package.json.
// - Si Sequelize está permitido, ignorar este comentario pero prepárate para 
//   defender la elección en la defensa oral.

// --------------------------------------------------------------------------------------
// 5. ESTRUCTURA DEL PROYECTO (Separación de Responsabilidades)
// --------------------------------------------------------------------------------------
// TODO: Asegurar la siguiente arquitectura para la limpieza del código:
/*
/coffeclick-backend
│── /src
│   ├── /config
│   │   └── database.js       (
│   ├── /controllers          
│   │   ├── facturacionController.js
│   │   ├── inventarioController.js
│   │   └── nominaController.js
│   ├── /models               
│   │   ├── index.js
│   │   ├── Producto.js
│   │   ├── Insumo.js
│   │   └── Receta.js
│   ├── /routes               
│   │   ├── facturacion.js
│   │   ├── inventario.js
│   │   └── nomina.js
│   └── /middlewares
│       └── errorHandler.js
│── .env                      
│── server.js
└── package.json
*/