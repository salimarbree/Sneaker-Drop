import "./shared/types/index.js";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";
import { prisma } from "./shared/lib/prisma.js";
import dropRoutes from "./modules/drop/routes.js";
import reservationRoutes from "./modules/reservation/routes.js";
import purchaseRoutes from "./modules/purchase/routes.js";
import userRoutes from "./modules/user/routes.js";
import uploadRoutes from "./modules/upload/routes.js";
import { errorHandler } from "./shared/middlewares/errorHandler.js";
import { setupSocketHandlers } from "./shared/socket/index.js";
import { startStockRecovery } from "./services/stockRecovery.service.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.use("/api/drops", dropRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);

app.use(errorHandler);

setupSocketHandlers(io, prisma);

export default app;

if (!process.env.VERCEL) {
  startStockRecovery(prisma, io);
  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
