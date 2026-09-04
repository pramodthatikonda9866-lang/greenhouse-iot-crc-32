/**
 * Deterministic IEEE 802.3 CRC-32 Engine
 * Uses the standard reversed polynomial 0xEDB88320.
 * Produces deterministic 8-character uppercase hexadecimal strings (e.g., '8F3A21C7').
 */

// Generate standard 256-entry lookup table for IEEE 802.3 polynomial
const createCrc32Table = () => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
};

const CRC32_TABLE = createCrc32Table();

/**
 * Calculates deterministic CRC-32 checksum for a given string.
 * @param {string|Buffer} input - Text payload or buffer
 * @returns {string} 8-character uppercase hex string (e.g. '8F3A21C7')
 */
function calculateCrc32(input) {
  if (typeof input !== 'string' && !Buffer.isBuffer(input)) {
    throw new TypeError('Input must be a string or Buffer');
  }

  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  let crc = 0xFFFFFFFF;

  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    const tableIndex = (crc ^ byte) & 0xFF;
    crc = (crc >>> 8) ^ CRC32_TABLE[tableIndex];
  }

  const finalCrc = (crc ^ 0xFFFFFFFF) >>> 0;
  return finalCrc.toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Builds deterministic IoT payload string matching Section 5 format:
 * sensorId|sequenceNo|temperature|humidity|timestamp
 * 
 * @param {Object} params
 * @param {string} params.sensorId - e.g. 'S025'
 * @param {number} params.sequenceNo - e.g. 105
 * @param {number|string} params.temperature - e.g. 28.5
 * @param {number|string} params.humidity - e.g. 72
 * @param {string} params.timestamp - ISO timestamp e.g. '2026-09-04T14:30:25Z'
 * @returns {string}
 */
function buildPayload({ sensorId, sequenceNo, temperature, humidity, timestamp }) {
  // Enforce consistent decimal formatting for temperature if number
  const formattedTemp = typeof temperature === 'number' ? 
    (Number.isInteger(temperature) ? `${temperature}.0` : `${temperature}`) : 
    String(temperature);

  const formattedHum = typeof humidity === 'number' ? `${Math.round(humidity)}` : String(humidity);
  const formattedSeq = String(sequenceNo);
  const formattedId = String(sensorId);
  const formattedTime = String(timestamp);

  return `${formattedId}|${formattedSeq}|${formattedTemp}|${formattedHum}|${formattedTime}`;
}

/**
 * Parses payload string into structured object
 * @param {string} payload - 'S025|105|28.5|72|2026-09-04T14:30:25Z'
 * @returns {Object}
 */
function parsePayload(payload) {
  if (!payload || typeof payload !== 'string') {
    throw new Error('Invalid payload string');
  }
  const parts = payload.split('|');
  if (parts.length < 5) {
    throw new Error(`Malformed payload: expected 5 parts separated by '|', got ${parts.length}`);
  }

  return {
    sensorId: parts[0],
    sequenceNo: parseInt(parts[1], 10),
    temperature: parseFloat(parts[2]),
    humidity: parseFloat(parts[3]),
    timestamp: parts.slice(4).join('|') // in case timestamp has pipes
  };
}

/**
 * Validates a received packet against its received CRC-32
 * @param {string} receivedPayload - The payload as received by receiver
 * @param {string} receivedCrc32 - The CRC-32 value transmitted with packet
 * @returns {Object} Validation result { status: 'VALID'|'CORRUPTED', recalculatedCrc32, receivedCrc32, isMatch }
 */
function verifyPacketCrc(receivedPayload, receivedCrc32) {
  const recalculatedCrc32 = calculateCrc32(receivedPayload);
  const normalizedReceived = String(receivedCrc32 || '').toUpperCase().trim();
  const isMatch = (normalizedReceived === recalculatedCrc32);

  return {
    status: isMatch ? 'VALID' : 'CORRUPTED',
    recalculatedCrc32,
    receivedCrc32: normalizedReceived,
    isMatch
  };
}

module.exports = {
  calculateCrc32,
  buildPayload,
  parsePayload,
  verifyPacketCrc,
  CRC32_TABLE
};
