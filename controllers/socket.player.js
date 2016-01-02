var conns = {};
var redisService = null;
var _ = require('underscore');
var writeService = require('../helpers/write-service');

function prepareHandler(redis, allConns) {
  conns = allConns;
  redisService = redis;
}

function handleMessage(redis, allConns, conn, message) {
  if (message.type == null) {
    writeService.writeError(conn);

  } else if (message.type === 'join_room') {
    joinRoomWrapper(conn, message.name, message.player);

  } else {
    writeService.writeError('Unknown message type');
  }
}

function disconnect(conn) {
  //send info to owner that player disconnected
  var room = 'room:' + conn.room;
  redisService.getRoomOwner(room).then(function(owner) {

    if (owner == null) {
      console.log('owner already disconnected');
      return;
    }

    writeService.write(conns[owner], {
      'type': 'player_disconnect',
      'id': conn.id
    });
  });

  redisService.leaveRoom(room, conn.id);
}

function joinRoomWrapper(conn, code, player) {
  var room = 'room:' + code;
  console.log('checking if player can join');

  checkRoomExists.then(function(exist) {
    if(!exist) {
      writeService.writeJoinError(conn, 'No games with the code ' + code + ' found');
      return;
    }

    console.log('room exists');

    redisService.getPlayersInRoom(room).then(function(players) {
      console.log('players: ' + players + ' | amount: ' + players.length);

      if (players.length === 4) {
        writeService.writeJoinError(conn, 'Game is full');
        return;
      }

      console.log('game has less than 4 players');

      if (players.length > 0 && checkSameName(players, player)) {
        writeService.writeJoinError(conn, 'Name is used, please use another name');
        return;
      }

      console.log('player has unique name');
      joinRoom(conn, room, player);
    });
  });
}

function checkRoomExists(room) {
  return new Promise(function(resolve, reject) {
    redisService.roomExists(room).then(function(res) {
      //check room existence
      var result = res < 1 ? false : true;
      resolve(result);
    });
  });
}

function checkSameName(players, player) {
  console.log('getting player names from list of connections');
  var playerNames = _.map(players, function(n) {
    return conns[n].player;
  });

  console.log('player names: ' + playerNames);
  return _.contains(playerNames, player);
}

function joinRoom(conn, room, player) {
  console.log('socket player joining ' + room);

  redisService.joinRoom(room, conn.id).then(function(res) {
    console.log('join room successful');
    conn.room = room.substring(5);
    conn.role = 'player';
    conn.player = player;
    writeService.write(conn, {
      type: 'join_room',
      result: true
    });

    redisService.getRoomOwner(room).then(function(owner) {
      console.log('get owner successful');
      var ownerConn = conns[owner];

      writeService.write(ownerConn, {
        type: 'join_room',
        name: player,
        id: conn.id
      });
    }).catch(function(err) {
      console.log('failed owner get/write');
      writeService.writeError(conn, err);
    });
  }, function(err) {
    console.log('error joining room');
    writeService.writeError(conn, err);
  });
}

module.exports = {
  prepareHandler: prepareHandler,
  handleMessage: handleMessage,
  disconnect: disconnect
};
