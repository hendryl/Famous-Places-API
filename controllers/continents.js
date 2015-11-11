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

router.post('/', function(req, res) {
  var continent = req.body.continent;
  var query = 'INSERT INTO continent ("name") VALUES ($1) RETURNING continent_id';
  var values = [continent];

  db.query(query, values)
  .then(function(result) {
    res.status(201).send(result.rows[0]);
  })
  .catch(function(error) {
    console.log(error);
    res.status(400).send(error);
  });
});

module.exports = router;
