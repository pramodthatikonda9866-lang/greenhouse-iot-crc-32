const mongoose = require('mongoose');

const SensorSchema = new mongoose.Schema({
  sensorId: { type: String, required: true, index: true },
  runId: { type: String, required: true, index: true },
  enabled: { type: Boolean, default: true },
  totalPackets: { type: Number, default: 0 },
  validPackets: { type: Number, default: 0 },
  corruptedPackets: { type: Number, default: 0 },
  lostPackets: { type: Number, default: 0 },
  reliability: { type: Number, default: 0 },
  lastReading: {
    temperature: Number,
    humidity: Number,
    timestamp: String,
    status: String
  }
}, { timestamps: true });

SensorSchema.index({ runId: 1, sensorId: 1 }, { unique: true });

module.exports = mongoose.model('Sensor', SensorSchema);
