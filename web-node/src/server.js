const express = require('express');
const path = require('path');
const mioClient = require('./ice/mioClient');

const app = express();
const port = Number(process.env.PORT || 8080);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  res.json({ googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '' });
});

app.get('/api/positions', async (req, res) => {
  try {
    res.json(await mioClient.getCurrentPositions());
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.get('/api/stops', async (req, res) => {
  try {
    res.json(await mioClient.getStops());
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.get('/api/routes/:routeId/stops', async (req, res) => {
  try {
    res.json(await mioClient.getStopsByRoute(req.params.routeId));
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.get('/api/routes/:routeId/trace', async (req, res) => {
  try {
    res.json(await mioClient.getRouteTrace(req.params.routeId));
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.get('/api/metrics', async (req, res) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    res.json(await mioClient.getAverageSpeedByRouteAndMonth(year));
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.get('/events', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });

  const sendPositions = async () => {
    try {
      const positions = await mioClient.getCurrentPositions();
      res.write(`data: ${JSON.stringify(positions)}\n\n`);
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    }
  };

  await sendPositions();
  const timer = setInterval(sendPositions, 2000);
  req.on('close', () => clearInterval(timer));
});

app.listen(port, () => {
  console.log(`[WEB] Servidor NodeJS iniciado en http://localhost:${port}`);
  console.log('[WEB] Recuerde ejecutar npm run slice antes de npm start.');
});
