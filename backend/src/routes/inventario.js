const express = require('express');
const router = express.Router();
const {
  obtenerInsumos,
  obtenerInsumo,
  crearInsumo,
  actualizarInsumo,
  eliminarInsumo,
  ajustarStock,
  obtenerAlertas,
} = require('../controllers/insumosController');
const {
  obtenerProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerReceta,
  guardarReceta,
  agregarIngrediente,
  eliminarIngrediente,
  ajustarStockReventa,
} = require('../controllers/productosController');

router.get('/alertas', obtenerAlertas);

router.get('/insumos', obtenerInsumos);
router.get('/insumos/:id', obtenerInsumo);
router.post('/insumos', crearInsumo);
router.put('/insumos/:id', actualizarInsumo);
router.delete('/insumos/:id', eliminarInsumo);
router.patch('/insumos/:id/ajustar-stock', ajustarStock);

router.get('/productos', obtenerProductos);
router.get('/productos/:id', obtenerProducto);
router.post('/productos', crearProducto);
router.put('/productos/:id', actualizarProducto);
router.delete('/productos/:id', eliminarProducto);
router.patch('/productos/:id/ajustar-stock', ajustarStockReventa);

router.get('/productos/:id/receta', obtenerReceta);
router.put('/productos/:id/receta', guardarReceta);
router.post('/productos/:id/receta', agregarIngrediente);
router.delete('/productos/:id/receta/:insumo_id', eliminarIngrediente);

module.exports = router;
