/**
 * PeerJS / WebRTC Network Manager
 * Host-authoritative peer-to-peer mesh handling Host, Guest, and up to 6 Spectators.
 */
import { Peer } from 'peerjs';
import { CONFIG } from '../../config.js';
import { MSG_TYPES, createHeartbeatMessage } from './protocol.js';

export class NetworkManager {
  constructor() {
    this.peer = null;
    this.peerId = null;
    this.role = null; // 'HOST' | 'GUEST' | 'SPECTATOR'
    this.roomCode = null;

    // Connections
    this.guestConnReliable = null;
    this.guestConnUnreliable = null;
    this.spectatorConns = []; // Array of { id, reliable, unreliable }

    // Latency & Metrics (F3 Debug Overlay)
    this.ping = 0;
    this.rtt = 0;
    this.snapshotRate = 0;
    this.snapshotsReceived = 0;
    this.packetLoss = 0;
    this.packetsSent = 0;
    this.packetsReceived = 0;
    this.lastHeartbeatSeq = 0;

    // Callbacks
    this.onConnected = null;
    this.onSnapshot = null;
    this.onGameEvent = null;
    this.onLobbyState = null;
    this.onDisconnect = null;
    this.onReconnect = null;
    this.onError = null;
    this.onSpectatorCountChange = null;

    this.heartbeatTimer = null;
    this.rateMetricsTimer = null;
    this.reconnectTimer = null;
    this.reconnectRemaining = 0;
  }

