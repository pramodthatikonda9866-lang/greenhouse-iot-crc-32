/**
 * Socket.IO Telemetry Handler
 * Manages WebSocket connections for real-time packet feeds and simulation telemetry
 */

function setupSocketIO(io, simulator) {
  io.on('connection', (socket) => {
    // Send immediate initial state to connected client
    socket.emit('simulation:state', {
      status: simulator.status,
      runId: simulator.currentRunId,
      config: simulator.config,
      stats: simulator.stats
    });

    if (simulator.recentPackets.length > 0) {
      socket.emit('packets:stream', simulator.recentPackets.slice(0, 30));
    }

    // Client commands over socket
    socket.on('simulation:start', async (config, callback) => {
      try {
        const result = await simulator.start(config);
        if (typeof callback === 'function') callback({ success: true, ...result });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on('simulation:stop', async (_, callback) => {
      try {
        const result = await simulator.stop();
        if (typeof callback === 'function') callback({ success: true, ...result });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on('simulation:reset', (_, callback) => {
      try {
        const result = simulator.reset();
        if (typeof callback === 'function') callback({ success: true, ...result });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });
  });
}

module.exports = setupSocketIO;
