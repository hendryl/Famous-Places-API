var bluebird = require('bluebird');
var redis = require('redis');
var _ = require('underscore');
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

function getRoomList() {
  return client.keysAsync('room');
}

function getRoomOwner(room) {
  return client.hgetAsync(room, 'owner');
}

function getPlayersInRoom(room) {
  return new Promise(function(resolve, reject) {
    client.hgetAsync(room, 'players').then(function(res) {
      var players = null;

      if (res != null) {
        players = res.split(',');
      }

      resolve(players);
    }).catch(function(err) {
      console.log('failed to get players');
      reject(err);
    });
  });
}

function createRoom(room, owner) {
  var obj = {
    'owner': owner
  };
  return client.hmsetAsync(room, obj);
}

function deleteRoom(room) {
  console.log('delete ' + room);
  client.del(room, redis.print);
}

function joinRoom(room, player) {
  console.log('joining room');

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
      console.log('');
      reject(err);
    });
  });
}

function leaveRoom(room, player) {
  getPlayersInRoom(room).then(function(res) {
    console.log('get players result: ' + res);
    var obj = null;

    if (res == null) {
      console.log('res is empty');

    } else {
      console.log('have res');
      obj = res.split(',');

      _.remove(obj, function(n) {
        return n === player;
      });

      client.hmset(room, obj);
    }
  });
}

module.exports = {
  start: startRedis,
  stop: stopRedis,
  getRoomList: getRoomList,
  getRoomOwner: getRoomOwner,
  getPlayersInRoom: getPlayersInRoom,
  createRoom: createRoom,
  deleteRoom: deleteRoom,
  joinRoom: joinRoom,
  leaveRoom: leaveRoom,
};
