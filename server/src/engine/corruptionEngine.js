/**
 * Fault & Corruption Simulation Engine
 * Simulates transmission faults across the IoT communication channel:
 * - Single-field corruption (temperature, humidity, sequence, sensorId)
 * - Multiple-field corruption
 * - Bit flips / character alterations
 * - Packet loss / drops
 */

const { buildPayload, parsePayload } = require('./crc32');

// Seeded pseudo-random number generator for reproducible test runs
function createPrng(seed) {
  let s = typeof seed === 'number' ? seed : (seed ? String(seed).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : null);
  
  if (s === null) {
    return () => Math.random();
  }

  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Apply corruption to packet payload based on configuration
 * @param {Object} originalPacket - { sensorId, sequenceNo, temperature, humidity, timestamp, payload, crc32 }
 * @param {Object} config - { corruptionRate: 0.05, lossRate: 0, seed: null }
 * @param {Function} [randomFn] - Optional PRNG
 * @returns {Object} { isLost, isCorrupted, corruptedPayload, corruptionType, mutatedFields }
 */
function applyTransmissionChannel(originalPacket, config = {}, randomFn = null) {
  const rand = randomFn || (config.seed !== undefined && config.seed !== null ? createPrng(config.seed) : Math.random);
  const corruptionRate = config.corruptionRate !== undefined ? config.corruptionRate : 0.05;
  const lossRate = config.lossRate !== undefined ? config.lossRate : 0.0;

  // 1. Packet Loss Check
  if (lossRate > 0 && rand() < lossRate) {
    return {
      isLost: true,
      isCorrupted: false,
      corruptedPayload: null,
      corruptionType: 'PACKET_DROP',
      mutatedFields: []
    };
  }

  // 2. Corruption Check
  const shouldCorrupt = corruptionRate > 0 && rand() < corruptionRate;
  if (!shouldCorrupt) {
    return {
      isLost: false,
      isCorrupted: false,
      corruptedPayload: originalPacket.payload,
      corruptionType: 'NONE',
      mutatedFields: []
    };
  }

  // 3. Apply Corruption Type
  const modes = ['SINGLE_FIELD_TEMP', 'SINGLE_FIELD_HUMIDITY', 'MULTI_FIELD', 'BIT_FLIP', 'SEQUENCE_MUTATION'];
  const modeIndex = Math.floor(rand() * modes.length);
  const selectedMode = modes[modeIndex];

  let mutatedData = { ...originalPacket };
  const mutatedFields = [];

  switch (selectedMode) {
    case 'SINGLE_FIELD_TEMP': {
      const delta = (rand() > 0.5 ? 1 : -1) * (10 + Math.floor(rand() * 15));
      const newTemp = Math.round((Number(originalPacket.temperature) + delta) * 10) / 10;
      mutatedData.temperature = newTemp;
      mutatedFields.push({ field: 'temperature', from: originalPacket.temperature, to: newTemp });
      break;
    }
    case 'SINGLE_FIELD_HUMIDITY': {
      const delta = (rand() > 0.5 ? 1 : -1) * (1 + Math.floor(rand() * 10));
      let newHum = Math.round(Number(originalPacket.humidity) + delta);
      if (newHum === Number(originalPacket.humidity)) newHum += 1;
      mutatedData.humidity = newHum;
      mutatedFields.push({ field: 'humidity', from: originalPacket.humidity, to: newHum });
      break;
    }
    case 'SEQUENCE_MUTATION': {
      const newSeq = Number(originalPacket.sequenceNo) + (Math.floor(rand() * 10) + 1);
      mutatedData.sequenceNo = newSeq;
      mutatedFields.push({ field: 'sequenceNo', from: originalPacket.sequenceNo, to: newSeq });
      break;
    }
    case 'MULTI_FIELD': {
      const newTemp = Math.round((Number(originalPacket.temperature) + 12.5) * 10) / 10;
      const newHum = Math.round(Number(originalPacket.humidity) + 5);
      mutatedData.temperature = newTemp;
      mutatedData.humidity = newHum;
      mutatedFields.push(
        { field: 'temperature', from: originalPacket.temperature, to: newTemp },
        { field: 'humidity', from: originalPacket.humidity, to: newHum }
      );
      break;
    }
    case 'BIT_FLIP':
    default: {
      // Direct string byte modification
      const rawPayload = originalPacket.payload;
      const targetIdx = Math.floor(rand() * (rawPayload.length - 1));
      const charCode = rawPayload.charCodeAt(targetIdx);
      // Flip lower bit or substitute character
      const mutatedChar = String.fromCharCode(charCode === 88 ? 89 : charCode ^ 1);
      const mutatedPayload = rawPayload.slice(0, targetIdx) + mutatedChar + rawPayload.slice(targetIdx + 1);
      
      return {
        isLost: false,
        isCorrupted: true,
        corruptedPayload: mutatedPayload,
        corruptionType: 'BIT_FLIP',
        mutatedFields: [{ field: 'payload', index: targetIdx, originalChar: rawPayload[targetIdx], mutatedChar }]
      };
    }
  }

  const corruptedPayload = buildPayload(mutatedData);
  return {
    isLost: false,
    isCorrupted: true,
    corruptedPayload,
    corruptionType: selectedMode,
    mutatedFields
  };
}

module.exports = {
  applyTransmissionChannel,
  createPrng
};
