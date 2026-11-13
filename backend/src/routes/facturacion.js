const express = require('express');
const router = express.Router();
const {
  crearFactura,
  obtenerFacturas,
  obtenerFactura,
  anularFactura,
} = require('../controllers/facturacionController');

router.get('/', obtenerFacturas);
router.get('/:id', obtenerFactura);
router.post('/', crearFactura);
router.patch('/:id/anular', anularFactura);

module.exports = router;
