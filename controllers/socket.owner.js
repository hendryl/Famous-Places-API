var redisService = require('../helpers/redis-service');

function createRoomOwnerHandlers(conn) {
  conn.on('data', function(message) {
    if(message.type === 'create_room') {
      var room = message.room;
      var owner = message.owner;
      createRoom(room, owner);
    }

    if(message.type == null) {
      sendError();
    }
  });
}

function createRoom(room, owner) {
  redisService.createRoom(room, owner)
  .then(function(res) {
    conn.write({
      type: 'create_room',
      result: true
    }, function(err) {
      sendError(res);
    });
  });
}

function sendError(reason) {
  reason = reason || 'No Message Type';

  conn.write({
    type: 'error',
    reason: reason
  })
}

module.exports = createRoomOwnerHandlers;
