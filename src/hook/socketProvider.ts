import { io, Socket } from "socket.io-client";

/**
 * socketProvider.ts — one socket.io-client singleton for the entire app.
 *
 * Both PlanBoard and DesignBoard import the same socket instance.
 * No duplicate connections.
 *
 * Auth token is read from localStorage after login.
 * The socket connects lazily on first import — it will not connect if
 * the user is not logged in (token will be null and the server will reject).
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

function getToken(): string | null {
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}

let socketInstance: Socket | null = null;

/**
 * getSocket()
 *
 * Returns the singleton socket. Creates it on first call.
 * Call this inside components / hooks — not at module level —
 * so the token is available after the user has logged in.
 *
 * Usage:
 *   const socket = getSocket();
 */
export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      auth: { token: getToken() },
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("[socket] connected:", socketInstance?.id);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("[socket] connect_error:", err.message);
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn("[socket] disconnected:", reason);
    });
  }

  return socketInstance;
}

/**
 * disconnectSocket()
 *
 * Call on logout to tear down the connection and allow a fresh
 * socket to be created next time getSocket() is called.
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}