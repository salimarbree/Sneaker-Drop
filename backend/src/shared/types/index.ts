import type { Request } from "express";
import type { Server as SocketIOServer } from "socket.io";

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    username: string;
  };
}

declare global {
  namespace Express {
    interface Request {
      io: SocketIOServer;
      user?: {
        userId: string;
        username: string;
      };
    }
  }
}
