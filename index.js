const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
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

const rooms = [];

io.on('connection', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    rooms.push({ id: socket.id, name: name, room: room });
    console.log(rooms);
    socket.join(room);
    console.log(`User ${name} joined ${room}`);
    callback();
  });
  // socket.on("disconnect", () => {
  //   const user = rooms.find((currentRoom) => currentRoom.id === socket.id);
  //   io.to(user.room).emit("chat message", `${user.name} just left the room`);
  // });
  socket.on('chat message', ({ name, room, message }) => {
    console.log(`Message to room: ${room} from ${name}: ${message}`);
    io.to(room).emit('chat message', { name, ackRoom: room, message });
  });
});

server.listen(3000, () => {
  console.log('server is now running at http://localhost:3000');
});
