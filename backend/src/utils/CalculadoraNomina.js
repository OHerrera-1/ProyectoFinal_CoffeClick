const ISSS_TASA_PCT = 3;
const AFP_TASA_PCT_X100 = 725; // 7.25% = 725 / 10000

const ISSS_TOPE_MENSUAL_C = 100000; // $1,000.00
const AFP_TOPE_MENSUAL_C = Math.round(
  parseFloat(process.env.AFP_TOPE_MENSUAL || '7045.06') * 100
);

const TABLA_RENTA_QUINCENAL = [
  { tramo: 'I',   desde: 0,      hasta: 27500,    pct: 0,  exceso: 0,      cuotaFija: 0 },
  { tramo: 'II',  desde: 27501,  hasta: 44762,    pct: 10, exceso: 27500,  cuotaFija: 883 },
  { tramo: 'III', desde: 44763,  hasta: 101905,   pct: 20, exceso: 44762,  cuotaFija: 3000 },
  { tramo: 'IV',  desde: 101906, hasta: Infinity, pct: 30, exceso: 101905, cuotaFija: 14428 },
];

const aCentavos = (valor) => Math.round(Number(valor) * 100);
const aDolares = (centavos) => centavos / 100;

const calcularISSS = (devengadoC) => {
  const baseC = Math.min(devengadoC, ISSS_TOPE_MENSUAL_C / 2);
  return Math.round((baseC * ISSS_TASA_PCT) / 100);
};

const calcularAFP = (devengadoC) => {
  const baseC = Math.min(devengadoC, Math.round(AFP_TOPE_MENSUAL_C / 2));
  return Math.round((baseC * AFP_TASA_PCT_X100) / 10000);
};

const calcularRenta = (gravableC) => {
  if (gravableC <= 0) return { retencionC: 0, tramo: 'I' };

  const fila = TABLA_RENTA_QUINCENAL.find(t => gravableC >= t.desde && gravableC <= t.hasta)
    || TABLA_RENTA_QUINCENAL[TABLA_RENTA_QUINCENAL.length - 1];

  if (fila.pct === 0) return { retencionC: 0, tramo: fila.tramo };

  const retencionC = fila.cuotaFija + Math.round(((gravableC - fila.exceso) * fila.pct) / 100);
  return { retencionC, tramo: fila.tramo };
};

const calcularBoletaQuincenal = (salarioMensual, proporcion = 1) => {
  const salarioC = aCentavos(salarioMensual);
  if (!Number.isFinite(salarioC) || salarioC <= 0) {
    const err = new Error('El salario mensual debe ser un número mayor a 0');
    err.status = 400;
    throw err;
  }
  if (!(proporcion > 0 && proporcion <= 1)) {
    const err = new Error('La proporción del periodo debe estar entre 0 y 1');
    err.status = 400;
    throw err;
  }

  const devengadoC = Math.round((salarioC / 2) * proporcion);
  const isssC = calcularISSS(devengadoC);
  const afpC = calcularAFP(devengadoC);
  const gravableC = devengadoC - isssC - afpC;
  const { retencionC, tramo } = calcularRenta(gravableC);

  const deduccionesC = isssC + afpC + retencionC;
  const netoC = devengadoC - deduccionesC;

  return {
    devengado: aDolares(devengadoC),
    isss: aDolares(isssC),
    afp: aDolares(afpC),
    base_renta: aDolares(gravableC),
    tramo_renta: tramo,
    renta: aDolares(retencionC),
    total_deducciones: aDolares(deduccionesC),
    salario_neto: aDolares(netoC),
  };
};

module.exports = {
  calcularBoletaQuincenal,
  calcularISSS,
  calcularAFP,
  calcularRenta,
  TABLA_RENTA_QUINCENAL,
  aCentavos,
  aDolares,
};