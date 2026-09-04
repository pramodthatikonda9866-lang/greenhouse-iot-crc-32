const express = require('express');
const { SimulationRun, Sensor, Packet } = require('../config/database');

function createSimulationRoutes(simulator) {
  const router = express.Router();

  // POST /api/simulation/start
  router.post('/start', async (req, res) => {
    try {
      const {
        sensorCount = 101,
        packetsPerSensor = 50,
        rateMs = 200,
        corruptionRate = 0.05,
        lossRate = 0.0,
        seed = null,
        continuous = false
      } = req.body;

      const result = await simulator.start({
        sensorCount: Number(sensorCount),
        packetsPerSensor: Number(packetsPerSensor),
        rateMs: Number(rateMs),
        corruptionRate: Number(corruptionRate),
        lossRate: Number(lossRate),
        seed: seed || null,
        continuous: Boolean(continuous)
      });

      res.status(200).json({ success: true, ...result });
    } catch (err) {
      console.error('Error starting simulation:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/simulation/stop
  router.post('/stop', async (req, res) => {
    try {
      const result = await simulator.stop();
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/simulation/reset
  router.post('/reset', (req, res) => {
    try {
      const result = simulator.reset();
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/simulation/current
  router.get('/current', (req, res) => {
    res.status(200).json({
      success: true,
      data: simulator.getState()
    });
  });

  // GET /api/simulation/runs
  router.get('/runs', async (req, res) => {
    try {
      const runs = await SimulationRun.find().sort({ createdAt: -1 }).limit(30);
      res.status(200).json({ success: true, data: runs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/simulation/:id
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const run = await SimulationRun.findOne({ runId: id });
      if (!run) {
        return res.status(404).json({ success: false, error: 'Simulation run not found' });
      }
      const sensors = await Sensor.find({ runId: id }).sort({ sensorId: 1 });
      const recentPackets = await Packet.find({ runId: id }).sort({ createdAt: -1 }).limit(50);

      res.status(200).json({
        success: true,
        data: {
          run,
          sensors,
          recentPackets
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = createSimulationRoutes;
