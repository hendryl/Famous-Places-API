var redisService = require('../helpers/redis-service');
var writeService = require('../helpers/write-service');
var ownerSocket = require('./socket-owner');
var playerSocket = require('./socket-player');

var conns = {};

function logger(severity, message) {
  if (process.env.NODE_ENV === 'production') {
    if (severity !== 'debug') {
      console.log(message);
    }
  } else {
    console.log(message);
  }
}

function createConnectionHandlers(server) {
  server.on('connection', function(conn) {
    console.log('connection create ' + conn);
    conns[conn.id] = conn;

    conn.on('data', function(message) {
      message = JSON.parse(message);

      if (message.role === null) {
        writeService.writeError(conn, 'Undefined role');

      } else if (message.role === 'owner') {
        ownerSocket.handleMessage(conn, message);

      } else if (message.role === 'player') {
        playerSocket.handleMessage(conn, message);

      } else {
        writeService.writeError(conn, 'Unknown role');
      }
    });

    conn.on('close', function() {
      console.log('connection close ' + conn);
      conns[conn.id] = undefined;

      if (conn.role === 'owner') {
        ownerSocket.disconnect(conn);
      } else {
        playerSocket.disconnect(conn);
      }
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

  ownerSocket.prepareHandler(redisService, conns);
  playerSocket.prepareHandler(redisService, conns);
}

module.exports = createServer;
