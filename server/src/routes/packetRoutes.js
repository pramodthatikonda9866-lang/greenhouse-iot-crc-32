const express = require('express');
const { Packet } = require('../config/database');
const { calculateCrc32, buildPayload, parsePayload, verifyPacketCrc } = require('../engine/crc32');

function createPacketRoutes(simulator) {
  const router = express.Router();

  // GET /api/packets - Query recent packets with filter
  router.get('/', async (req, res) => {
    try {
      const { runId, sensorId, status, limit = 50, page = 1 } = req.query;
      const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      const skip = (parsedPage - 1) * parsedLimit;

      // If active simulation matches runId or no runId specified, use live memory packets first
      let inMemory = [...simulator.recentPackets];
      if (runId) {
        inMemory = inMemory.filter(p => p.runId === runId);
      }
      if (sensorId) {
        inMemory = inMemory.filter(p => p.sensorId === sensorId.toUpperCase());
      }
      if (status) {
        inMemory = inMemory.filter(p => p.status === status.toUpperCase());
      }

      if (inMemory.length > 0 && !req.query.fromDb) {
        const paginated = inMemory.slice(skip, skip + parsedLimit);
        return res.status(200).json({
          success: true,
          total: inMemory.length,
          page: parsedPage,
          limit: parsedLimit,
          data: paginated,
          source: 'live'
        });
      }

      // Query database
      const filter = {};
      if (runId) filter.runId = runId;
      if (sensorId) filter.sensorId = sensorId.toUpperCase();
      if (status) filter.status = status.toUpperCase();

      const total = await Packet.countDocuments(filter);
      const packets = await Packet.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parsedLimit);

      res.status(200).json({
        success: true,
        total,
        page: parsedPage,
        limit: parsedLimit,
        data: packets,
        source: 'database'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/packet/test-crc - Interactive CRC Sandbox endpoint
  router.post('/test-crc', (req, res) => {
    try {
      const { payload, customCrc, sensorId, sequenceNo, temperature, humidity, timestamp } = req.body;

      let targetPayload = payload;
      if (!targetPayload && sensorId) {
        targetPayload = buildPayload({
          sensorId,
          sequenceNo: sequenceNo || 1,
          temperature: temperature !== undefined ? temperature : 25.0,
          humidity: humidity !== undefined ? humidity : 60,
          timestamp: timestamp || new Date().toISOString()
        });
      }

      if (!targetPayload) {
        return res.status(400).json({ success: false, error: 'Payload or sensor fields required' });
      }

      const calculatedCrc = calculateCrc32(targetPayload);
      const transmittedCrc = customCrc ? String(customCrc).toUpperCase().trim() : calculatedCrc;
      const verification = verifyPacketCrc(targetPayload, transmittedCrc);

      res.status(200).json({
        success: true,
        payload: targetPayload,
        calculatedCrc32: calculatedCrc,
        receivedCrc32: transmittedCrc,
        status: verification.status,
        isMatch: verification.isMatch
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = createPacketRoutes;
