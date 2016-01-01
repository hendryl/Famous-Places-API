var redisService = require('../helpers/redis-service');
var handleOwnerSocket = require('./socket.owner');
var handlePlayerSocket = require('./socket.player');
var gameUtils = require('../helpers/game-utils');
var _ = require('underscore');

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
      var json = null;
      message = JSON.parse(message);

      if (message.role === null) {
        json = JSON.stringify({
          type: 'error',
          reason: 'Undefined role'
        });
        conn.write(json);

      } else if (message.role === 'owner') {
        handleOwnerSocket(redisService, conns, conn, message);
      } else if (message.role === 'player') {
        handlePlayerSocket(redisService, conns, conn, message);
      } else {
        json = JSON.stringify({
          type: 'error',
          reason: 'Unknown role'
        });
        conn.write(json);
      }
    });

    conn.on('close', function() {
      console.log('connection close ' + conn);
      conns[conn.id] = undefined;

      if (conn.role === 'owner') {
        disconnectOwner(conn);
      } else {
        disconnectPlayer(conn);
      }
    });
  });
}

function disconnectOwner(conn) {
  //send info to players that room is deleted
  var room = 'room:' + conn.room;

  redisService.getPlayersInRoom(room).then(function(players) {
    var json = JSON.stringify({
      'type': 'owner_disconnect'
    });

    _.each(players, function(n) {
      console.log('writing to player ' + n);
      conns[n].write(json);
      conns[n].close();
      conns[n] = undefined;
    });
  });

  redisService.deleteRoom(room);
  //end game in database
  gameUtils.endGame(conn.room);
}

function disconnectPlayer(conn) {
  //send info to owner that player disconnected
  var room = 'room:' + conn.room;
  redisService.getRoomOwner(room).then(function(owner) {

    if(owner == null) {
      console.log('owner already disconnected');
      return;
    }

    var json = JSON.stringify({
      'type': 'player_disconnect',
      'id': conn.id
    });

    conns[owner].write(json);
  });

  redisService.leaveRoom(room, conn.id);
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
