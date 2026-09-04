const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SimulationRun = require('../models/SimulationRun');
const Sensor = require('../models/Sensor');
const Packet = require('../models/Packet');
const NetworkStat = require('../models/NetworkStat');

let mongodInstance = null;

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[Database] Connecting to external MongoDB at ${uri}...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      console.log('[Database] Connected to external MongoDB successfully.');
      return mongoose.connection;
    } catch (err) {
      console.warn(`[Database] External MongoDB connection failed (${err.message}). Falling back to in-memory MongoDB...`);
    }
  }

  try {
    console.log('[Database] Initializing Embedded MongoMemoryServer...');
    mongodInstance = await MongoMemoryServer.create();
    const memUri = mongodInstance.getUri();
    await mongoose.connect(memUri);
    console.log(`[Database] Connected to Embedded MongoMemoryServer at ${memUri}`);
    return mongoose.connection;
  } catch (err) {
    console.error('[Database] Fatal: Failed to initialize MongoDB storage:', err);
    throw err;
  }
}

async function closeDatabase() {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (e) {
    console.error('[Database] Error closing DB:', e);
  }
}

// Database Persistence Services
const dbServices = {
  async saveRunStart(runId, config, initialStats) {
    try {
      await SimulationRun.create({
        runId,
        sensorCount: config.sensorCount || 101,
        packetsPerSensor: config.packetsPerSensor || 50,
        rateMs: config.rateMs || 200,
        corruptionRate: config.corruptionRate !== undefined ? config.corruptionRate : 0.05,
        lossRate: config.lossRate !== undefined ? config.lossRate : 0.0,
        seed: config.seed || null,
        continuous: Boolean(config.continuous),
        startTime: new Date(),
        status: 'RUNNING',
        summary: initialStats
      });
    } catch (err) {
      console.error('[DB Service] Error saving run start:', err);
    }
  },

  async savePackets(packets) {
    if (!packets || packets.length === 0) return;
    try {
      await Packet.insertMany(packets, { ordered: false });
    } catch (err) {
      // Ignore duplicate keys if any
      if (err.code !== 11000) {
        console.error('[DB Service] Error batch inserting packets:', err.message);
      }
    }
  },

  async saveRunComplete(runId, finalStats, sensorsArray) {
    try {
      await SimulationRun.findOneAndUpdate(
        { runId },
        {
          endTime: new Date(),
          status: 'COMPLETED',
          summary: finalStats
        },
        { upsert: true }
      );

      // Save or update sensors
      if (sensorsArray && sensorsArray.length > 0) {
        const sensorOps = sensorsArray.map(s => ({
          updateOne: {
            filter: { runId, sensorId: s.sensorId },
            update: {
              $set: {
                runId,
                sensorId: s.sensorId,
                enabled: s.enabled,
                totalPackets: s.totalPackets,
                validPackets: s.validPackets,
                corruptedPackets: s.corruptedPackets,
                lostPackets: s.lostPackets,
                reliability: s.reliability,
                lastReading: s.lastReading
              }
            },
            upsert: true
          }
        }));
        await Sensor.bulkWrite(sensorOps);
      }

      // Record final network stat
      await NetworkStat.create({
        runId,
        generated: finalStats.generated,
        received: finalStats.received,
        valid: finalStats.valid,
        corrupted: finalStats.corrupted,
        lost: finalStats.lost,
        reliability: finalStats.reliability,
        errorRate: finalStats.errorRate
      });
    } catch (err) {
      console.error('[DB Service] Error saving run completion:', err);
    }
  }
};

module.exports = {
  connectDatabase,
  closeDatabase,
  dbServices,
  SimulationRun,
  Sensor,
  Packet,
  NetworkStat
};
