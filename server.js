
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {};

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    // Create new player state
    players[socket.id] = { x: 0, y: 0, z: 0, ry: 0 };
    
    // Send existing players to the new connection
    socket.emit('currentPlayers', players);
    // Tell others about the new player
    socket.broadcast.emit('newPlayer', { id: socket.id, state: players[socket.id] });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id] = data;
            socket.broadcast.emit('playerMoved', { id: socket.id, state: data });
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

http.listen(3000, () => console.log('Server running on http://localhost:3000'));
