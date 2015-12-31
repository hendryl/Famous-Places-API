var redis = require('redis');
var bluebird = require('bluebird');
var client = null;

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

function startRedis() {
  var options = {
    url: 'redis://hendryl:famous-places@pub-redis-11114.us-east-1-3.7.ec2.redislabs.com:11114',
  };

  var client = redis.createClient(options);
  client.on("error", function(err) {
    console.log("Error " + err);
  });

  client.on('ready', function() {
    console.log('Redis connection is ready');
  })
}

function stopRedis() {
  client.quit();
}

function createRoom(room, owner) {
  var roomName = 'room:' + room;
  var obj = {
    'owner': owner
  };

  return client.hmsetAsync(roomName, obj, redis.print);
}

function deleteRoom(room) {
  client.del('room:' + room, redis.print);
}

module.exports = {
  start: startRedis,
  stop: stopRedis,
  createRoom: createRoom,
  deleteRoom: deleteRoom,
};
