var db = require('../helpers/db');
var _ = require('underscore');

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  var query = "SELECT country_id, countries.name, continents.name AS continent, countries.image FROM countries, continents WHERE countries.continent_id = continents.continent_id ORDER BY country_id ASC";

  db.query(query)
  .then(function(result) {
    res.status(200).send(result.rows);
  })
  .catch(function(error) {
    res.status(500).send(error);
  });
});

router.post('/', function(req, res) {
  var name = req.body.name;
  var continent_id = Number(req.body.continent_id);
  var image = _.isString(req.body.image) ? req.body.image : null;

  if(!(_.isString(name))) {
    res.status(400).send("Bad Request");
    return;
  }

  var query = 'INSERT INTO countries ("name","continent_id","image")  VALUES ($1, $2, $3) RETURNING country_id';
  var values = [name, continent_id, image];

  db.query(query, values)
  .then(function(result) {
    res.status(201).send(result.rows[0]);
  })
  .catch(function(error) {
    res.status(500).send(error);
  });
});

module.exports = router;
