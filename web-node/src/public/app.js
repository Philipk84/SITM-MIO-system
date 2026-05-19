let map;
let directionsService;
const busMarkers = new Map();
const stopMarkers = [];
const routeRenderers = new Map();
const routeFallbackLines = new Map();
const routeLabelMarkers = new Map();
const routeStops = new Map();
const routeColors = new Map();

const caliCenter = { lat: 3.451646, lng: -76.532013 };
const colors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#be123c', '#4f46e5'];

async function main() {
  const config = await fetch('/api/config').then(r => r.json());
  if (!config.googleMapsApiKey) {
    setStatus('Falta configurar GOOGLE_MAPS_API_KEY antes de iniciar NodeJS.');
    return;
  }

  await loadGoogleMaps(config.googleMapsApiKey);
  initMap();
  await loadStopsAndRoutes();
  await drawAllRoutes();
  connectRealtimePositions();
  await loadMetrics();

  document.getElementById('drawRouteBtn').addEventListener('click', drawSelectedRoute);
  document.getElementById('drawAllRoutesBtn').addEventListener('click', drawAllRoutes);
  document.getElementById('loadMetricsBtn').addEventListener('click', loadMetrics);
}

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    window.__initGoogleMaps = resolve;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=__initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: caliCenter,
    zoom: 13,
    mapTypeControl: false,
    streetViewControl: false
  });
  directionsService = new google.maps.DirectionsService();
  setStatus('Mapa de Cali cargado. Las rutas se consultan con Google Directions para seguir las calles.');
}

async function loadStopsAndRoutes() {
  const stops = await fetch('/api/stops').then(r => r.json());
  if (stops.error) throw new Error(stops.error);

  routeStops.clear();
  stops.forEach(stop => {
    if (!routeStops.has(stop.routeId)) routeStops.set(stop.routeId, []);
    routeStops.get(stop.routeId).push(stop);
  });
  routeStops.forEach(list => list.sort((a, b) => a.order - b.order));

  Array.from(routeStops.keys()).sort().forEach((routeId, index) => {
    routeColors.set(routeId, colors[index % colors.length]);
  });

  fillRouteSelector();
  drawLegend();
  drawStopMarkers(stops);
}

function fillRouteSelector() {
  const select = document.getElementById('routeId');
  select.innerHTML = '';
  Array.from(routeStops.keys()).sort().forEach(routeId => {
    const option = document.createElement('option');
    option.value = routeId;
    option.textContent = `Ruta ${routeId}`;
    select.appendChild(option);
  });
}

