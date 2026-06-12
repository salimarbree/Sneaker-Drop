import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | undefined;

export function useSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io({ transports: ["websocket", "polling"] });
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
