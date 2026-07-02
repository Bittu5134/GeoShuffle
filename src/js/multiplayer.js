const BASKET_BASE_URL = "https://peerbasket.bittu.dev/basket";

let peer = null;
let conn = null;
let roomCode = null;
let role = null; // "host" | "guest"
let isMatchmaking = false;

let heartbeatInterval = null;
let connectionTimeout = null;
let p2pHeartbeatInterval = null;
let missedPongsCount = 0;
let matchmakingPeersSeen = new Set();

function startP2PHeartbeat() {
  if (p2pHeartbeatInterval) clearInterval(p2pHeartbeatInterval);
  missedPongsCount = 0;

  p2pHeartbeatInterval = setInterval(() => {
    if (conn && conn.open) {
      missedPongsCount++;
      if (missedPongsCount > 2) {
        console.warn("Connection lost (missed pongs). Disconnecting.");
        stopP2PHeartbeat();
        if (conn) conn.close();
        return;
      }
      conn.send({ type: "ping" });
    } else {
      stopP2PHeartbeat();
    }
  }, 10000); // Every 10 seconds
}

function stopP2PHeartbeat() {
  if (p2pHeartbeatInterval) {
    clearInterval(p2pHeartbeatInterval);
    p2pHeartbeatInterval = null;
  }
}

// Callbacks registered by main coordinator
let callbacks = {
  onStatusUpdate: () => {},
  onConnectionEstablished: () => {},
  onMatchStart: () => {},
  onOpponentMove: () => {},
  onOpponentVictory: () => {},
  onOpponentDisconnect: () => {},
  onRequestNewGame: () => {},
  onOpponentReadyReplay: () => {},
};

export function initMultiplayer(cbs) {
  callbacks = { ...callbacks, ...cbs };
}

export function getRoomCode() {
  return roomCode;
}
export function getRole() {
  return role;
}
export function getPeerId() {
  return peer ? peer.id : null;
}
export function isConnected() {
  return conn && conn.open;
}

// Core clean up routine
export function cancelMultiplayer() {
  isMatchmaking = false;
  role = null;
  roomCode = null;

  stopP2PHeartbeat();
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (conn) {
    conn.close();
    conn = null;
  }

  if (peer) {
    peer.destroy();
    peer = null;
  }

  matchmakingPeersSeen.clear();
  callbacks.onStatusUpdate("Solo mode active.");
}

export function disconnectOpponent() {
  isMatchmaking = false;
  role = null;
  roomCode = null;

  stopP2PHeartbeat();
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (conn) {
    conn.close();
    conn = null;
  }

  matchmakingPeersSeen.clear();
}

export async function preConnectPeer() {
  try {
    await ensurePeerInitialized();
    callbacks.onStatusUpdate("Multiplayer engine ready.");
  } catch (err) {
    console.error("Pre-connect failed:", err);
  }
}

// Spawns a PeerJS client instance and returns a promise resolving with the Peer ID
function ensurePeerInitialized() {
  return new Promise((resolve, reject) => {
    if (peer && !peer.destroyed) {
      if (peer.disconnected) {
        console.log("PeerJS disconnected, attempting to reconnect...");
        peer.reconnect();
      }
      if (peer.id) resolve(peer.id);
      else {
        peer.once("open", (id) => resolve(id));
      }
      return;
    }

    if (typeof window.Peer === "undefined") {
      reject(new Error("PeerJS is not loaded from CDN yet."));
      return;
    }

    callbacks.onStatusUpdate("Initializing network...");
    peer = new window.Peer(null, {
      debug: 1, // Print only errors
    });

    peer.on("open", (id) => {
      console.log("PeerJS opened. ID:", id);
      resolve(id);
    });

    peer.on("connection", (incomingConn) => {
      handleIncomingConnection(incomingConn);
    });

    peer.on("error", (err) => {
      console.error("PeerJS error:", err);
      callbacks.onStatusUpdate("Network error: " + err.type);
      reject(err);
    });

    peer.on("close", () => {
      console.log("PeerJS closed");
      cancelMultiplayer();
    });
  });
}

