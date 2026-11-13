const { Factura } = require('../models');
const { Op } = require('sequelize');

const generarCorrelativo = async (tipo, transaction) => {
  const year = new Date().getFullYear();
  const prefix = `${tipo}-${year}-`;

  const ultima = await Factura.findOne({
    where: {
      numero_correlativo: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['id', 'DESC']],
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
    transaction,
  });

  let siguiente = 1;
  if (ultima) {
    const partes = ultima.numero_correlativo.split('-');
    siguiente = parseInt(partes[partes.length - 1], 10) + 1;
  }

  const numero = String(siguiente).padStart(6, '0');
  return `${prefix}${numero}`;
};

module.exports = { generarCorrelativo };
