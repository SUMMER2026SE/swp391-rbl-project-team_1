import dotenv from "dotenv";
import { createServer } from "http";
import app, { allowedOrigins } from "./app";
import { initSocket } from "./services/socket.service";

dotenv.config();

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initSocket(httpServer, allowedOrigins);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});