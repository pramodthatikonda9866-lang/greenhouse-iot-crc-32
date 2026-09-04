const express = require('express');
const { Sensor, Packet } = require('../config/database');

function createSensorRoutes(simulator) {
  const router = express.Router();

  // GET /api/sensors - Returns all sensors from active simulator or last run
  router.get('/', async (req, res) => {
    try {
      const activeSensors = simulator.getSensorsArray();
      if (activeSensors.length > 0) {
        return res.status(200).json({ success: true, data: activeSensors });
      }

      // Fallback to latest DB sensors
      const latestRun = await Sensor.find().sort({ updatedAt: -1 }).limit(101);
      res.status(200).json({ success: true, data: latestRun });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/sensors/:id - Detailed sensor stats and recent packets
  router.get('/:id', async (req, res) => {
    try {
      const sensorId = req.params.id.toUpperCase();
      let sensorData = simulator.sensors.get(sensorId);

      let recentPackets = [];
      if (simulator.currentRunId) {
        recentPackets = simulator.recentPackets.filter(p => p.sensorId === sensorId).slice(0, 20);
      }

      if (!sensorData) {
        // Look in DB
        const dbSensor = await Sensor.findOne({ sensorId }).sort({ createdAt: -1 });
        if (!dbSensor) {
          return res.status(404).json({ success: false, error: 'Sensor not found' });
        }
        sensorData = dbSensor;
        recentPackets = await Packet.find({ sensorId }).sort({ createdAt: -1 }).limit(20);
      }

      res.status(200).json({
        success: true,
        data: {
          sensor: sensorData,
          packets: recentPackets
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PATCH /api/sensors/:id/toggle
  router.patch('/:id/toggle', (req, res) => {
    const sensorId = req.params.id.toUpperCase();
    const sensor = simulator.sensors.get(sensorId);
    if (!sensor) {
      return res.status(404).json({ success: false, error: 'Sensor not found in active simulation' });
    }

    sensor.enabled = !sensor.enabled;
    res.status(200).json({ success: true, sensorId, enabled: sensor.enabled });
  });

  return router;
}

module.exports = createSensorRoutes;