// Registers peer ID to PeerBasket room basket
async function postToBasket(basketId, myPeerId) {
  const url = `${BASKET_BASE_URL}/${basketId}?limit=20`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peer_id: myPeerId }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return data.peers || [];
  } catch (err) {
    console.error("PeerBasket poll failed:", err);
    return [];
  }
}

// ----------------- HOSTING FLOW -----------------
export async function hostGame() {
  cancelMultiplayer();
  role = "host";

  // Generate random 6 letter room code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  roomCode = code;
  const basketId = `geoshuffle-${code}`;

  try {
    const myId = await ensurePeerInitialized();
    callbacks.onStatusUpdate(
      `Lobby created: [${code}]. Waiting for opponent...`,
    );

    // Poll PeerBasket to register/keep-alive
    await postToBasket(basketId, myId);
    heartbeatInterval = setInterval(async () => {
      await postToBasket(basketId, myId);
    }, 12000);
  } catch (err) {
    console.error("Failed to host game:", err);
    callbacks.onStatusUpdate("Lobby creation failed.");
  }
}

// ----------------- JOINING FLOW -----------------
export async function joinGame(code) {
  cancelMultiplayer();
  role = "guest";
  roomCode = code.trim().toUpperCase();
  const basketId = `geoshuffle-${roomCode}`;

  try {
    const myId = await ensurePeerInitialized();
    callbacks.onStatusUpdate("Locating lobby...");

    // Retrieve peers in room
    const peers = await postToBasket(basketId, myId);
    const hostId = peers.find((id) => id !== myId);

    if (!hostId) {
      callbacks.onStatusUpdate("Lobby not found. Check code.");
      cancelMultiplayer();
      return;
    }

    callbacks.onStatusUpdate("Handshaking with host...");
    connectToPeer(hostId);
  } catch (err) {
    console.error("Failed to join game:", err);
    callbacks.onStatusUpdate("Join failed.");
  }
}

// ----------------- QUICK MATCH MATCHMAKING FLOW -----------------
export async function startQuickMatch() {
  disconnectOpponent();
  isMatchmaking = true;
  callbacks.onStatusUpdate("Searching for opponent...");

  try {
    const myId = await ensurePeerInitialized();
    await performMatchmakingTick(myId);

    // Poll public matchmaking room every 12 seconds to find seekers or refresh heartbeat
    heartbeatInterval = setInterval(async () => {
      if (!isMatchmaking) return;
      await performMatchmakingTick(myId);
    }, 12000);
  } catch (err) {
    console.error("Matchmaking error:", err);
    callbacks.onStatusUpdate("Matchmaking failed.");
  }
}

async function performMatchmakingTick(myId) {
  const basketId = "geoshuffle-public-matchmaking";
  const peers = await postToBasket(basketId, myId);
  if (!isMatchmaking) return;

  const seekers = peers.filter((id) => id !== myId);
  if (seekers.length === 0) {
    callbacks.onStatusUpdate("Queue empty. Searching...");
    return;
  }

  // Attempt to connect to the oldest peer we haven't tried yet
  for (const targetId of seekers) {
    if (matchmakingPeersSeen.has(targetId)) continue;
    matchmakingPeersSeen.add(targetId);

    // Let the peer ID with lexicographically smaller ID act as the connector (Guest)
    // to prevent dual-handshake race conditions
    if (myId < targetId) {
      callbacks.onStatusUpdate("Handshaking with candidate...");
      connectToPeer(targetId, true); // True = matchmaking mode
      break;
    }
  }
}

