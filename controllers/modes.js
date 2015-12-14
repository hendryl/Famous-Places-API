var _ = require('underscore');
var express = require('express');

var db = require('../helpers/db');
var isBadRequest = require('../helpers/request-checker');

var router = express.Router();

router.get('/', function(req, res) {
  var query = "SELECT * FROM modes";

  db.query(query)
    .then(function(result) {
      res.status(200).send(result.rows);
    })
    .catch(function(error) {
      res.status(500).send(error);
    });
});

router.use('/:id', function(req, res, next) {
  var id = Number(req.params.id);

  if (_.isNumber(id)) {
    next();
  } else {
    res.status(400).send("Value should be a number");
  }
});

router.get('/:id', function(req, res) {
  var query = "SELECT * FROM modes WHERE mode_id = $1";
  var values = [req.params.id];

  db.query(query, values)
    .then(function(result) {
      var row = result.rows[0];

      if (_.isEmpty(row)) {
        res.status(404).end();
      } else {
        res.status(200).send(row);
      }
    })
    .catch(function(error) {
      res.status(500).send(error);
    });
});

module.exports = router;
