// Alineado con modelos Factura, Producto e Insumo del backend
export const KPIS_DIA = [
  { id: 'ventas', label: 'Ventas del dia (c/IVA)', value: '$486.50', trend: '+13% vs ayer' },
  { id: 'facturas', label: 'Facturas emitidas', value: '64', trend: 'Ticket prom. $7.60' },
  { id: 'estrella', label: 'Producto estrella', value: 'Caramel Latte', trend: '28 unidades hoy' },
  { id: 'alertas', label: 'Insumos stock bajo', value: '2', trend: 'Requieren reposicion' },
];

export const PRODUCTOS_ESTRELLA = [
  {
    id: 1,
    nombre: 'Caramel Gold Latte',
    categoria: 'Espresso Bar',
    descripcion: 'Doble shot de espresso salvadoreno, leche vaporizada sedosa y caramelo artesanal.',
    precio: 3.75,
    vendidosHoy: 28,
  },
  {
    id: 2,
    nombre: 'Cold Brew Botanico',
    categoria: 'Filtrados Frios',
    descripcion: 'Extraccion en frio de 18 horas con notas de cacao tostado y piel de naranja.',
    precio: 4.10,
    vendidosHoy: 19,
  },
  {
    id: 3,
    nombre: 'Flat White Pacamara',
    categoria: 'Especialidad',
    descripcion: 'Grano de altura de Apaneca con microespuma aterciopelada.',
    precio: 3.50,
    vendidosHoy: 22,
  },
  {
    id: 4,
    nombre: 'Croissant de Almendras',
    categoria: 'Panaderia',
    descripcion: 'Hojaldre recien horneado con crema frangipane y laminas tostadas.',
    precio: 3.25,
    vendidosHoy: 17,
  },
];

export const INSUMOS_INICIALES = [
  { id: 1, nombre: 'Cafe en Grano Pacamara', categoria: 'Cafe', stock_actual: 18, stock_minimo: 8, unidad: 'kg' },
  { id: 2, nombre: 'Leche Entera Fresca', categoria: 'Lacteos', stock_actual: 12, stock_minimo: 15, unidad: 'litros' },
  { id: 3, nombre: 'Sirope Caramel Gold', categoria: 'Endulzantes', stock_actual: 9, stock_minimo: 4, unidad: 'botellas' },
  { id: 4, nombre: 'Vasos Biodegradables 12oz', categoria: 'Empaques', stock_actual: 140, stock_minimo: 200, unidad: 'unidades' },
  { id: 5, nombre: 'Leche de Avena Barista', categoria: 'Lacteos', stock_actual: 14, stock_minimo: 6, unidad: 'litros' },
  { id: 6, nombre: 'Cacao Organico en Polvo', categoria: 'Insumos', stock_actual: 5, stock_minimo: 2, unidad: 'kg' },
];
