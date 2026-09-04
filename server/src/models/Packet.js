const mongoose = require('mongoose');

const PacketSchema = new mongoose.Schema({
  packetId: { type: String, required: true, index: true },
  runId: { type: String, required: true, index: true },
  sensorId: { type: String, required: true, index: true },
  sequenceNo: { type: Number, required: true },
  temperature: { type: Number },
  humidity: { type: Number },
  originalPayload: { type: String, required: true },
  receivedPayload: { type: String, default: null },
  originalCrc32: { type: String, required: true },
  receivedCrc32: { type: String, default: null },
  recalculatedCrc32: { type: String, default: null },
  status: { type: String, enum: ['VALID', 'CORRUPTED', 'LOST'], required: true, index: true },
  corruptionType: { type: String, default: 'NONE' },
  mutatedFields: { type: Array, default: [] },
  timestamp: { type: String, required: true }
}, { timestamps: true });

PacketSchema.index({ runId: 1, timestamp: -1 });

module.exports = mongoose.model('Packet', PacketSchema);
