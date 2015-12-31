var conns = {};

function handlePlayerSocket(redis, allConns, conn, message) {
  conns = allConns;
  redisService = redis;

  console.log(redisService.client);

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
  var errorCallback = function(err) {
    sendError(conn, err);
  };

  redisService.joinRoom(room, conn.id).then(function(res) {
    write(conn, {
      type: 'join_room',
      result: true
    });

    redisService.getRoomOwner(room).then(function(owner) {
      var ownerConn = conns[owner];
      write(ownerConn, {
        type: 'join_room',
        name: player,
        id: conn.id
      });
    }).catch(errorCallback);
  }).catch(errorCallback);
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
