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
  if (message.type == null) {
    writeService.writeError(conn);

  } else if (message.type === 'create_room') {
    conn.role = 'owner';
    createRoom(conn, message.name);

  } else if (message.type === 'delete_room') {
    disconnect(conn);

  } else if (message.type === 'game_ready') {
    sendGameReady(conn);

  } else if (message.type === 'start_round') {
    startRound(conn);

  } else if (message.type === 'end_round') {
    endRound(conn);

  } else {
    writeService.writeError('Unknown message type');
  }
}

function createRoom(conn, code) {
  var room = redisService.getRoomNameForCode(code);
  var owner = conn.id;

  redisService.createRoom(room, owner).then(function(res) {
    writeService.write(conn, {
      type: 'create_room',
      result: true
    });
    conn.room = code;

  }).catch(function(err) {
    writeService.writeError(conn, err);
  });
}

function disconnect(conn) {
  var room = redisService.getRoomNameForCode(conn.room);

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

  conn.close();
  conns[conn.id] = undefined;
}

module.exports = {
  prepareHandler: prepareHandler,
  handleMessage: handleMessage,
  disconnect: disconnect
};

function sendToPlayers(conn, obj) {
  var room = redisService.getRoomNameForCode(conn.room);

  redisService.getPlayersInRoom(room).then(function(players) {
    _.each(players, function(n) {
      writeService.write(conns[n], obj);
    });
  });
}

function sendGameReady(conn) {
  var obj = {
    'type': 'game_ready'
  };

  sendToPlayers(conn, obj);
}

function startRound(conn) {
  var obj = {
    'type': 'start_round'
  };

  sendToPlayers(conn, obj);
}

function endRound(conn) {
  var obj = {
    'type': 'end_round'
  };

  sendToPlayers(conn, obj);
}
