/**
 * 101 Virtual Sensors Simulation Coordinator & Runner
 * Manages virtual greenhouse sensors (S001 - S101), packet generation,
 * transmission through corruption channel, CRC verification, and statistics aggregation.
 */

const { v4: uuidv4 } = require('uuid');
const { calculateCrc32, buildPayload, verifyPacketCrc } = require('./crc32');
const { applyTransmissionChannel, createPrng } = require('./corruptionEngine');

class SensorSimulator {
  constructor(io = null, dbServices = null) {
    this.io = io;
    this.dbServices = dbServices;
    this.status = 'IDLE'; // 'IDLE' | 'RUNNING' | 'STOPPED' | 'COMPLETED'
    this.currentRunId = null;
    this.config = {
      sensorCount: 101,
      packetsPerSensor: 50,
      rateMs: 200, // Interval per batch/tick
      corruptionRate: 0.05,
      lossRate: 0.0,
      seed: null,
      continuous: false
    };
    this.sensors = new Map(); // sensorId -> { sensorId, sequenceNo, baseTemp, baseHum, total, valid, corrupted, lost }
    this.stats = {
      generated: 0,
      received: 0,
      valid: 0,
      corrupted: 0,
      lost: 0,
      reliability: 0.0,
      errorRate: 0.0,
      startTime: null,
      endTime: null
    };
    this.timer = null;
    this.prng = Math.random;
    this.recentPackets = [];
    this.maxRecentPackets = 200;
    this.packetBatchBuffer = [];
    this.lastBroadcastTime = 0;
  }

  /**
   * Initializes or resets the 101 virtual sensors
   */
  initSensors(count = 101) {
    this.sensors.clear();
    const sensorCount = Math.min(Math.max(1, count), 101);

    for (let i = 1; i <= sensorCount; i++) {
      const sensorId = `S${String(i).padStart(3, '0')}`;
      // Initial realistic environmental baselines per sensor zone
      const baseTemp = 24.0 + (i % 10) * 1.2 + (Math.floor(i / 20) * 0.8);
      const baseHum = 50 + (i % 15) * 2.2 - (Math.floor(i / 25) * 3);

      this.sensors.set(sensorId, {
        sensorId,
        enabled: true,
        sequenceNo: 1,
        baseTemp: Math.min(38, Math.max(20, Math.round(baseTemp * 10) / 10)),
        baseHum: Math.min(88, Math.max(32, Math.round(baseHum))),
        totalPackets: 0,
        validPackets: 0,
        corruptedPackets: 0,
        lostPackets: 0,
        reliability: 0.0,
        lastReading: null
      });
    }
  }

  /**
   * Starts a new simulation run
   */
  async start(customConfig = {}) {
    if (this.status === 'RUNNING') {
      this.stop();
    }

    this.config = {
      ...this.config,
      ...customConfig
    };

    this.prng = this.config.seed !== null && this.config.seed !== undefined ? 
      createPrng(this.config.seed) : Math.random;

    this.currentRunId = `run_${Date.now()}_${uuidv4().substring(0, 8)}`;
    this.initSensors(this.config.sensorCount || 101);

    this.stats = {
      runId: this.currentRunId,
      generated: 0,
      received: 0,
      valid: 0,
      corrupted: 0,
      lost: 0,
      reliability: 0.0,
      errorRate: 0.0,
      startTime: new Date().toISOString(),
      endTime: null
    };

    this.recentPackets = [];
    this.packetBatchBuffer = [];
    this.status = 'RUNNING';

    // Persist run start in DB if available
    if (this.dbServices) {
      await this.dbServices.saveRunStart(this.currentRunId, this.config, this.stats);
    }

    this.broadcastState();

    // Start simulation clock loop
    let ticks = 0;
    const maxTicks = this.config.continuous ? Infinity : this.config.packetsPerSensor;

    this.timer = setInterval(async () => {
      if (this.status !== 'RUNNING') return;

      if (!this.config.continuous && ticks >= maxTicks) {
        await this.complete();
        return;
      }

      await this.step();
      ticks++;
    }, Math.max(50, this.config.rateMs || 200));

    return {
      runId: this.currentRunId,
      status: this.status,
      config: this.config
    };
  }

