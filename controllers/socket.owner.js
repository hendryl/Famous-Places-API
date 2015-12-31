var redisService = require('../helpers/redis-service');

function createRoomOwnerHandlers(conn) {
  console.log('creating room owner handlers');

  conn.on('data', function(message) {
    message = JSON.parse(message);

    if(message.type === 'create_room') {
      var room = message.name;
      var owner = message.owner;
      createRoom(conn, room, owner);
    }

    if(message.type === 'delete_room') {
      var room = message.name;
      deleteRoom(conn, room);
    }

    if(message.type == null) {
      sendError(conn);
    }
  });
}

function createRoom(conn, room, owner) {
  redisService.createRoom(room, owner)
  .then(function(res) {
    write(conn, {
      type: 'create_room',
      result: true
    }, function(err) {
      sendError(conn, res);
    });
  });
}

function deleteRoom(conn, room) {
  redisService.deleteRoom(room)
  .then(function(res) {
    write(conn, {
      type: 'delete_room',
      result: true
    }, function(err) {
      sendError(conn, res);
    });
  });
}

function write(conn, obj) {
  var json = JSON.stringify(obj);
  conn.write(json);
}

function sendError(conn, reason) {
  reason = reason || 'No Message Type';

  write(conn, {
    type: 'error',
    reason: reason
  })
}

module.exports = createRoomOwnerHandlers;
