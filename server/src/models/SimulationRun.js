const mongoose = require('mongoose');

const SimulationRunSchema = new mongoose.Schema({
  runId: { type: String, required: true, unique: true, index: true },
  sensorCount: { type: Number, default: 101 },
  packetsPerSensor: { type: Number, default: 50 },
  rateMs: { type: Number, default: 200 },
  corruptionRate: { type: Number, default: 0.05 },
  lossRate: { type: Number, default: 0.0 },
  seed: { type: String, default: null },
  continuous: { type: Boolean, default: false },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  status: { type: String, enum: ['IDLE', 'RUNNING', 'STOPPED', 'COMPLETED'], default: 'RUNNING' },
  summary: {
    generated: { type: Number, default: 0 },
    received: { type: Number, default: 0 },
    valid: { type: Number, default: 0 },
    corrupted: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    reliability: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('SimulationRun', SimulationRunSchema);