  // Generate random 5-character room code (e.g., 'X7K9P')
  static generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous 0/O, 1/I
    let code = '';
    for (let i = 0; i < CONFIG.ROOM_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Initialize PeerJS
  initPeer(customId = null) {
    return new Promise((resolve, reject) => {
      const peerOptions = {
        debug: 1,
        config: {
          iceServers: CONFIG.NET.ICE_SERVERS
        }
      };

      try {
        this.peer = customId ? new Peer(customId, peerOptions) : new Peer(peerOptions);
      } catch (err) {
        return reject(err);
      }

      const timeout = setTimeout(() => {
        reject(new Error("PeerJS server connection timed out after 15 seconds. Check internet or WebRTC blocker."));
      }, CONFIG.NET.CONNECTION_TIMEOUT_MS);

      this.peer.on('open', (id) => {
        clearTimeout(timeout);
        this.peerId = id;
        resolve(id);
      });

      this.peer.on('error', (err) => {
        clearTimeout(timeout);
        console.error('[PeerJS Error]', err);
        if (this.onError) this.onError(err);
      });

      this.peer.on('disconnected', () => {
        console.warn('[PeerJS] Disconnected from signaling server.');
      });
    });
  }

  // HOST: Create a Room with 5-character code
  async hostGame(desiredCode = null) {
    const code = desiredCode ? desiredCode.toUpperCase() : NetworkManager.generateRoomCode();
    const fullPeerId = `${CONFIG.APP_PREFIX}${code}`;
    this.roomCode = code;
    this.role = 'HOST';

    await this.initPeer(fullPeerId);

    // Listen for incoming guest / spectator connections
    this.peer.on('connection', (conn) => {
      this.handleIncomingConnection(conn);
    });

    this.startHeartbeatLoop();
    this.startMetricsMonitor();
    return this.roomCode;
  }

  // GUEST: Join Room by 5-character code
  async joinGame(roomCode, isSpectator = false) {
    this.roomCode = roomCode.toUpperCase();
    this.role = isSpectator ? 'SPECTATOR' : 'GUEST';

    await this.initPeer();
    const hostPeerId = `${CONFIG.APP_PREFIX}${this.roomCode}`;

    // Establish both Reliable and Unreliable data channels to Host
    return new Promise((resolve, reject) => {
      let timeout = setTimeout(() => {
        reject(new Error("Could not connect to host within 15 seconds. Ensure the room code is correct and host is online."));
      }, CONFIG.NET.CONNECTION_TIMEOUT_MS);

      const relConn = this.peer.connect(hostPeerId, {
        reliable: true,
        metadata: { channel: 'reliable', role: this.role }
      });

      const unrelConn = this.peer.connect(hostPeerId, {
        reliable: false,
        metadata: { channel: 'unreliable', role: this.role }
      });

      let relOpen = false;
      let unrelOpen = false;

      const checkBothOpen = () => {
        if (relOpen && unrelOpen) {
          clearTimeout(timeout);
          this.guestConnReliable = relConn;
          this.guestConnUnreliable = unrelConn;
          this.setupGuestListeners(relConn, unrelConn);
          this.startHeartbeatLoop();
          this.startMetricsMonitor();
          if (this.onConnected) this.onConnected({ role: this.role, roomCode: this.roomCode });
          resolve();
        }
      };

      relConn.on('open', () => {
        relOpen = true;
        checkBothOpen();
      });

      unrelConn.on('open', () => {
        unrelOpen = true;
        checkBothOpen();
      });

      relConn.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  // Handle incoming connections on Host
  handleIncomingConnection(conn) {
    const channel = conn.metadata?.channel || 'reliable';
    const role = conn.metadata?.role || 'GUEST';

    conn.on('open', () => {
      if (role === 'SPECTATOR') {
        this.addSpectatorConnection(conn, channel);
      } else {
        // Player 2 / Guest
        if (channel === 'reliable') {
          this.guestConnReliable = conn;
          this.setupHostGuestReliable(conn);
        } else {
          this.guestConnUnreliable = conn;
          this.setupHostGuestUnreliable(conn);
        }

        if (this.guestConnReliable && this.guestConnUnreliable) {
          if (this.onConnected) this.onConnected({ role: 'HOST', peerId: conn.peer, roomCode: this.roomCode });
        }
      }
    });

    conn.on('close', () => {
      this.handlePeerClose(conn);
    });
  }

  addSpectatorConnection(conn, channel) {
    let spec = this.spectatorConns.find(s => s.id === conn.peer);
    if (!spec) {
      if (this.spectatorConns.length >= CONFIG.SIM.MAX_SPECTATORS) {
        conn.close();
        return;
      }
      spec = { id: conn.peer, reliable: null, unreliable: null };
      this.spectatorConns.push(spec);
    }
    if (channel === 'reliable') spec.reliable = conn;
    else spec.unreliable = conn;

    if (this.onSpectatorCountChange) {
      this.onSpectatorCountChange(this.spectatorConns.length);
    }
  }

  setupHostGuestReliable(conn) {
    conn.on('data', (msg) => {
      if (!msg) return;
      this.packetsReceived++;
      if (msg.type === MSG_TYPES.HEARTBEAT) {
        // Echo back for ping measurement
        conn.send({ ...msg, t2: performance.now() });
      } else if (msg.type === MSG_TYPES.LOBBY_STATE) {
        if (this.onLobbyState) this.onLobbyState(msg.data);
      } else if (msg.type === MSG_TYPES.REMATCH) {
        if (this.onGameEvent) this.onGameEvent({ type: 'REMATCH_REQUEST', from: 'guest' });
      }
    });
  }

  setupHostGuestUnreliable(conn) {
    conn.on('data', (msg) => {
      if (!msg) return;
      this.packetsReceived++;
      if (msg.type === MSG_TYPES.INPUT_STATE) {
        // Host only receives guest input actions, NEVER direct state changes
        if (this.onGuestInput) this.onGuestInput(msg);
      }
    });
  }

  setupGuestListeners(relConn, unrelConn) {
    relConn.on('data', (msg) => {
      if (!msg) return;
      this.packetsReceived++;
      if (msg.type === MSG_TYPES.HEARTBEAT) {
        // Calculate round-trip time & ping
        const now = performance.now();
        this.rtt = Math.max(1, Math.round(now - msg.t0));
        this.ping = Math.round(this.rtt / 2);
      } else if (msg.type === MSG_TYPES.GAME_EVENT) {
        if (this.onGameEvent) this.onGameEvent(msg.event);
      } else if (msg.type === MSG_TYPES.LOBBY_STATE) {
        if (this.onLobbyState) this.onLobbyState(msg.data);
      }
    });

    unrelConn.on('data', (msg) => {
      if (!msg) return;
      this.packetsReceived++;
      if (msg.type === MSG_TYPES.SNAPSHOT) {
        this.snapshotsReceived++;
        if (this.onSnapshot) this.onSnapshot(msg.data, performance.now());
      }
    });

    relConn.on('close', () => this.handlePeerClose(relConn));
  }

  // Send input state from Guest to Host (60 Hz)
  sendInput(frame, action, inputDelay = 0) {
    if (this.guestConnUnreliable && this.guestConnUnreliable.open) {
      this.packetsSent++;
      this.guestConnUnreliable.send({
        type: MSG_TYPES.INPUT_STATE,
        frame,
        action,
        delay: inputDelay,
        t: performance.now()
      });
    }
  }

  // Send state snapshot from Host to Guest & Spectators (30 Hz)
  broadcastSnapshot(snapshot) {
    const packet = {
      type: MSG_TYPES.SNAPSHOT,
      data: snapshot,
      t: performance.now()
    };
    if (this.guestConnUnreliable && this.guestConnUnreliable.open) {
      this.guestConnUnreliable.send(packet);
      this.packetsSent++;
    }
    this.spectatorConns.forEach(spec => {
      if (spec.unreliable && spec.unreliable.open) {
        spec.unreliable.send(packet);
        this.packetsSent++;
      }
    });
  }

  // Send reliable game event from Host to Guest & Spectators
  broadcastEvent(event) {
    const packet = {
      type: MSG_TYPES.GAME_EVENT,
      event,
      t: performance.now()
    };
    if (this.guestConnReliable && this.guestConnReliable.open) {
      this.guestConnReliable.send(packet);
    }
    this.spectatorConns.forEach(spec => {
      if (spec.reliable && spec.reliable.open) {
        spec.reliable.send(packet);
      }
    });
  }

  // Broadcast lobby metadata / readiness
  sendLobbyState(lobbyData) {
    const packet = {
      type: MSG_TYPES.LOBBY_STATE,
      data: lobbyData
    };
    if (this.role === 'HOST') {
      if (this.guestConnReliable && this.guestConnReliable.open) {
        this.guestConnReliable.send(packet);
      }
      this.spectatorConns.forEach(spec => {
        if (spec.reliable && spec.reliable.open) spec.reliable.send(packet);
      });
    } else {
      if (this.guestConnReliable && this.guestConnReliable.open) {
        this.guestConnReliable.send(packet);
      }
    }
  }

  // Heartbeat every 2 seconds for ping and connection liveness
  startHeartbeatLoop() {
    this.stopHeartbeatLoop();
    this.heartbeatTimer = setInterval(() => {
      if (this.role === 'GUEST' && this.guestConnReliable && this.guestConnReliable.open) {
        this.lastHeartbeatSeq++;
        this.guestConnReliable.send(createHeartbeatMessage(this.lastHeartbeatSeq, performance.now()));
      }
    }, CONFIG.NET.HEARTBEAT_INTERVAL_MS);
  }

  stopHeartbeatLoop() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  // Metrics monitor for debug overlay (F3)
  startMetricsMonitor() {
    this.stopMetricsMonitor();
    this.rateMetricsTimer = setInterval(() => {
      this.snapshotRate = this.snapshotsReceived;
      this.snapshotsReceived = 0;
      this.packetLoss = this.packetsSent > 0
        ? Math.max(0, Math.round((1 - (this.packetsReceived / this.packetsSent)) * 100))
        : 0;
    }, 1000);
  }

  stopMetricsMonitor() {
    if (this.rateMetricsTimer) clearInterval(this.rateMetricsTimer);
    this.rateMetricsTimer = null;
  }

  // Disconnection handling with 10-second grace window
  handlePeerClose(conn) {
    console.warn('[PeerJS] Connection closed:', conn.peer);
    if (this.role === 'HOST' && this.guestConnReliable?.peer === conn.peer) {
      this.startReconnectCountdown();
    } else if (this.role === 'GUEST') {
      if (this.onDisconnect) this.onDisconnect({ reason: 'Host disconnected' });
    }
  }

  startReconnectCountdown() {
    this.reconnectRemaining = 10;
    if (this.onDisconnect) this.onDisconnect({ countdown: this.reconnectRemaining });

    if (this.reconnectTimer) clearInterval(this.reconnectTimer);
    this.reconnectTimer = setInterval(() => {
      this.reconnectRemaining--;
      if (this.onDisconnect) this.onDisconnect({ countdown: this.reconnectRemaining });
      if (this.reconnectRemaining <= 0) {
        clearInterval(this.reconnectTimer);
        this.reconnectTimer = null;
        if (this.onDisconnect) this.onDisconnect({ forfeitWinner: 'HOST' });
      }
    }, 1000);
  }

  disconnect() {
    this.stopHeartbeatLoop();
    this.stopMetricsMonitor();
    if (this.reconnectTimer) clearInterval(this.reconnectTimer);
    if (this.guestConnReliable) this.guestConnReliable.close();
    if (this.guestConnUnreliable) this.guestConnUnreliable.close();
    this.spectatorConns.forEach(s => {
      if (s.reliable) s.reliable.close();
      if (s.unreliable) s.unreliable.close();
    });
    this.spectatorConns = [];
    if (this.peer) this.peer.destroy();
    this.peer = null;
    this.peerId = null;
    this.role = null;
  }
}
