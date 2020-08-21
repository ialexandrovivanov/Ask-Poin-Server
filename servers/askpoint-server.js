'use strict';

class AskPointServer {

  constructor() {

    this.express = require('express');

    this.apiServer = require('../servers/api-server');

    this.socketServer = require('../servers/socket-server');

    this.app = this.express();
    
    this.app.use(require('cors')());

    this.app.use(require('body-parser').json({ limit: '10mb', extended: true }));

    this.app.use('/api', this.apiServer);
    
    this.expressServer = this.app.listen(8800, () => this.startMessage());

    new this.socketServer(this.expressServer);
  }

  startMessage() { 
    console.clear();
    console.log(`...AskPoint server is listening`); 
  }
}

module.exports = AskPointServer;  