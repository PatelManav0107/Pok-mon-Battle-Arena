# Pokémon Battle Arena - Real-Time Online Multiplayer

A high-performance real-time Pokémon tactical stadium battle game built with **Phaser 3 / Canvas + Vite** featuring full **Host-Authoritative WebRTC Online Multiplayer (PeerJS)**, decoupled 60Hz deterministic simulation, 22 iconic Pokémon with custom signature move animations and 22 full-screen Anime Ultimate Cutscenes.

---

## 🚀 Key Architectural Features

1. **Decoupled 60Hz Simulation (`src/sim/`)**:
   - Fixed timestep of 60 updates per second (`TICK_RATE = 60`, `dt = 1/60`).
   - Pure logic engine consuming player input states and outputting game states + events without any dependency on browser DOM or Phaser objects.
   - Deterministic Mulberry32 seeded pseudo-random number generator (`src/sim/rng.js`).

2. **Host-Authoritative WebRTC Multiplayer (`src/net/`)**:
   - **Zero backend server required**: P2P data channels via PeerJS, completely static files ready for GitHub Pages or Netlify.
   - **Host**: Runs the authoritative 60Hz simulation, ingests guest input actions, and broadcasts delta snapshots at 30Hz (`reliable: false`) plus gameplay events (`reliable: true`).
   - **Guest**: Captures 60Hz inputs, applies client-side prediction, and interpolates between snapshots with a ~100ms jitter buffer for silky smooth combat.
   - **Spectators**: Up to 6 spectators can join any room with the same 5-character code and watch in real-time.

3. **Lobby & Match Customization**:
   - Short 5-character room code (e.g., `7K9P2`) with quick copy and share link (`?room=ABCDE`).
   - Host configures: Arena (Classic Stadium, Volcano Caldera, Water Gym, Cyber Void), Team size (1, 2, 3, or 4 Pokémon), Best of 1 or Best of 3, and Battle Timer.
   - Synchronized 3-2-1 countdown when both players lock in.

4. **Robustness & Diagnostics**:
   - Heartbeat every 2 seconds with live ping / RTT measurement.
   - 10-second reconnect grace window if a player disconnects.
   - Non-pausing Esc menu for online matches.
   - F3 Debug Overlay showing Ping, Snapshot Rate, Packet Loss, and Simulation Tick.
   - Configurable STUN / TURN servers in `config.js` with 15-second timeout diagnostics.
   - Automatic key release on window blur + "Waiting for player" indicator.

---

## 🕹️ Controls & Hotkeys

| Action | Keyboard Key | Mobile Touch |
| :--- | :--- | :--- |
| **Moves 1 to 4** | `1`, `2`, `3`, `4` | On-screen Move buttons |
| **Ultimate Overdrive** | `U` or `Space` | Golden Ultimate Overdrive Banner |
| **Switch Pokémon** | `S` (Toggle team drawer) | Switch [S] Button |
| **Switch Slot Pick** | `1`, `2`, `3`, `4` (Inside switch drawer) | Tap bench member card |
| **Debug Monitor** | `F3` | Top-right "F3 Ping" Header button |
| **In-Game Menu** | `Esc` | Top-right "🏠 Menu" Header button |

---

## 📦 How to Run Locally

### 1. Install Dependencies
```bash
cd pokemon-battle-arena
npm install
```

### 2. Start Vite Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5173`.

---

## 🧪 Step-by-Step Local Testing Guide (Two Windows + Spectator)

### Window 1: The Host (Normal Window)
1. Open `http://localhost:5173` in your normal browser window.
2. Click **Play Online** -> **Host Room**.
3. Note your 5-character Room Code (e.g. `ABCDE`) or click **Share Link**.
4. Configure match rules (e.g., Stadium Arena, 4 vs 4, 90s timer).
5. Click **Edit Squad** to customize your 4 Pokémon or keep the defaults.

### Window 2: The Guest (Incognito Window)
1. Open an **Incognito / Private** browser window.
2. Navigate to `http://localhost:5173` (or paste the share link `http://localhost:5173?room=ABCDE`).
3. If not using the share link, click **Play Online** -> **Join Room**, enter the 5-character code, and click **Join as Player**.
4. Notice both windows now show both players connected with live ping!
5. In Window 2, click **Ready!**.
6. In Window 1, click **Ready!**.
7. Watch the synchronized **3-2-1 Countdown** and battle start!

### Window 3: The Spectator (Optional Third Window)
1. Open another browser tab at `http://localhost:5173`.
2. Click **Play Online** -> **Join Room**, enter the code, and click **Watch (Spectate)**.
3. Confirm the spectator counter in the lobby / header shows `1 / 6`, and the spectator sees both Pokémon battling in real-time!

### Testing Combat, Moves, & Ultimate Cinematic:
1. In Window 1, press `1` to use Move 1 (e.g. Thunderbolt). Observe the move animation, hit reaction, knockback, and floating damage numbers on both screens.
2. Build Ultimate charge (or click the cheat/debug "Fill Ult" button in header).
3. Press `U` or `Space` to trigger the Ultimate move:
   - Notice both screens freeze in sync for the full-screen Anime Ultimate Cut-In!
   - Watch the Pokémon portrait zoom, anime speedlines, typography slam, and arena attack!
4. Press `F3` in either window to inspect real-time Ping, Snapshot rate (30 Hz), and Packet loss.
5. Close Window 2 to observe the 10-second reconnect countdown banner.

---

## 🚢 Production Build & Deployment

To build static files for GitHub Pages or Netlify:
```bash
npm run build
```
The output will be generated in `dist/`. Deploy the `dist/` folder directly to any static web host!