function drawLegend() {
  const legend = document.getElementById('legend');
  legend.innerHTML = '';
  Array.from(routeStops.keys()).sort().forEach(routeId => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<span class="legend-color" style="background:${routeColors.get(routeId)}"></span>Ruta ${routeId}`;
    legend.appendChild(item);
  });
}

function drawStopMarkers(stops) {
  stopMarkers.forEach(marker => marker.setMap(null));
  stopMarkers.length = 0;

  stops.forEach(stop => {
    const color = routeColors.get(stop.routeId) || '#0f766e';
    const marker = new google.maps.Marker({
      map,
      position: { lat: stop.lat, lng: stop.lng },
      title: `${stop.routeId} - ${stop.name}`,
      label: { text: String(stop.order), color: '#ffffff', fontSize: '11px', fontWeight: '700' },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: color,
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff'
      }
    });
    stopMarkers.push(marker);
  });
}

function connectRealtimePositions() {
  const events = new EventSource('/events');
  events.onmessage = event => {
    const positions = JSON.parse(event.data);
    updateBusMarkers(positions);
  };
  events.addEventListener('error', () => {
    setStatus('No se pudieron actualizar posiciones. Verifique que el CCO esté corriendo.');
  });
}

function updateBusMarkers(positions) {
  positions.forEach(position => {
    const latLng = { lat: position.lat, lng: position.lng };
    const color = routeColors.get(position.routeId) || '#dc2626';
    let marker = busMarkers.get(position.busId);
    if (!marker) {
      marker = new google.maps.Marker({
        map,
        position: latLng,
        title: `${position.busId} / Ruta ${position.routeId}`,
        label: { text: position.busId, color: '#111827', fontSize: '11px', fontWeight: '700' },
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: color,
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff'
        }
      });
      busMarkers.set(position.busId, marker);
    } else {
      marker.setPosition(latLng);
      marker.setTitle(`${position.busId} / Ruta ${position.routeId} / ${position.timestamp}`);
      marker.setIcon({
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 7,
        fillColor: color,
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff'
      });
    }
  });
  setStatus(`Buses en tiempo real: ${positions.length}. Cada bus usa el color de su ruta.`);
}

async function drawAllRoutes() {
  clearAllRoutes();
  const routeIds = Array.from(routeStops.keys()).sort();
  for (const routeId of routeIds) {
    await drawRoute(routeId, { clearPrevious: false, fit: false });
    await sleep(250);
  }
  fitAllStops();
  setStatus(`Se dibujaron ${routeIds.length} rutas diferenciadas. Si el simulador ya envió datagramas, se usan como trazado adicional.`);
}

async function drawSelectedRoute() {
  const routeId = document.getElementById('routeId').value.trim();
  if (!routeId) return;
  clearAllRoutes();
  await drawRoute(routeId, { clearPrevious: false, fit: true });
}

async function drawRoute(routeId, options = {}) {
  const stops = routeStops.get(routeId) || [];
  if (stops.length < 2) {
    setStatus(`La ruta ${routeId} necesita al menos dos paradas para dibujarse.`);
    return;
  }

  const trace = await fetch(`/api/routes/${encodeURIComponent(routeId)}/trace`).then(r => r.json()).catch(() => []);
  const validTrace = Array.isArray(trace) && !trace.error ? trace : [];
  const pathSource = validTrace.length >= 3 ? simplifyPoints(validTrace, 24) : stops;
  const color = routeColors.get(routeId) || '#2563eb';

  try {
    await drawDirectionsByChunks(routeId, pathSource, color);
    addRouteLabel(routeId, stops, color);
    if (options.fit) fitPoints(stops);
    setStatus(`Ruta ${routeId} dibujada siguiendo calles con Google Directions.`);
  } catch (error) {
    drawPolylineFallback(routeId, pathSource, color);
    addRouteLabel(routeId, stops, color);
    if (options.fit) fitPoints(stops);
    setStatus(`Ruta ${routeId} dibujada con trazado local. Google Directions respondió: ${error.message}`);
  }
}

function drawDirectionsByChunks(routeId, points, color) {
  const chunks = makeDirectionChunks(points, 25);
  const renderers = [];
  routeRenderers.set(routeId, renderers);

  return chunks.reduce((promise, chunk) => promise.then(() => requestDirection(chunk, color).then(renderer => {
    renderers.push(renderer);
  })), Promise.resolve());
}

function requestDirection(points, color) {
  const origin = toLatLng(points[0]);
  const destination = toLatLng(points[points.length - 1]);
  const waypoints = points.slice(1, -1).map(p => ({ location: toLatLng(p), stopover: true }));

  return new Promise((resolve, reject) => {
    directionsService.route({
      origin,
      destination,
      waypoints,
      optimizeWaypoints: false,
      travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
      if (status === 'OK') {
        const renderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: color,
            strokeOpacity: 0.85,
            strokeWeight: 5
          }
        });
        renderer.setDirections(response);
        resolve(renderer);
      } else {
        reject(new Error(status));
      }
    });
  });
}

function drawPolylineFallback(routeId, points, color) {
  const line = new google.maps.Polyline({
    path: points.map(toLatLng),
    geodesic: false,
    strokeColor: color,
    strokeOpacity: 0.9,
    strokeWeight: 4,
    map
  });
  routeFallbackLines.set(routeId, line);
}

function addRouteLabel(routeId, stops, color) {
  const middle = stops[Math.floor(stops.length / 2)];
  const marker = new google.maps.Marker({
    map,
    position: { lat: middle.lat, lng: middle.lng },
    title: `Ruta ${routeId}`,
    label: { text: `Ruta ${routeId}`, color, fontSize: '15px', fontWeight: '900' },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 0,
      fillOpacity: 0,
      strokeOpacity: 0
    }
  });
  routeLabelMarkers.set(routeId, marker);
}

function clearAllRoutes() {
  routeRenderers.forEach(renderers => renderers.forEach(renderer => renderer.setMap(null)));
  routeRenderers.clear();
  routeFallbackLines.forEach(line => line.setMap(null));
  routeFallbackLines.clear();
  routeLabelMarkers.forEach(marker => marker.setMap(null));
  routeLabelMarkers.clear();
}

function makeDirectionChunks(points, maxPoints) {
  const chunks = [];
  let start = 0;
  while (start < points.length - 1) {
    const end = Math.min(start + maxPoints - 1, points.length - 1);
    chunks.push(points.slice(start, end + 1));
    start = end;
  }
  return chunks;
}

function simplifyPoints(points, maxPoints) {
  if (points.length <= maxPoints) return points;
  const result = [points[0]];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 1; i < maxPoints - 1; i++) {
    result.push(points[Math.round(i * step)]);
  }
  result.push(points[points.length - 1]);
  return result;
}

function toLatLng(point) {
  return { lat: point.lat, lng: point.lng };
}

function fitAllStops() {
  const all = Array.from(routeStops.values()).flat();
  fitPoints(all);
}

function fitPoints(points) {
  const bounds = new google.maps.LatLngBounds();
  points.forEach(p => bounds.extend(toLatLng(p)));
  map.fitBounds(bounds);
}

async function loadMetrics() {
  const rows = await fetch('/api/metrics?year=2025').then(r => r.json());
  const body = document.getElementById('metricsBody');
  body.innerHTML = '';

  if (rows.error) {
    body.innerHTML = `<tr><td colspan="4">${rows.error}</td></tr>`;
    return;
  }

  rows.forEach(row => {
    const color = routeColors.get(row.routeId) || '#64748b';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="route-pill" style="background:${color}">${row.routeId}</span></td>
      <td>${row.month}</td>
      <td>${row.averageSpeedKmh.toFixed(2)}</td>
      <td>${row.samples}</td>
    `;
    body.appendChild(tr);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setStatus(message) {
  document.getElementById('status').textContent = message;
}

main().catch(error => setStatus(error.message));
