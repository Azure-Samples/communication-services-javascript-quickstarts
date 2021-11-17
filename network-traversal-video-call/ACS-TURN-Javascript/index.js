// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const turnCred = require("./getRelayConfiguration");

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

app.get('/getcredentials', async function(req, res) {
    const config = await turnCred.getConfig();
  });

// When a socket connects, set up the specific listeners we will use.
io.on('connection', function(socket) {
    // When a client tries to join a room, only allow them if they are first or
    // second in the room. Otherwise it is full.
    socket.on('join', function(room) {
      var clients = io.sockets.adapter.rooms[room];
      var numClients = (typeof clients !== 'undefined') ? clients.length : 0;
      
      if (numClients == 0) {
        socket.join(room);
      } else if(numClients === 1) {
        socket.join(room);
        // When the client is second to join the room, both clients are ready.
        socket.emit('ready', room);
        socket.broadcast.emit('ready', room);
      } else {
        socket.emit('full', room);
      }
    });
  
    // When receiving the token message, use the REST API to request an
    // token to get ephemeral credentials to use the TURN server.
    socket.on('token', function() {
        // Return the token to the browser.
        socket.emit('token', 'NONE');
    });
  
    // Relay candidate messages
    socket.on('candidate', function(candidate) {
      socket.broadcast.emit('candidate', candidate);
    });
  
    // Relay offers
    socket.on('offer', function(offer) {
      socket.broadcast.emit('offer', offer);
    });
  
    // Relay answers
    socket.on('answer', function(answer) {
      socket.broadcast.emit('answer', answer);
    });
  });

http.listen(3000, () => {
  console.log('listening on *:3000');
});
