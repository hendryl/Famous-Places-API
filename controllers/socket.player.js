var conns = {};
var redisService = null;

function handlePlayerSocket(redis, allConns, conn, message) {
  conns = allConns;
  redisService = redis;

  if (message.type == null) {
    sendError(conn);

  } else if (message.type === 'join_room') {
    var room = 'room:' + message.name;
    var player = message.player;
    joinRoom(conn, room, player);

  } else {
    sendError('Unknown message type');
  }
}

function joinRoom(conn, room, player) {
  //TODO: CHECK FOR ERRORS!
  var code = room.substring(5);
  if(!roomExists(room)) {
    write(conn, {
      type: 'join_room',
      result: false,
      reason: 'No games with the code ' + code + ' found'
    });
    return;
  }

  // user with same names
  // already 4 players

  console.log('socket player joining ' + room);

  redisService.joinRoom(room, conn.id).then(function(res) {
    console.log('join room successful');
    conn.room = room.substring(5);
    conn.role = 'player';
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
  }, function(err){
    console.log('error joining room');
    sendError(conn, err);
  });
}

function roomExists() {

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

module.exports = handlePlayerSocket;
