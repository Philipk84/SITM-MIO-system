const IcePackage = require('ice');
const Ice = IcePackage.Ice || IcePackage;

function loadMioNamespace() {
  const generated = require('./generated/Mio.js');
  const namespace = generated.mio || generated.Mio || global.mio || generated;
  if (!namespace || !namespace.MioServicePrx) {
    throw new Error('No se encontro MioServicePrx. Ejecute primero: npm run slice');
  }
  return namespace;
}

let communicator = null;
let proxy = null;

async function getProxy() {
  if (proxy) return proxy;

  const mio = loadMioNamespace();
  const proxyText = process.env.ICE_PROXY || 'MioService:tcp -h 127.0.0.1 -p 10000';

  communicator = Ice.initialize([]);
  const base = communicator.stringToProxy(proxyText);
  proxy = await mio.MioServicePrx.checkedCast(base);

  if (!proxy) {
    throw new Error(`No se pudo conectar al backend CCO por ICE: ${proxyText}`);
  }

  return proxy;
}

async function getCurrentPositions() {
  const service = await getProxy();
  return Array.from(await service.getCurrentPositions());
}

async function getStops() {
  const service = await getProxy();
  return Array.from(await service.getStops());
}

async function getStopsByRoute(routeId) {
  const service = await getProxy();
  return Array.from(await service.getStopsByRoute(routeId));
}

async function getRouteTrace(routeId) {
  const service = await getProxy();
  return Array.from(await service.getRouteTrace(routeId));
}

async function getAverageSpeedByRouteAndMonth(year) {
  const service = await getProxy();
  return Array.from(await service.getAverageSpeedByRouteAndMonth(year));
}

module.exports = {
  getCurrentPositions,
  getStops,
  getStopsByRoute,
  getRouteTrace,
  getAverageSpeedByRouteAndMonth
};