// ----------------- DIRECT P2P DIRECT CONNECTION -----------------
function connectToPeer(targetId, matchmakingMode = false) {
  if (conn) conn.close();
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }

  conn = peer.connect(targetId, { reliable: true });

  connectionTimeout = setTimeout(() => {
    if (conn && !conn.open) {
      console.warn("Connection to", targetId, "timed out.");
      conn.close();
      conn = null;
      if (matchmakingMode) {
        callbacks.onStatusUpdate("Handshake timed out. Searching again...");
      } else {
        callbacks.onStatusUpdate("Connection timed out.");
        cancelMultiplayer();
      }
    }
  }, 10000); // 10 second timeout

  conn.on("open", () => {
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    console.log("Data connection opened with:", targetId);
    startP2PHeartbeat();
    if (matchmakingMode) {
      callbacks.onStatusUpdate("Negotiating match...");
      conn.send({ type: "match_request", senderId: peer.id });
    } else {
      // In private joining, connection open means connected
      callbacks.onStatusUpdate("Connected. Starting soon...");
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      callbacks.onConnectionEstablished();
    }
  });

  conn.on("data", (data) => {
    handleData(data);
  });

  conn.on("close", () => {
    console.log("Connection closed");
    stopP2PHeartbeat();
    callbacks.onOpponentDisconnect();
  });

  conn.on("error", (err) => {
    console.error("Connection error:", err);
  });
}

function handleIncomingConnection(incomingConn) {
  // If we are already playing a private match, ignore other connections
  if (conn && conn.open && !isMatchmaking && role !== null) {
    incomingConn.close();
    return;
  }

  if (conn) conn.close();
  conn = incomingConn;

  conn.on("open", () => {
    console.log("Incoming connection opened from:", conn.peer);
    startP2PHeartbeat();
    if (!isMatchmaking) {
      callbacks.onStatusUpdate("Connected. Starting soon...");
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      callbacks.onConnectionEstablished();
    }
  });

  conn.on("data", (data) => {
    handleData(data);
  });

  conn.on("close", () => {
    console.log("Incoming connection closed");
    stopP2PHeartbeat();
    callbacks.onOpponentDisconnect();
  });

  conn.on("error", (err) => {
    console.error("Incoming connection error:", err);
  });
}

// ----------------- MESSAGE ROUTER & HANDLERS -----------------
function handleData(data) {
  if (!data || typeof data !== "object") return;

  switch (data.type) {
    case "match_request":
      if (isMatchmaking) {
        // We accept the matchmaking request!
        // We act as Host, generate a code, and transition to playing state
        isMatchmaking = false;
        role = "host";
        roomCode =
          "MATCH-" + Math.random().toString(36).substring(2, 6).toUpperCase();

        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }

        conn.send({ type: "match_accept", roomCode });
        callbacks.onStatusUpdate("Opponent ready. Starting...");
        callbacks.onConnectionEstablished();
      }
      break;

    case "match_accept":
      if (isMatchmaking) {
        // Match accepted! We transition to guest playing state
        isMatchmaking = false;
        role = "guest";
        roomCode = data.roomCode;

        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }

        callbacks.onStatusUpdate("Connected. Waiting for host...");
        callbacks.onConnectionEstablished();
      }
      break;

    case "start_game":
      callbacks.onMatchStart(data.mapIndex, data.tiles);
      break;

    case "move_update":
      callbacks.onOpponentMove(data.moves);
      break;

    case "victory":
      callbacks.onOpponentVictory(data.time, data.moves);
      break;

    case "request_new_game":
      callbacks.onRequestNewGame();
      break;

    case "opponent_ready_replay":
      callbacks.onOpponentReadyReplay();
      break;

    case "ping":
      if (conn && conn.open) conn.send({ type: "pong" });
      break;

    case "pong":
      missedPongsCount = 0;
      break;
  }
}

// ----------------- TRANSMISSION API -----------------
export function sendGameStart(mapIndex, tiles) {
  if (conn && conn.open && role === "host") {
    conn.send({ type: "start_game", mapIndex, tiles });
  }
}

export function sendMoveUpdate(moves) {
  if (conn && conn.open) {
    conn.send({ type: "move_update", moves });
  }
}

export function sendVictory(time, moves) {
  if (conn && conn.open) {
    conn.send({ type: "victory", time, moves });
  }
}

export function requestNewGame() {
  if (conn && conn.open && role === "guest") {
    conn.send({ type: "request_new_game" });
  }
}

export function sendOpponentReadyReplay() {
  if (conn && conn.open) {
    conn.send({ type: "opponent_ready_replay" });
  }
}
