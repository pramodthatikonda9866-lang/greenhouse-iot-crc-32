const SensorSimulator = require('../src/engine/sensorSimulator');
const { calculateCrc32, verifyPacketCrc, buildPayload } = require('../src/engine/crc32');

describe('Section 14 — Reliability & Acceptance Test Matrix', () => {
  let simulator;

  beforeEach(() => {
    simulator = new SensorSimulator();
  });

  afterEach(async () => {
    await simulator.stop();
  });

  test('Test Case 1: 0% corruption — All generated and received packets must pass CRC-32 validation', () => {
    simulator.initSensors(10);
    simulator.config = {
      sensorCount: 10,
      corruptionRate: 0.0,
      lossRate: 0.0,
      seed: 42
    };

    const sensors = simulator.getSensorsArray();
    const packets = [];

    // Generate 50 packets across sensors
    for (let i = 0; i < 50; i++) {
      const sensor = sensors[i % sensors.length];
      const packet = simulator.generateAndProcessPacket(sensor);
      packets.push(packet);
    }

    expect(simulator.stats.generated).toBe(50);
    expect(simulator.stats.received).toBe(50);
    expect(simulator.stats.valid).toBe(50);
    expect(simulator.stats.corrupted).toBe(0);
    expect(simulator.stats.reliability).toBe(100.0);
    expect(simulator.stats.errorRate).toBe(0.0);

    packets.forEach(p => {
      expect(p.status).toBe('VALID');
      expect(p.originalCrc32).toBe(p.recalculatedCrc32);
    });
  });

  test('Test Case 2: 5% corruption — Configured fraction of packets are detected as corrupted', () => {
    simulator.initSensors(20);
    simulator.config = {
      sensorCount: 20,
      corruptionRate: 0.05,
      lossRate: 0.0,
      seed: 12345
    };

    const sensors = simulator.getSensorsArray();
    const totalToGenerate = 200;

    for (let i = 0; i < totalToGenerate; i++) {
      const sensor = sensors[i % sensors.length];
      simulator.generateAndProcessPacket(sensor);
    }

    expect(simulator.stats.generated).toBe(totalToGenerate);
    expect(simulator.stats.received).toBe(totalToGenerate);
    expect(simulator.stats.corrupted).toBeGreaterThan(0);
    expect(simulator.stats.valid).toBeGreaterThan(0);
    expect(simulator.stats.valid + simulator.stats.corrupted).toBe(totalToGenerate);

    // Corrupted packets should hover around 5% (+/- margin of error for 200 packets)
    const errorPct = (simulator.stats.corrupted / totalToGenerate) * 100;
    expect(errorPct).toBeGreaterThanOrEqual(1.0);
    expect(errorPct).toBeLessThanOrEqual(15.0);
  });

  test('Test Case 3: 100% corruption — All altered packets must fail CRC-32 validation', () => {
    simulator.initSensors(10);
    simulator.config = {
      sensorCount: 10,
      corruptionRate: 1.0,
      lossRate: 0.0,
      seed: 999
    };

    const sensors = simulator.getSensorsArray();
    const totalToGenerate = 50;

    for (let i = 0; i < totalToGenerate; i++) {
      const sensor = sensors[i % sensors.length];
      const packet = simulator.generateAndProcessPacket(sensor);
      expect(packet.status).toBe('CORRUPTED');
      expect(packet.originalCrc32).not.toBe(packet.recalculatedCrc32);
    }

    expect(simulator.stats.generated).toBe(50);
    expect(simulator.stats.received).toBe(50);
    expect(simulator.stats.valid).toBe(0);
    expect(simulator.stats.corrupted).toBe(50);
    expect(simulator.stats.reliability).toBe(0.0);
    expect(simulator.stats.errorRate).toBe(100.0);
  });

  test('Test Case 4: One-field temperature modification strictly produces CORRUPTED', () => {
    const payloadOriginal = buildPayload({
      sensorId: 'S025',
      sequenceNo: 105,
      temperature: 28.5,
      humidity: 72,
      timestamp: '2026-09-04T14:30:25Z'
    });
    const originalCrc = calculateCrc32(payloadOriginal);

    // Alter temperature 28.5 -> 38.5
    const payloadCorrupted = buildPayload({
      sensorId: 'S025',
      sequenceNo: 105,
      temperature: 38.5,
      humidity: 72,
      timestamp: '2026-09-04T14:30:25Z'
    });

    const verification = verifyPacketCrc(payloadCorrupted, originalCrc);
    expect(verification.status).toBe('CORRUPTED');
    expect(verification.isMatch).toBe(false);
    expect(verification.recalculatedCrc32).not.toBe(originalCrc);
  });

  test('Test Case 5: Empty state handling — No division-by-zero or misleading 100% reliability', () => {
    simulator.initSensors(101);
    expect(simulator.stats.generated).toBe(0);
    expect(simulator.stats.received).toBe(0);
    expect(simulator.stats.reliability).toBe(0.0);
    expect(simulator.stats.errorRate).toBe(0.0);

    const sensors = simulator.getSensorsArray();
    expect(sensors.length).toBe(101);
    sensors.forEach(s => {
      expect(s.totalPackets).toBe(0);
      expect(s.reliability).toBe(0.0);
    });
  });

  test('Test Case 6: Reset clears all counters, packets, and state isolation', () => {
    simulator.initSensors(5);
    const sensor = simulator.getSensorsArray()[0];
    simulator.generateAndProcessPacket(sensor);

    expect(simulator.stats.generated).toBe(1);

    // Execute reset
    simulator.reset();

    expect(simulator.status).toBe('IDLE');
    expect(simulator.currentRunId).toBeNull();
    expect(simulator.stats.generated).toBe(0);
    expect(simulator.stats.received).toBe(0);
    expect(simulator.stats.valid).toBe(0);
    expect(simulator.stats.corrupted).toBe(0);
    expect(simulator.stats.reliability).toBe(0.0);
    expect(simulator.recentPackets.length).toBe(0);
  });
});
