var express = require('express');

var db = require('../helpers/db');
var isBadRequest = require('../helpers/request-checker');

var router = express.Router();
var questionMaker = require('../helpers/question-maker');
var passwordMaker = require('../helpers/password-maker');

function createGame(values) {
  var query = 'INSERT INTO games ("mode_id","active", "password") VALUES ($1, true, $2) RETURNING game_id, password';

  return db.query(query, values);
}

router.post('/', function(req, res) {
  var values = [
    req.body.mode_id
  ];

  if (isBadRequest(values)) {
    res.status(400).send("Bad Request");
    return;
  }

  var logError = function(error) {
    console.log(error);
    res.status(500).send(error);
  };

  var passwordPromise = passwordMaker.createUsablePassword();
  passwordPromise.then(function(result) {
    values.push(result);
    createGame(values).then(function(result) {
      var row = result.rows[0];

      questionMaker.createQuestions(5, values[0]).then(function(result) {
        row.questions = result;

        res.status(201).send(row);
      }, logError);
    }, logError);
  }, logError);
});

/* disconnection (desktop web closed)
game is marked as done

TODO: disconnect game
*/
module.exports = router;
