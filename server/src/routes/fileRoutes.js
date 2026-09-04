const express = require('express');
const { calculateCrc32 } = require('../engine/crc32');

function createFileRoutes() {
  const router = express.Router();

  // POST /api/file/verify-crc
  // Accepts raw bytes (as base64 or text) or comparison request
  router.post('/verify-crc', express.json({ limit: '50mb' }), (req, res) => {
    try {
      const { originalCrc, receivedCrc, base64Data, expectedCrc } = req.body;

      if (base64Data) {
        const buffer = Buffer.from(base64Data, 'base64');
        const calculatedCrc = calculateCrc32(buffer);
        const targetExpected = (expectedCrc || '').toUpperCase().trim();
        const isMatch = targetExpected ? (calculatedCrc === targetExpected) : null;

        return res.status(200).json({
          success: true,
          calculatedCrc32: calculatedCrc,
          sizeBytes: buffer.length,
          isMatch,
          status: isMatch === true ? 'FILE INTACT — CRC MATCH' : isMatch === false ? 'FILE CORRUPTED/MODIFIED — CRC MISMATCH' : 'CALCULATED'
        });
      }

      if (originalCrc && receivedCrc) {
        const normOriginal = String(originalCrc).toUpperCase().trim();
        const normReceived = String(receivedCrc).toUpperCase().trim();
        const isMatch = normOriginal === normReceived;

        return res.status(200).json({
          success: true,
          originalCrc32: normOriginal,
          receivedCrc32: normReceived,
          isMatch,
          verdict: isMatch ? 'FILE INTACT — CRC MATCH' : 'FILE CORRUPTED/MODIFIED — CRC MISMATCH'
        });
      }

      return res.status(400).json({ success: false, error: 'Provide either base64Data or both originalCrc and receivedCrc' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = createFileRoutes;
