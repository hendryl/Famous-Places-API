var db = require('../helpers/db');

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  var query = "SELECT * FROM continent";

  db.query(query)
  .then(function(result) {
    res.status(200).json(result.rows);
  })
  .catch(function(error) {
    res.status(400).send(error);
  });
});

module.exports = router;
