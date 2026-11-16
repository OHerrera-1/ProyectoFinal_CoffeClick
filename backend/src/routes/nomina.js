const express = require('express');
const router = express.Router();
const {
  obtenerEmpleados,
  obtenerEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
} = require('../controllers/empleadosController');
const {
  simularBoleta,
  generarPlanilla,
  obtenerPlanillas,
  obtenerPlanilla,
  obtenerBoleta,
  marcarPagada,
  anularPlanilla,
} = require('../controllers/nominaController');

router.get('/empleados', obtenerEmpleados);
router.get('/empleados/:id', obtenerEmpleado);
router.post('/empleados', crearEmpleado);
router.put('/empleados/:id', actualizarEmpleado);
router.delete('/empleados/:id', eliminarEmpleado);

router.post('/calcular', simularBoleta);

router.get('/planillas', obtenerPlanillas);
router.get('/planillas/:id', obtenerPlanilla);
router.get('/planillas/:id/boleta/:empleado_id', obtenerBoleta);
router.post('/planillas', generarPlanilla);
router.patch('/planillas/:id/pagar', marcarPagada);
router.patch('/planillas/:id/anular', anularPlanilla);

module.exports = router;