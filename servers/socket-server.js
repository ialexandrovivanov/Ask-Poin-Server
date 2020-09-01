'use strict';

class SocketConnection {

  constructor(expressServer) {

    this.io = require('socket.io')(expressServer);
    this.state = require('../services/state');
    
    this.io.on('connection', (socket) => {

      const tokens = Object.keys(this.state.eventTokens);

      socket.on('join', (data) => { 
        if (tokens.includes(data.token)) { socket.join(data.room); }
        else { socket.disconnect(true); }
      });
      socket.on('message', (data) => { 
        if (tokens.includes(data.token)) { this.io.to(data.room).emit('message', data); }
        else { socket.disconnect(true); }
      });
      socket.on('event', (data) => { 
        if (tokens.includes(data.token)) { this.io.emit('event', data); }
        else { socket.disconnect(true); }
      });
      socket.on('delete', (data) => { 
        if (tokens.includes(data.token)) { this.io.to(data.room).emit('delete', data);  }
        else { socket.disconnect(true); }
      });
      socket.on('deleted', (data) => {
        if (tokens.includes(data.token)) { this.io.to(data.room).emit('deleted', data); }
        else { socket.disconnect(true); }
      });
      socket.on('deleteall', (data) => {
        if (tokens.includes(data.token)) { this.io.to(data.room).emit('deleteall', data); }
        else { socket.disconnect(true); }
      });
      socket.on('likes', (data) => { 
        if (tokens.includes(data.token)) { this.io.to(data.room).emit('likes', data); }
        else { socket.disconnect(true); }
      });
      socket.on('avatar', (data) => { 
        if (tokens.includes(data.token)) { this.io.emit('avatar', data); }
        else { socket.disconnect(true); }
      });
    });
  }
}

module.exports = SocketConnection;