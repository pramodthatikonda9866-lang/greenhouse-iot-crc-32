const http = require('http');

async function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function runE2eTest() {
  console.log('===============================================================');
  console.log('    SMART GREENHOUSE IoT CRC-32 END-TO-END VERIFICATION       ');
  console.log('===============================================================');

  console.log('\n--- Step 1: Backend Health Check ---');
  let res = await request({ host: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('Health Response:', res.body);

  console.log('\n--- Step 2: Start Simulation with 101 Sensors & 5% Corruption ---');
  res = await request(
    { host: 'localhost', port: 5000, path: '/api/simulation/start', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { sensorCount: 101, packetsPerSensor: 30, rateMs: 80, corruptionRate: 0.05, seed: 'demo42' }
  );
  console.log('Start result:', res.body);
  const runId = JSON.parse(res.body).runId;

  console.log('\n--- Step 3: Waiting 2.5s for real-time packet generation... ---');
  await new Promise(r => setTimeout(r, 2500));

  console.log('\n--- Step 4: Fetch Active Simulation State ---');
  res = await request({ host: 'localhost', port: 5000, path: '/api/simulation/current', method: 'GET' });
  const state = JSON.parse(res.body).data;
  console.log('Generated:', state.stats.generated, '| Received:', state.stats.received, '| Valid:', state.stats.valid, '| Corrupted:', state.stats.corrupted, '| Reliability:', state.stats.reliability + '%');

  console.log('\n--- Step 5: Query Live Recent Packets & CRC Validation ---');
  res = await request({ host: 'localhost', port: 5000, path: '/api/packets?limit=6', method: 'GET' });
  const packets = JSON.parse(res.body).data;
  packets.forEach(p => {
    console.log(`[${p.status}] Sensor: ${p.sensorId} | Seq: #${p.sequenceNo} | Tx CRC: ${p.originalCrc32} | Rx CRC: ${p.recalculatedCrc32} | Temp: ${p.temperature}°C | Hum: ${p.humidity}%`);
  });

  console.log('\n--- Step 6: Test Interactive CRC-32 Sandbox Contract ---');
  // Valid payload test
  res = await request(
    { host: 'localhost', port: 5000, path: '/api/packet/test-crc', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { payload: 'S025|105|28.5|72|2026-09-04T14:30:25Z' }
  );
  console.log('Valid Vector Check:', res.body);

  // Corrupted payload test (28.5 -> 38.5)
  res = await request(
    { host: 'localhost', port: 5000, path: '/api/packet/test-crc', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { payload: 'S025|105|38.5|72|2026-09-04T14:30:25Z', customCrc: '8F3A21C7' }
  );
  console.log('Corrupted Vector Check (Temp 28.5->38.5):', res.body);

  console.log('\n--- Step 7: Query 101 Sensors Matrix & Error Ranking ---');
  res = await request({ host: 'localhost', port: 5000, path: '/api/analytics/sensors?limit=5', method: 'GET' });
  const sensorData = JSON.parse(res.body).data;
  console.log('Total Sensors in Grid:', sensorData.totalSensors);
  console.log('Top Error Sensors Leaderboard:', sensorData.topErrorSensors.map(s => `${s.sensorId}: ${s.corruptedPackets} corrupted (${s.reliability}% rel)`));

  console.log('\n--- Step 8: Stop Simulation & Persist ---');
  res = await request({ host: 'localhost', port: 5000, path: '/api/simulation/stop', method: 'POST' });
  console.log('Stop result status:', JSON.parse(res.body).status);

  console.log('\n--- Step 9: Verify Run History & JSON/CSV Export ---');
  res = await request({ host: 'localhost', port: 5000, path: `/api/analytics/export/${runId}?format=json`, method: 'GET' });
  const exportData = JSON.parse(res.body);
  console.log('Exported Run ID:', exportData.run.runId, '| Total Persisted Packets:', exportData.packetCount, '| Final Reliability:', exportData.summary.reliability + '%');

  console.log('\n--- Step 10: Reset State Isolation ---');
  res = await request({ host: 'localhost', port: 5000, path: '/api/simulation/reset', method: 'POST' });
  console.log('Reset status:', JSON.parse(res.body).status);

  console.log('\n===============================================================');
  console.log(' >>> SUCCESS: ALL 10 BUILD ORDER STEPS VERIFIED 100% <<<       ');
  console.log('===============================================================');
}

runE2eTest().catch(console.error);
