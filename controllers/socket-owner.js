var _ = require('underscore');
var gameUtils = require('../helpers/game-utils');
var writeService = require('../helpers/write-service');
var redisService = null;
var conns = {};

function prepareHandler(redis, allConns) {
  conns = allConns;
  redisService = redis;
}

function handleMessage(conn, message) {
  var room = null;

  if (message.type == null) {
    writeService.writeError(conn);
    
  } else if (message.type === 'create_room') {
    conn.room = message.name;
    conn.role = 'owner';

    room = 'room:' + conn.room;
    var owner = conn.id;
    createRoom(conn, room, owner);

  } else if (message.type === 'delete_room') {
    room = 'room:' + message.name;
    deleteRoom(conn, room);
    conn.room = undefined;

  } else {
    writeService.writeError('Unknown message type');
  }
}

function createRoom(conn, room, owner) {
  redisService.createRoom(room, owner).then(function(res) {
    writeService.write(conn, {
      type: 'create_room',
      result: true
    });
  }).catch(function(err) {
    writeService.writeError(conn, err);
  });
}

function deleteRoom(conn, room) {
  redisService.deleteRoom(room).then(function(res) {
    writeService.write(conn, {
      type: 'delete_room',
      result: true
    });
  }).catch(function(err) {
    writeService.writeError(conn, err);
  });
}

function disconnect(conn) {
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

module.exports = {
  prepareHandler: prepareHandler,
  handleMessage: handleMessage,
  disconnect: disconnect
};
