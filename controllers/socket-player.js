var _ = require('underscore');
var writeService = require('../helpers/write-service');
var conns = {};
var redisService = null;

function prepareHandler(redis, allConns) {
  conns = allConns;
  redisService = redis;
}

function handleMessage(conn, message) {
  if (message.type == null) {
    writeService.writeError(conn);

  } else if (message.type === 'join_room') {
    joinRoomWrapper(conn, message.name, message.player);

  } else if (message.type === 'players_ready') {
    handlePlayersReady(conn);

  } else if(message.type === 'answer') {
    handleAnswer(conn, message);

  } else if(message.type === 'continue') {
    handleContinue(conn);

  } else if(message.type === 'player_create') {
    handlePlayerCreate(conn);

  } else if(message.type === 'player_select') {
    handlePlayerSelect(conn, message.mode_id);

  } else {
    writeService.writeError('Unknown message type');
  }

  console.log('received a player message of type: ' + message.type);
}

function handleAnswer(conn, message) {
  var room = redisService.getRoomNameForCode(conn.room);
  var obj = {
    'type': 'answer',
    'lat': message.lat,
    'long': message.long,
    'round': message.round,
    'player': conn.id
  };

  redisService.getRoomOwner(room).then(function(owner) {
    writeService.write(conns[owner], obj);
  });
}

function broadcast(room, message) {
  redisService.getRoomOwner(room).then(function(owner) {
    writeService.write(conns[owner], message);
  });

  redisService.getPlayersInRoom(room).then(function(players) {
    _.each(players, function(p) {
      console.log('sending to ' + p);
      writeService.write(conns[p], message);
    });
  });
}

function handlePlayersReady(conn) {
  var room = redisService.getRoomNameForCode(conn.room);
  var message = {
    'type': 'players_ready'
  };

  redisService.setInLobby(room, 'no');
  broadcast(room, message);
}

function handleContinue(conn) {
  var room = redisService.getRoomNameForCode(conn.room);
  var message = {
    'type': 'continue'
  };

  broadcast(room, message);
}

function handlePlayerCreate(conn) {
  var room = redisService.getRoomNameForCode(conn.room);
  var message = {
    'type': 'player_create',
    'player': conn.id
  };

  broadcast(room, message);
}

function handlePlayerSelect(conn, mode_id) {
  var room = redisService.getRoomNameForCode(conn.room);
  var message = {
    'type': 'player_select',
    'mode_id': mode_id
  };

  redisService.getRoomOwner(room).then(function(owner) {
    writeService.write(conns[owner], message);
  });
}

function disconnect(conn) {
  //send info to owner that player disconnected
  var room = redisService.getRoomNameForCode(conn.room);

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
  var room = redisService.getRoomNameForCode(code);

  console.log('checking if player can join');

  checkRoomExists(room).then(function(exist) {
    if (!exist) {
      writeService.writeJoinError(conn, 'No games with the code ' + code + ' found');
      return;
    }

    console.log('room exists');

    //check still in lobby. Player cannot join if game already started
    redisService.isInLobby(room).then(function(inLobby) {
      if (inLobby !== 'yes') {
        writeService.writeJoinError(conn, 'Game already started.');
        return;
      }

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

    redisService.getGameId(room).then(function(res) {
      writeService.write(conn, {
        type: 'join_room',
        result: true,
        game_id: res
      });
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
