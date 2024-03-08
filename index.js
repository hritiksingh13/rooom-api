const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
});

let rooms = [];

setInterval(() => {
  rooms = [];
},3600000);

io.on('connection', (socket) => {
  socket.on('join', ({ id, userName, room }) => {
    const user = rooms.find((currentRoom) => currentRoom.userId === id);
    if (user) rooms = rooms.filter((currentRoom) => currentRoom.userId === id);
    rooms.push({
      socketId: socket.id,
      userId: id,
      userName: userName,
      room: room,
    });
    socket.join(room);
    io.to(room).emit('user joined', {
      joinedUserId: id,
      joinedUserName: userName,
    });
  });
  socket.on('disconnect', () => {
    console.log(socket.id);
    const user = rooms.find((currentRoom) => currentRoom.socketId == socket.id);
    if (user) {
      io.to(user.room).emit('user disconnected', {
        disconnectedUserId: user.userId,
        disconnectedUserName: user.userName,
      });
      rooms = rooms.filter((room) => room.socketId === socket.id);
    }
  });
  socket.on('message sent', ({ id, userName, room, message }) => {
    io.to(room).emit('message received', { id, userName, message });
  });
});

server.listen(3000, () => {
  console.log('server is now running at http://localhost:3000');
});
