# Smart Greenhouse IoT Packet Reliability & Data Integrity Monitor (CRC-32)

A full-stack IoT communication reliability and error-detection monitoring system. The system simulates **101 virtual greenhouse sensor nodes (`S001` to `S101`)**, serializes environmental telemetry using a deterministic contract, computes **IEEE 802.3 CRC-32 checksums**, injects configurable channel faults (single/multi-field alterations, bit flips, packet drops), detects corrupted payloads at the receiver, and visualizes live telemetry on a real-time web dashboard over WebSockets.

---

## 🏗️ System Architecture

```
+---------------------------------------------------------------------------------+
|                       React + Vite + Tailwind/Glassmorphic UI                   |
|  - Real-Time Dashboard (5 KPI Cards, Live Stream Table, Recharts Trend)        |
|  - 101 Virtual Sensors Grid & Microclimate Floor Plan (Zones A - E)             |
|  - Interactive CRC-32 Sandbox & Fault Injector (Live Diff & Validation)         |
|  - High-Error Sensors Ranking & Leaderboard                                     |
|  - Run History Telemetry & JSON/CSV Data Exporter                               |
+---------------------------------------^-----------------------------------------+
                                        |  WebSocket (Socket.IO) & REST APIs
+---------------------------------------v-----------------------------------------+
|                  Node.js + Express Backend & Simulation Engine                  |
|  - Deterministic IEEE 802.3 CRC-32 Algorithm (Polynomial 0xEDB88320)           |
|  - Virtual Greenhouse Coordinator (101 Nodes, Microclimate Zone Baselines)      |
|  - Fault Injection Engine (Single/Multi Field Alteration, Bit Flips, Loss)      |
|  - Socket.IO Real-Time Streamer (Throttled for high performance)                |
+---------------------------------------^-----------------------------------------+
                                        |  Mongoose ODM
+---------------------------------------v-----------------------------------------+
|                  MongoDB Collections (External or In-Memory)                   |
|  - SimulationRuns  - Sensors  - Packets  - NetworkStats                         |
+---------------------------------------------------------------------------------+
```

---

## 📦 Deterministic CRC-32 Packet Format Contract

Every packet strictly follows Section 5 of the specification:

$$\text{Payload} = \texttt{sensorId}|\texttt{sequenceNo}|\texttt{temperature}|\texttt{humidity}|\texttt{timestamp}$$

**Example:**
```
S025|105|28.5|72|2026-09-04T14:30:25Z
                  ↓
          CRC-32 (0xEDB88320)
                  ↓
               8F3A21C7
```

### Transmission & Verification Flow:
1. **Transmitter:** Reads sensor data $\rightarrow$ builds payload string $\rightarrow$ calculates $\text{CRC-32}(\text{payload})$ $\rightarrow$ attaches checksum.
2. **Channel:** Applies configured fault injection rate (e.g. Temperature $28.5 \rightarrow 38.5^\circ\text{C}$, Humidity $72 \rightarrow 73\%$, or bit-flips).
3. **Receiver:** Recalculates $\text{CRC-32}$ over received payload string $\rightarrow$ compares with transmitted $\text{CRC-32}$:
   - $\text{Transmitted CRC} = \text{Recalculated CRC} \implies \mathbf{VALID}$
   - $\text{Transmitted CRC} \neq \text{Recalculated CRC} \implies \mathbf{CORRUPTED}$

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Installation
```bash
# Install dependencies for root, server, and client
npm run install:all
```

### 3. Run Development Servers
```bash
# Runs both Node backend (port 5000) and React frontend (port 5173)
npm run dev
```

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Automated Testing Matrix

Run the comprehensive Jest unit and Section 14 acceptance test suite:

```bash
npm test
```

### Test Coverage (13/13 Passing):
- ✅ **0% Corruption:** All received packets pass CRC-32 (100% Reliability).
- ✅ **5% Corruption:** Configured fraction detected as corrupted.
- ✅ **100% Corruption:** All altered packets strictly fail CRC-32.
- ✅ **Single-Field Alteration:** Temperature mutation $28.5 \rightarrow 38.5$ fails checksum.
- ✅ **Humidity Alteration:** Humidity mutation $72 \rightarrow 73$ fails checksum.
- ✅ **Sequence Number Mutation:** Sequence tampering fails checksum.
- ✅ **Empty State Handling:** No division-by-zero or misleading 100% reliability.
- ✅ **State Isolation:** Reset cleanly restores counters and memory.

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/simulation/start` | Starts simulation with `{ sensorCount, packetsPerSensor, rateMs, corruptionRate, lossRate, seed, continuous }` |
| `POST` | `/api/simulation/stop` | Stops the active simulation run |
| `POST` | `/api/simulation/reset` | Resets state to IDLE and clears telemetry |
| `GET` | `/api/simulation/current` | Returns active simulation state, KPIs, and recent packets |
| `GET` | `/api/simulation/runs` | Returns past simulation runs from MongoDB |
| `GET` | `/api/sensors` | Returns status and telemetry for all 101 sensors |
| `GET` | `/api/packets` | Paginated packet logs with filters (`status`, `sensorId`, `runId`) |
| `POST` | `/api/packet/test-crc` | Interactive endpoint to compute and verify CRC-32 on arbitrary payloads |
| `GET` | `/api/analytics/summary` | Aggregated network KPIs and timeseries telemetry |
| `GET` | `/api/analytics/sensors` | Sensor ranking leaderboard and error distribution |
| `GET` | `/api/analytics/export/:runId` | Exports run telemetry as `json` or `csv` |

---

## 🌿 Greenhouse Microclimate Zones

Sensors `S001` through `S101` are partitioned into 5 greenhouse zones:
- **Zone A: Nursery (S001 - S020)** — High humidity, controlled temperature for seedlings.
- **Zone B: Hydroponics (S021 - S040)** — Nutrient solution and root zone monitoring.
- **Zone C: Canopy (S041 - S065)** — Foliage density and photosynthesis zone.
- **Zone D: Blossom & Fruit (S066 - S085)** — Flowering and ripening zone.
- **Zone E: Ventilation (S086 - S101)** — Air intake, exhaust, and circulation corridor.
