var bluebird = require('bluebird');
var redis = require('redis');
var _ = require('underscore');
var client = null;

function getRoomNameForCode(code) {
  return 'room:' + code;
}

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

function roomExists(room) {
  return client.existsAsync(room);
}

function getRoomOwner(room) {
  return client.hgetAsync(room, 'owner');
}

function getPlayersInRoom(room) {
  return new Promise(function(resolve, reject) {
    console.log('getting list of players in ' + room + ' from redis');
    client.hgetAsync(room, 'players').then(function(res) {
      var players = [];

      if (res != null && res.length !== 0) {
        console.log('get players ' + room + ' splitting res');

        if(res.indexOf(',') !== -1) {
          players = res.split(',');
        } else {
          players.push(res);
        }
        console.log('get players ' + room + ' compute results:');
        console.log(players);
      }
      resolve(players);
    }).catch(function(err) {
      console.log('get players ' + room + ' failed to get players');
      reject(err);
    });
  });
}

function createRoom(room, owner) {
  var obj = {
    'owner': owner,
    'inLobby': 'yes'
  };
  return client.hmsetAsync(room, obj);
}

function deleteRoom(room) {
  console.log('delete ' + room);
  client.del(room, redis.print);
}

function isInLobby(room) {
  return client.hgetAsync(room, 'inLobby');
}

function setInLobby(room, value) {
  client.hset(room, 'inLobby', value);
}

function joinRoom(room, player) {
  console.log('joining ' + room);

  return new Promise(function(resolve, reject) {
    getPlayersInRoom(room).then(function(res) {
      var obj = null;

      if (res.length === 0) {
        console.log('join ' + room + ' res is empty');
        obj = {
          'players': player
        };

        console.log('join ' + room + ' going to send to redis: ' + obj.players);
        resolve(client.hmsetAsync(room, obj));

      } else {
        console.log('join ' + room + ' have res: ' + res);
        res = res.join();
        obj = {
          'players': res + ',' + player
        };
        console.log('join ' + room + ' going to send to redis: ' + obj.players);
        resolve(client.hmsetAsync(room, obj));
      }
    }).catch(function(err) {
      reject(err);
    });
  });
}

function leaveRoom(room, player) {
  console.log(player + ' is leaving ' + room);
  getPlayersInRoom(room).then(function(res) {
    console.log('leave ' + room + ' get players result: ' + res);

    if (res == null || res.length === 0) {
      console.log('leave ' + room + ' res is empty');

    } else {
      console.log('leave ' + room + ' have res');
      console.log(res);

      var obj = _.without(res, player);

      obj = {
        players: obj.join()
      };

      console.log('leave ' + room + ' update data in redis');
      client.hmset(room, obj, redis.print);
    }
  });
}


module.exports = {
  getRoomNameForCode: getRoomNameForCode,
  start: startRedis,
  stop: stopRedis,
  getRoomList: getRoomList,
  getRoomOwner: getRoomOwner,
  getPlayersInRoom: getPlayersInRoom,
  isInLobby: isInLobby,
  setInLobby: setInLobby,
  createRoom: createRoom,
  deleteRoom: deleteRoom,
  joinRoom: joinRoom,
  leaveRoom: leaveRoom,
  roomExists: roomExists,
};
