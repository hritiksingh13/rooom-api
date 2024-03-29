const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "dev"
        ? process.env.DEV_CORS_URL
        : process.env.PROD_CORS_URL,
    methods: ["GET", "POST"],
  },
});

let rooms = [];

setInterval(() => {
  rooms = [];
}, 3600000);

io.on("connection", (socket) => {
  socket.on("join", ({ userId, alias, roomCode }, callback) => {
    const user = rooms.find((currentRoom) => currentRoom.userId === userId);
    if (user)
      rooms = rooms.filter((currentRoom) => currentRoom.userId === userId);
    try {
      callback(
        rooms
          .filter(
            (rooom) => rooom.roomCode === roomCode && rooom.userId !== userId
          )
          .map((user) => ({ userId: user.userId, alias: user.alias }))
      );
      rooms.push({
        socketId: socket.id,
        userId,
        alias,
        roomCode,
      });
      socket.join(roomCode);
      io.to(roomCode).emit("user joined", {
        userId,
        alias,
      });
    } catch (err) {
      console.log(err);
    }
  });
  socket.on("disconnect", () => {
    const user = rooms.find((currentRoom) => currentRoom.socketId == socket.id);
    if (user) {
      try {
        io.to(user.roomCode).emit("user disconnected", {
          userId: user.userId,
          alias: user.alias,
        });
        rooms = rooms.filter((room) => room.socketId === socket.id);
        console.log(`User ${user.alias} disconnected`);
      } catch (err) {
        console.log(err);
      }
    }
  });
  socket.on(
    "message sent",
    ({ userId, alias, roomCode, id, message, parentId }, callback) => {
      try {
        io.to(roomCode).emit("message received", {
          userId,
          alias,
          id,
          message,
          parentId,
        });
        callback(
          `User ${alias} sent a message '${message}' to room: ${roomCode}`
        );
      } catch (err) {
        callback(err);
      }
    }
  );
});

server.listen(3000, () => {
  console.log("server is now running on port 3000");
});
