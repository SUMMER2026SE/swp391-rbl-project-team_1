import * as http from 'http';
import app from './app';
import { initSocket } from './services/socket.service';
import 'dotenv/config';

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO Server
initSocket(server);

// Start Server
server.listen(PORT, () => {
  
});
