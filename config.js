/**
 * Global Configuration for Pokémon Battle Arena Online
 * Configurable WebRTC STUN/TURN ICE Servers, Heartbeat & Simulation Constants
 */
export const CONFIG = {
  // Application Version & Room Namespace Prefix
  APP_PREFIX: 'PKMN-',
  ROOM_CODE_LENGTH: 5,

  // Simulation Engine Constants (Step 0)
  SIM: {
    TICK_RATE: 60,               // 60 simulation updates per second
    DT: 1 / 60,                  // Fixed timestep (seconds)
    SNAPSHOT_RATE: 30,           // 30 snapshots sent per second
    SNAPSHOT_INTERVAL_MS: 1000 / 30,
    MAX_SPECTATORS: 6,
    DEFAULT_ROUND_TIME: 90,      // Seconds
    FORCED_SWITCH_TIME: 15       // Seconds
  },

  // Network & PeerJS Options
  NET: {
    HEARTBEAT_INTERVAL_MS: 2000, // 2-second heartbeat
    CONNECTION_TIMEOUT_MS: 15000,// 15-second timeout for P2P connection
    RECONNECT_WINDOW_MS: 10000,  // 10-second grace window to reconnect
    INTERPOLATION_OFFSET_MS: 100,// 100ms client interpolation delay buffer
    DEFAULT_INPUT_DELAY_FRAMES: 1,// 0 to 6 frames optional delay
    MAX_INPUT_DELAY_FRAMES: 6,

    // Public Google & Mozilla STUN servers + Optional custom TURN
    ICE_SERVERS: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' },
      // Optional: Add your custom TURN server credentials below:
      // {
      //   urls: 'turn:turn.example.com:3478',
      //   username: 'user',
      //   credential: 'password'
      // }
    ]
  }
};
