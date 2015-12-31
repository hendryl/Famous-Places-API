var redisService = require('../helpers/redis-service');
var conns = {};

function handleOwnerSocket(allConns, conn, message) {
  conns = allConns;

  if (message.type == null) {
    sendError(conn);

  } else if (message.type === 'create_room') {
    var room = message.name;
    var owner = conn.id;
    createRoom(conn, room, owner);

  } else if (message.type === 'delete_room') {
    var room = message.name;
    deleteRoom(conn, room);

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
  }, function(err) {
    sendError(conn, res);
  });
}

function deleteRoom(conn, room) {
  redisService.deleteRoom(room).then(function(res) {
    write(conn, {
      type: 'delete_room',
      result: true
    });
  }, function(err) {
    sendError(conn, res);
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
  })
}

module.exports = handleOwnerSocket;