  /**
   * Generates a single tick: picks active sensors and generates packets
   */
  async step() {
    const activeSensors = Array.from(this.sensors.values()).filter(s => s.enabled);
    if (activeSensors.length === 0) return;

    // Pick 3-8 random sensors per tick or all if batching
    const sensorsToProcess = activeSensors.length <= 10 ? 
      activeSensors : 
      this.pickRandomSensors(activeSensors, Math.min(8, activeSensors.length));

    const newPackets = [];

    for (const sensor of sensorsToProcess) {
      const packet = this.generateAndProcessPacket(sensor);
      newPackets.push(packet);
    }

    // Update in-memory buffers
    for (const p of newPackets) {
      this.recentPackets.unshift(p);
      if (this.recentPackets.length > this.maxRecentPackets) {
        this.recentPackets.pop();
      }
      this.packetBatchBuffer.push(p);
    }

    // Persist batch to DB periodically
    if (this.dbServices && this.packetBatchBuffer.length >= 20) {
      const toSave = [...this.packetBatchBuffer];
      this.packetBatchBuffer = [];
      this.dbServices.savePackets(toSave).catch(err => console.error('DB save error:', err));
    }

    // Broadcast over WebSocket (throttle socket events to prevent browser freezing)
    const now = Date.now();
    if (now - this.lastBroadcastTime >= 100 || newPackets.length > 0) {
      this.lastBroadcastTime = now;
      if (this.io) {
        this.io.emit('packets:stream', newPackets);
        this.io.emit('stats:update', {
          stats: this.stats,
          sensorSummary: this.getSensorSummary()
        });
      }
    }
  }

  /**
   * Generates, corrupts, and validates a single packet
   */
  generateAndProcessPacket(sensor) {
    const timestamp = new Date().toISOString();
    const seq = sensor.sequenceNo++;

    // Small realistic environmental fluctuation (+/- 0.4 C, +/- 1% Hum)
    const tempFluctuation = (this.prng() - 0.5) * 0.8;
    const humFluctuation = (this.prng() - 0.5) * 2.0;

    const currentTemp = Math.round(Math.max(18, Math.min(45, sensor.baseTemp + tempFluctuation)) * 10) / 10;
    const currentHum = Math.round(Math.max(25, Math.min(95, sensor.baseHum + humFluctuation)));

    // 1. Build original deterministic payload
    const originalPayload = buildPayload({
      sensorId: sensor.sensorId,
      sequenceNo: seq,
      temperature: currentTemp,
      humidity: currentHum,
      timestamp
    });

    // 2. Sender calculates original CRC-32
    const originalCrc32 = calculateCrc32(originalPayload);

    // 3. Transmission through channel (simulating corruption / drop)
    const channelResult = applyTransmissionChannel(
      {
        sensorId: sensor.sensorId,
        sequenceNo: seq,
        temperature: currentTemp,
        humidity: currentHum,
        timestamp,
        payload: originalPayload,
        crc32: originalCrc32
      },
      this.config,
      this.prng
    );

    this.stats.generated++;
    sensor.totalPackets++;

    let packetResult;

    if (channelResult.isLost) {
      // Packet dropped in transmission
      this.stats.lost++;
      sensor.lostPackets++;

      packetResult = {
        packetId: `pkt_${uuidv4().substring(0, 8)}`,
        runId: this.currentRunId,
        sensorId: sensor.sensorId,
        sequenceNo: seq,
        temperature: currentTemp,
        humidity: currentHum,
        originalPayload,
        receivedPayload: null,
        originalCrc32,
        receivedCrc32: null,
        recalculatedCrc32: null,
        status: 'LOST',
        corruptionType: 'PACKET_DROP',
        mutatedFields: [],
        timestamp
      };
    } else {
      // Packet received: Receiver verifies CRC-32
      this.stats.received++;
      const verification = verifyPacketCrc(channelResult.corruptedPayload, originalCrc32);

      if (verification.status === 'VALID') {
        this.stats.valid++;
        sensor.validPackets++;
      } else {
        this.stats.corrupted++;
        sensor.corruptedPackets++;
      }

      packetResult = {
        packetId: `pkt_${uuidv4().substring(0, 8)}`,
        runId: this.currentRunId,
        sensorId: sensor.sensorId,
        sequenceNo: seq,
        temperature: currentTemp,
        humidity: currentHum,
        originalPayload,
        receivedPayload: channelResult.corruptedPayload,
        originalCrc32,
        receivedCrc32: originalCrc32,
        recalculatedCrc32: verification.recalculatedCrc32,
        status: verification.status, // 'VALID' | 'CORRUPTED'
        corruptionType: channelResult.corruptionType,
        mutatedFields: channelResult.mutatedFields,
        timestamp
      };
    }

    // Update sensor reliability & last reading
    const sensorReceived = sensor.validPackets + sensor.corruptedPackets;
    sensor.reliability = sensorReceived > 0 ? 
      Math.round((sensor.validPackets / sensorReceived) * 1000) / 10 : 0.0;
    sensor.lastReading = {
      temperature: currentTemp,
      humidity: currentHum,
      timestamp,
      status: packetResult.status
    };

    // Recalculate global reliability metrics
    if (this.stats.received > 0) {
      this.stats.reliability = Math.round((this.stats.valid / this.stats.received) * 1000) / 10;
      this.stats.errorRate = Math.round((this.stats.corrupted / this.stats.received) * 1000) / 10;
    } else {
      this.stats.reliability = 0.0;
      this.stats.errorRate = 0.0;
    }

    return packetResult;
  }

