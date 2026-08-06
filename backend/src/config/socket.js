const { Server } = require("socket.io");

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
    },
  });

  io.on("connection", (socket) => {
    console.log(`[SOCKET] Client connected (${socket.id})`);

    socket.on("disconnect", () => {
      console.log(`[SOCKET] Client disconnected (${socket.id})`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet");
  }
  return io;
}

module.exports = {
  initSocket,
  getIO,
};
