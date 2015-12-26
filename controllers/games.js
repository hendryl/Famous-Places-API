var _ = require('underscore');
var express = require('express');

var db = require('../helpers/db');
var isBadRequest = require('../helpers/request-checker');

var router = express.Router();
var questionMaker = require('../helpers/question-maker');
var passwordMaker = require('../helpers/password-maker');

var createGame = function(values) {
  var query = 'INSERT INTO games ("mode_id","active", "password") VALUES ($1, true, $2) RETURNING game_id, password';

  return db.query(query, values);
};

router.post('/games', function(req, res) {
  var values = [
    req.body.mode_id
  ];

  if (isBadRequest(values)) {
    res.status(400).send("Bad Request");
    return;
  }

  var passwordPromise = passwordMaker.createUsablePassword();
});

/* disconnection (desktop web closed)
game is marked as done

TODO: disconnect game
*/
module.exports = router;
