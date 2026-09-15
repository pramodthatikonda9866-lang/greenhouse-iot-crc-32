const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const { connectDatabase, dbServices } = require('./config/database');
const SensorSimulator = require('./engine/sensorSimulator');
const setupSocketIO = require('./sockets/packetSocket');

const createSimulationRoutes = require('./routes/simulationRoutes');
const createSensorRoutes = require('./routes/sensorRoutes');
const createPacketRoutes = require('./routes/packetRoutes');
const createAnalyticsRoutes = require('./routes/analyticsRoutes');
const createFileRoutes = require('./routes/fileRoutes');

const app = express();
const server = http.createServer(app);

// CORS configuration for REST & WebSocket
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 10000,
  pingInterval: 5000
});

// Create singleton simulator coordinator
const simulator = new SensorSimulator(io, dbServices);
setupSocketIO(io, simulator);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'Smart Greenhouse IoT Packet Reliability Monitor — CRC-32',
    timestamp: new Date().toISOString()
  });
});

// API Routes
const packetRouter = createPacketRoutes(simulator);
app.use('/api/simulation', createSimulationRoutes(simulator));
app.use('/api/sensors', createSensorRoutes(simulator));
app.use('/api/packets', packetRouter);
app.use('/api/packet', packetRouter);
app.use('/api/analytics', createAnalyticsRoutes(simulator));
app.use('/api/file', createFileRoutes());

// Serve frontend static build in production
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDatabase();
    simulator.initSensors(101);

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` IoT Sensor Packet Reliability Monitor (CRC-32) Server `);
      console.log(` Server running on port http://localhost:${PORT}        `);
      console.log(` WebSocket server initialized                           `);
      console.log(` 101 Virtual Sensors ready (S001 - S101)                `);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to bootstrap server:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

module.exports = { app, server, simulator };
