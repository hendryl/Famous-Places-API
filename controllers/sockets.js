var redisService = require('../helpers/redis-service');
var socketOwner = require('./socket.owner');

function logger(severity, message) {
  if(process.env.NODE_ENV === 'production') {
    if(severity !== 'debug') {
      console.log(message);
    }
  } else {
    console.log(message);
  }
}

function createConnectionHandlers(server) {
  server.on('connection', function(conn) {
    console.log('connection create ' + conn);

    socketOwner.createRoomOwnerHandlers(conn);

    conn.on('close', function() {
      console.log('connection close ' + conn);
    });
  });
}

function createServer(server) {
  var sockjs = require('sockjs');
  var sockjs_opts = {
    sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.3/sockjs.min.js",
    prefix: '/api/sockets',
    log: logger
  };

  var sockServer = sockjs.createServer(sockjs_opts);
  sockServer.installHandlers(server);
  createConnectionHandlers(sockServer);
  redisService.start();
}

module.exports = createServer;
