var bluebird = require('bluebird');
var redis = require("redis");
var client = null;

function startRedis() {
  bluebird.promisifyAll(redis.RedisClient.prototype);
  bluebird.promisifyAll(redis.Multi.prototype);

  var options = {
    url: 'redis://hendryl:famous-places@pub-redis-11114.us-east-1-3.7.ec2.redislabs.com:11114',
  };

  client = redis.createClient(options);

  client.on("error", function(err) {
    console.log("Error " + err);
  });

  client.on('ready', function() {
    console.log('Redis connection is ready');
  });
}

function stopRedis() {
  client.quit();
}

function createRoom(room, owner) {
  var obj = {
    'owner': owner
  };

  return client.hmsetAsync(room, obj);
}

function getRoomOwner(room) {
  return client.hgetAsync(room, 'owner');
}

function getPlayersInRoom(room) {
  return client.hgetAsync(room, 'players');
}

function joinRoom(room, player) {
  return new Promise(function(resolve, reject) {
    getPlayersInRoom(room).then(function(res) {
      console.log('get players result: ' + res);
      var obj = null;

      if (res == null) {
        console.log('res is empty');
        obj = {
          'players': player
        };
        resolve(client.hmsetAsync(room, obj));

      } else {
        console.log('have res');
        obj = {
          'players': res + ',' + player
        };
        resolve(client.hmsetAsync(room, obj));
      }
    }).catch(function(err) {
      reject(res);
    });
  }).catch(function(err) {
    reject(res);
  });
}

function deleteRoom(room) {
  return client.delAsync(room);
}

module.exports = {
  start: startRedis,
  stop: stopRedis,
  createRoom: createRoom,
  joinRoom: joinRoom,
  deleteRoom: deleteRoom,
  getRoomOwner: getRoomOwner,
  getPlayersInRoom: getPlayersInRoom
};
