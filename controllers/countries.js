var db = require('../helpers/db');
var _ = require('underscore');

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  var query = "SELECT * FROM countries";

  db.query(query)
  .then(function(result) {
    res.status(200).send(result.rows);
  })
  .catch(function(error) {
    res.status(500).send(error);
  });
});
