const express = require('express');
const { SimulationRun, Sensor, Packet, NetworkStat } = require('../config/database');

function createAnalyticsRoutes(simulator) {
  const router = express.Router();

  // GET /api/analytics/summary - KPI overview and trend telemetry
  router.get('/summary', async (req, res) => {
    try {
      const activeState = simulator.getState();

      if (activeState.stats.generated > 0 || activeState.status === 'RUNNING') {
        return res.status(200).json({
          success: true,
          data: {
            status: activeState.status,
            runId: activeState.currentRunId,
            stats: activeState.stats,
            sensorSummary: simulator.getSensorSummary(),
            source: 'active'
          }
        });
      }

      // Fetch latest completed run from DB
      const latestRun = await SimulationRun.findOne().sort({ createdAt: -1 });
      if (latestRun) {
        return res.status(200).json({
          success: true,
          data: {
            status: latestRun.status,
            runId: latestRun.runId,
            stats: latestRun.summary,
            config: {
              sensorCount: latestRun.sensorCount,
              packetsPerSensor: latestRun.packetsPerSensor,
              corruptionRate: latestRun.corruptionRate,
              lossRate: latestRun.lossRate
            },
            source: 'latest_saved'
          }
        });
      }

      // Clean empty state
      res.status(200).json({
        success: true,
        data: {
          status: 'IDLE',
          runId: null,
          stats: activeState.stats,
          source: 'empty'
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/analytics/sensors - Top corrupted sensors & reliability rankings
  router.get('/sensors', async (req, res) => {
    try {
      const { runId, limit = 10 } = req.query;
      const parsedLimit = parseInt(limit, 10) || 10;

      if (!runId || runId === simulator.currentRunId) {
        const topError = simulator.getHighErrorSensors(parsedLimit);
        const allSensors = simulator.getSensorsArray();

        // Calculate distribution buckets
        const distribution = {
          perfect: 0,   // 100%
          good: 0,      // 95-99%
          warning: 0,   // 80-94%
          critical: 0   // < 80%
        };

        allSensors.forEach(s => {
          if (s.totalPackets === 0) return;
          if (s.reliability >= 100) distribution.perfect++;
          else if (s.reliability >= 95) distribution.good++;
          else if (s.reliability >= 80) distribution.warning++;
          else distribution.critical++;
        });

        return res.status(200).json({
          success: true,
          data: {
            topErrorSensors: topError,
            distribution,
            totalSensors: allSensors.length
          }
        });
      }

      // From DB
      const topErrorSensors = await Sensor.find({ runId, totalPackets: { $gt: 0 } })
        .sort({ corruptedPackets: -1, reliability: 1 })
        .limit(parsedLimit);

      res.status(200).json({
        success: true,
        data: {
          topErrorSensors,
          runId
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/export/:runId - Export run as JSON or CSV
  router.get('/export/:runId', async (req, res) => {
    try {
      const { runId } = req.params;
      const { format = 'json' } = req.query;

      const run = await SimulationRun.findOne({ runId });
      if (!run) {
        return res.status(404).json({ success: false, error: 'Run not found' });
      }

      const sensors = await Sensor.find({ runId }).sort({ sensorId: 1 });
      const packets = await Packet.find({ runId }).sort({ sequenceNo: 1, timestamp: 1 });

      if (format.toLowerCase() === 'csv') {
        let csv = 'PacketId,RunId,SensorId,SequenceNo,Temperature,Humidity,Status,CorruptionType,OriginalCrc32,RecalculatedCrc32,Timestamp,OriginalPayload,ReceivedPayload\n';
        packets.forEach(p => {
          csv += `"${p.packetId}","${p.runId}","${p.sensorId}",${p.sequenceNo},${p.temperature || ''},${p.humidity || ''},"${p.status}","${p.corruptionType}","${p.originalCrc32}","${p.recalculatedCrc32 || ''}","${p.timestamp}","${p.originalPayload}","${p.receivedPayload || ''}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="greenhouse_simulation_${runId}.csv"`);
        return res.status(200).send(csv);
      }

      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="greenhouse_simulation_${runId}.json"`);
      return res.status(200).json({
        run,
        summary: run.summary,
        sensors,
        packetCount: packets.length,
        packets
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = createAnalyticsRoutes;
