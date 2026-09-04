const { calculateCrc32, buildPayload, parsePayload, verifyPacketCrc } = require('../src/engine/crc32');

describe('CRC-32 Deterministic Engine Unit Tests', () => {
  test('Calculates consistent deterministic CRC-32 for sample string', () => {
    const payload = 'S025|105|28.5|72|2026-09-04T14:30:25Z';
    const crc1 = calculateCrc32(payload);
    const crc2 = calculateCrc32(payload);
    
    expect(crc1).toBe(crc2);
    expect(crc1).toHaveLength(8);
    expect(crc1).toMatch(/^[0-9A-F]{8}$/);
  });

  test('Validates packet format builder and parser consistency', () => {
    const originalData = {
      sensorId: 'S025',
      sequenceNo: 105,
      temperature: 28.5,
      humidity: 72,
      timestamp: '2026-09-04T14:30:25Z'
    };

    const payload = buildPayload(originalData);
    expect(payload).toBe('S025|105|28.5|72|2026-09-04T14:30:25Z');

    const parsed = parsePayload(payload);
    expect(parsed.sensorId).toBe('S025');
    expect(parsed.sequenceNo).toBe(105);
    expect(parsed.temperature).toBe(28.5);
    expect(parsed.humidity).toBe(72);
    expect(parsed.timestamp).toBe('2026-09-04T14:30:25Z');
  });

  test('Produces VALID status when received payload and CRC match', () => {
    const payload = 'S001|1|24.2|55|2026-09-04T12:00:00Z';
    const crc = calculateCrc32(payload);
    const verification = verifyPacketCrc(payload, crc);

    expect(verification.status).toBe('VALID');
    expect(verification.isMatch).toBe(true);
    expect(verification.recalculatedCrc32).toBe(crc);
  });

  test('Produces CORRUPTED status when temperature is modified (single-field change)', () => {
    const originalPayload = 'S025|105|28.5|72|2026-09-04T14:30:25Z';
    const originalCrc = calculateCrc32(originalPayload);

    // Corrupted payload with altered temperature: 28.5 -> 38.5
    const corruptedPayload = 'S025|105|38.5|72|2026-09-04T14:30:25Z';
    const verification = verifyPacketCrc(corruptedPayload, originalCrc);

    expect(verification.status).toBe('CORRUPTED');
    expect(verification.isMatch).toBe(false);
    expect(verification.recalculatedCrc32).not.toBe(originalCrc);
  });

  test('Produces CORRUPTED status when humidity is modified (72 -> 73)', () => {
    const originalPayload = 'S025|105|28.5|72|2026-09-04T14:30:25Z';
    const originalCrc = calculateCrc32(originalPayload);

    const corruptedPayload = 'S025|105|28.5|73|2026-09-04T14:30:25Z';
    const verification = verifyPacketCrc(corruptedPayload, originalCrc);

    expect(verification.status).toBe('CORRUPTED');
    expect(verification.isMatch).toBe(false);
  });

  test('Produces CORRUPTED status when sequence number is altered', () => {
    const originalPayload = 'S025|105|28.5|72|2026-09-04T14:30:25Z';
    const originalCrc = calculateCrc32(originalPayload);

    const corruptedPayload = 'S025|106|28.5|72|2026-09-04T14:30:25Z';
    const verification = verifyPacketCrc(corruptedPayload, originalCrc);

    expect(verification.status).toBe('CORRUPTED');
    expect(verification.isMatch).toBe(false);
  });

  test('Throws descriptive error on malformed payload strings', () => {
    expect(() => parsePayload('invalid_string')).toThrow();
    expect(() => calculateCrc32(null)).toThrow(TypeError);
  });

  test('Calculates deterministic CRC-32 over raw binary Buffers (File Integrity)', () => {
    // Arbitrary binary bytes (mocking PDF/image/binary file)
    const rawFileBytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x00, 0xFF, 0x7E, 0x1A]);
    const crcOriginal = calculateCrc32(rawFileBytes);

    expect(crcOriginal).toHaveLength(8);
    expect(calculateCrc32(rawFileBytes)).toBe(crcOriginal);

    // Corrupt 1 byte in the binary file
    const corruptedFileBytes = Buffer.from(rawFileBytes);
    corruptedFileBytes[5] = corruptedFileBytes[5] ^ 0x01; // flip 1 bit
    const crcCorrupted = calculateCrc32(corruptedFileBytes);

    expect(crcCorrupted).not.toBe(crcOriginal);
  });
});
