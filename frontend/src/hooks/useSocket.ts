import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | undefined;

export function useSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";
      const socketUrl = import.meta.env.VITE_SOCKET_URL ?? apiBase.replace(/\/api$/, "");
      socket = io(socketUrl || undefined, { transports: ["websocket"] });
      window.__socket = socket;
    }

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket?.off("connect");
      socket?.off("disconnect");
    };
  }, []);

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    socket?.on(event, handler as (...args: unknown[]) => void);
    return () => {
      socket?.off(event, handler as (...args: unknown[]) => void);
    };
  }, []);

  const off = useCallback(<T>(event: string, handler: (data: T) => void) => {
    socket?.off(event, handler as (...args: unknown[]) => void);
  }, []);

  return { socket, connected, on, off };
}
