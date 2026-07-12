const { WebSocketServer }   = require("ws");
const { setupWSConnection }  = require("y-websocket/bin/utils");
import * as Y from "yjs";

/**
 * yjsServer.js — Yjs WebSocket server.
 *
 * Mounted on /yjs/:projectId.
 * Each project+boardType pair gets its own Y.Doc.
 * Handles:
 *   - Y.Text CRDT for text fields (simultaneous typing, no conflicts)
 *   - Awareness for drag locks + live cursors (ephemeral, never written to DB)
 *
 * Docs are persisted in memory only (can add y-mongodb-persistence later).
 * Awareness auto-clears when a user disconnects (Yjs handles this).
 *
 * Install: npm install yjs y-websocket
 */

// In-memory doc store: key = "projectId:boardType"
const docs = new Map();

function getDoc(projectId: string, boardType: string = "plan"): Y.Doc {
  const key = `${projectId}:${boardType}`;
  if (!docs.has(key)) {
    docs.set(key, new Y.Doc());
  }
  return docs.get(key) as Y.Doc;
}

/**
 * setupYjs(httpServer)
 *
 * Call this in server.js after creating the HTTP server:
 *
 *   const { setupYjs } = require("./src/yjs/yjsServer");
 *   setupYjs(httpServer);
 */
function setupYjs(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: /^\/yjs\//,  // matches /yjs/anything
  });

  wss.on("connection", (ws, req) => {
    // URL format: /yjs/:projectId/:boardType
    // e.g. /yjs/665abc123/plan
    const parts      = req.url.split("/").filter(Boolean); // ["yjs","projectId","boardType"]
    const projectId  = parts[1];
    const boardType  = parts[2] || "plan";

    if (!projectId) {
      ws.close(1008, "projectId required");
      return;
    }

    const doc = getDoc(projectId, boardType);

    // setupWSConnection handles:
    //   - Yjs sync protocol (awareness + document updates)
    //   - Broadcasting updates to all peers in the same doc
    //   - Cleanup on disconnect (awareness entries removed automatically)
    setupWSConnection(ws, req, { doc, gc: true });

    console.log(`[yjsServer] client connected to ${projectId}:${boardType}`);
  });

  console.log("[yjsServer] Yjs WebSocket server attached on /yjs/*");
}

module.exports = { setupYjs, getDoc };