const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'dev'
        ? process.env.DEV_CORS_URL
        : process.env.PROD_CORS_URL,
    methods: ['GET', 'POST'],
  },
});

let rooms = [];

setInterval(() => {
  rooms = [];
}, 3600000);

io.on('connection', (socket) => {
  socket.on('join', ({ id, userName, room }, callback) => {
    const user = rooms.find((currentRoom) => currentRoom.userId === id);
    if (user) rooms = rooms.filter((currentRoom) => currentRoom.userId === id);
    rooms.push({
      socketId: socket.id,
      userId: id,
      userName: userName,
      room: room,
    });
    try {
      socket.join(room);
      io.to(room).emit('user joined', {
        joinedUserId: id,
        joinedUserName: userName,
      });
      callback(`User ${userName} successfully joined with id: ${id}`);
    } catch (err) {
      callback(err);
    }
  });
  socket.on('disconnect', () => {
    const user = rooms.find((currentRoom) => currentRoom.socketId == socket.id);
    if (user) {
      try {
        io.to(user.room).emit('user disconnected', {
          disconnectedUserId: user.userId,
          disconnectedUserName: user.userName,
        });
        rooms = rooms.filter((room) => room.socketId === socket.id);
        console.log(`User ${user.name} disconnected`);
      } catch (err) {
        console.log(err);
      }
    }
  });
  socket.on('message sent', ({ id, userName, room, message }, callback) => {
    try {
      io.to(room).emit('message received', { id, userName, message });
      callback(`User ${userName} sent a message '${message}' to room: ${room}`);
    } catch (err) {
      callback(err);
    }
  });
});

server.listen(3000, () => {
  console.log('server is now running on port 3000');
});
