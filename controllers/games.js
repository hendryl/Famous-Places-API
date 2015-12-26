var _ = require('underscore');
var chance = require('chancejs');
var express = require('express');

var db = require('../helpers/db');
var isBadRequest = require('../helpers/request-checker');

var router = express.Router();
var socketController = require('./sockets');

var getCurrentPasswordList = function() {
  return db.query('SELECT password in games WHERE active = true');
}

var createPassword = function() {
  return chance.word({
    length: 6
  });
}

var checkPasswordUsable = function(password, passwords) {
  return !_.contains(passwords, password);
}

var createUsablePassword = function(passwords) {
  var usable = false;
  var password = '';

  while (usable === false) {
    password = createPassword();
    usable = checkPasswordUsable(password, passwords);
  }

  return password;
}

var createGame = function(values) {
  var query = 'INSERT INTO games ("mode_id","active", "password") VALUES ($1, true, $2) RETURNING game_id, password';

  db.query(query, values)
    .then(function(result) {
      console.log("Successfully created a new game");
      res.status(201).send(result.rows[0]);
    })
    .catch(function(error) {
      res.status(500).send(error);
    });
};

router.post('/games', function(req, res) {
  var values = [
    req.body.mode_id
  ];

  if (isBadRequest(values)) {
    res.status(400).send("Bad Request");
    return;
  }

  var passwords = [];

  getCurrentPasswordList().then(function(result) {
    passwords = result.rows;
    values.push(createUsablePassword(passwords));
    createGame(values);
  });
});

/*games endpoint
TODO create game
method: POST

receives:
mode id

work:
create a websocket room
create game with random id
create questions -> randomized

returns:
websocket room_id
questions
*/


/* disconnection (desktop web closed)
game is marked as done

TODO: disconnect game
*/

module.exports = router;
