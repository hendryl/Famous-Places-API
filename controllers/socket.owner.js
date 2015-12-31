var redisService = null;
var conns = {};

function handleOwnerSocket(redis, allConns, conn, message) {
  conns = allConns;
  redisService = redis;

  var room = null;

  if (message.type == null) {
    sendError(conn);

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
    sendError('Unknown message type');
  }
}

function createRoom(conn, room, owner) {
  redisService.createRoom(room, owner).then(function(res) {
    write(conn, {
      type: 'create_room',
      result: true
    });
  }).catch(function(err) {
    sendError(conn, err);
  });
}

function deleteRoom(conn, room) {
  redisService.deleteRoom(room).then(function(res) {
    write(conn, {
      type: 'delete_room',
      result: true
    });
  }).catch(function(err) {
    sendError(conn, err);
  });
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

module.exports = handleOwnerSocket;