  /**
   * Helper: picks random subset of sensors
   */
  pickRandomSensors(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - this.prng());
    return shuffled.slice(0, count);
  }

  /**
   * Stops the currently running simulation
   */
  async stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.status === 'RUNNING') {
      this.status = 'STOPPED';
      this.stats.endTime = new Date().toISOString();

      // Flush pending batch
      if (this.dbServices && this.packetBatchBuffer.length > 0) {
        await this.dbServices.savePackets(this.packetBatchBuffer);
        this.packetBatchBuffer = [];
      }

      if (this.dbServices) {
        await this.dbServices.saveRunComplete(this.currentRunId, this.stats, this.getSensorsArray());
      }

      this.broadcastState();
    }

    return { status: this.status, stats: this.stats };
  }

  /**
   * Completes the simulation when all packets are done
   */
  async complete() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.status = 'COMPLETED';
    this.stats.endTime = new Date().toISOString();

    if (this.dbServices && this.packetBatchBuffer.length > 0) {
      await this.dbServices.savePackets(this.packetBatchBuffer);
      this.packetBatchBuffer = [];
    }

    if (this.dbServices) {
      await this.dbServices.saveRunComplete(this.currentRunId, this.stats, this.getSensorsArray());
    }

    this.broadcastState();
  }

  /**
   * Resets simulation state and counters
   */
  reset() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.status = 'IDLE';
    this.currentRunId = null;
    this.recentPackets = [];
    this.packetBatchBuffer = [];
    this.initSensors(this.config.sensorCount || 101);

    this.stats = {
      runId: null,
      generated: 0,
      received: 0,
      valid: 0,
      corrupted: 0,
      lost: 0,
      reliability: 0.0,
      errorRate: 0.0,
      startTime: null,
      endTime: null
    };

    this.broadcastState();
    return { status: this.status, stats: this.stats };
  }

  broadcastState() {
    if (this.io) {
      this.io.emit('simulation:state', {
        status: this.status,
        runId: this.currentRunId,
        config: this.config,
        stats: this.stats
      });
    }
  }

  getSensorsArray() {
    return Array.from(this.sensors.values());
  }

  getSensorSummary() {
    return {
      total: this.sensors.size,
      active: Array.from(this.sensors.values()).filter(s => s.enabled).length,
      topCorrupted: this.getHighErrorSensors(5)
    };
  }

  getHighErrorSensors(limit = 10) {
    return Array.from(this.sensors.values())
      .filter(s => s.totalPackets > 0)
      .sort((a, b) => b.corruptedPackets - a.corruptedPackets || a.reliability - b.reliability)
      .slice(0, limit);
  }

  getState() {
    return {
      status: this.status,
      currentRunId: this.currentRunId,
      config: this.config,
      stats: this.stats,
      recentPackets: this.recentPackets.slice(0, 50),
      sensors: this.getSensorsArray()
    };
  }
}

module.exports = SensorSimulator;
