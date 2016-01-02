var conns = {};
var redisService = null;
var _ = require('underscore');

function prepareHandler(redis, allConns) {
  conns = allConns;
  redisService = redis;
}

function handleMessage(redis, allConns, conn, message) {
  if (message.type == null) {
    sendError(conn);

  } else if (message.type === 'join_room') {
    var room = 'room:' + message.name;
    var player = message.player;
    joinRoomWrapper(conn, room, player);

  } else {
    sendError('Unknown message type');
  }
}

function joinRoomWrapper(conn, room, player) {
  var code = room.substring(5);

  console.log('checking if player can join');

  roomExists(room).then(function(res) {
    //check room existence
    if (res < 1) {
      write(conn, {
        type: 'join_room',
        result: false,
        reason: 'No games with the code ' + code + ' found'
      });
      return;
    }

    console.log('room exists');

    redisService.getPlayersInRoom(room).then(function(players) {
      console.log('players: ' + players + ' | amount: ' + players.length);
      //check amount of players
      if (players.length === 4) {
        console.log('player');
        write(conn, {
          type: 'join_room',
          result: false,
          reason: 'Game is full'
        });
        return;
      }
      console.log('game has less than 4 players');

      //check same name
      if(players.length > 0) {
        console.log('getting player names from list of connections');
        var playerNames = _.map(players, function(n) {
          return conns[n].player;
        });

        console.log('player names: ' + playerNames);

        if (_.contains(playerNames, player)) {
          write(conn, {
            type: 'join_room',
            result: false,
            reason: 'Name is used, please use another name'
          });
          return;
        }
        console.log('player has different name than players in game');
      }

      console.log('player can join game');

      //can join room
      joinRoom(conn, room, player);
    });
  });
}

function joinRoom(conn, room, player) {
  console.log('socket player joining ' + room);

  redisService.joinRoom(room, conn.id).then(function(res) {
    console.log('join room successful');
    conn.room = room.substring(5);
    conn.role = 'player';
    conn.player = player;
    write(conn, {
      type: 'join_room',
      result: true
    });

    redisService.getRoomOwner(room).then(function(owner) {
      console.log('get owner successful');
      var ownerConn = conns[owner];

      write(ownerConn, {
        type: 'join_room',
        name: player,
        id: conn.id
      });
    }).catch(function(err) {
      console.log('failed owner get/write');
      sendError(conn, err);
    });
  }, function(err) {
    console.log('error joining room');
    sendError(conn, err);
  });
}

function roomExists(room) {
  return redisService.roomExists(room);
}

function write(conn, obj) {
  var json = JSON.stringify(obj);
  conn.write(json);
}

function sendError(conn, reason) {
  reason = reason || 'Undefined message type';

  write(conn, {
    type: 'error',
    reason: reason
  });
}

module.exports = {
  prepareHandler: prepareHandler,
  handleMessage: handleMessage
};
