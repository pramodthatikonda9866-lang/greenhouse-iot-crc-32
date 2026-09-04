const mongoose = require('mongoose');

const NetworkStatSchema = new mongoose.Schema({
  runId: { type: String, required: true, index: true },
  generated: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  valid: { type: Number, default: 0 },
  corrupted: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  reliability: { type: Number, default: 0 },
  errorRate: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.model('NetworkStat', NetworkStatSchema);
