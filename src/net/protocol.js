/**
 * Network Protocol Definition for PeerJS / WebRTC
 * Distinguishes unreliable high-frequency data from reliable game events.
 */

export const MSG_TYPES = {
  // Unreliable Channel (High frequency)
  INPUT_STATE: 'INPUT_STATE', // Guest -> Host (60 Hz)
  SNAPSHOT:    'SNAPSHOT',    // Host -> Guest/Spectators (30 Hz)

  // Reliable Channel (Guaranteed order)
  GAME_EVENT:  'GAME_EVENT',  // Host -> All (hits, skills, ult, KO)
  LOBBY_STATE: 'LOBBY_STATE', // Host <-> All (player joined, settings, ready, teams)
  HEARTBEAT:   'HEARTBEAT',   // Ping / Pong / Latency measurement (every 2s)
  RECONNECT:   'RECONNECT',   // Reconnect handshake
  REMATCH:     'REMATCH',     // Rematch request / accept
  SPECTATOR:   'SPECTATOR'    // Spectator join request
};

export function createInputMessage(frame, action, inputDelay = 0) {
  return {
    type: MSG_TYPES.INPUT_STATE,
    frame,
    action,
    delay: inputDelay,
    ts: performance.now()
  };
}

export function createSnapshotMessage(snapshot) {
  return {
    type: MSG_TYPES.SNAPSHOT,
    data: snapshot,
    ts: performance.now()
  };
}

export function createEventMessage(event) {
  return {
    type: MSG_TYPES.GAME_EVENT,
    event,
    ts: performance.now()
  };
}

export function createHeartbeatMessage(sequence, clientTime) {
  return {
    type: MSG_TYPES.HEARTBEAT,
    seq: sequence,
    t0: clientTime,
    t1: performance.now()
  };
}
