var db = require('../helpers/db');
var _ = require('underscore');

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  var query = "SELECT country_id, countries.name, continents.name AS continent, countries.image FROM countries LEFT JOIN continents ON continents.continent_id = countries.continent_id ORDER BY country_id ASC";

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

router.use('/:id', function(req, res, next) {
  var id = Number(req.params.id);

  if(_.isNumber(id)) {
    next();
  } else {
    res.status(400).send("Value should be a number");
  }
});

router.get('/:id', function(req, res) {
  var query = "SELECT * FROM countries WHERE country_id = $1";
  var values = [req.params.id];

  db.query(query, values)
  .then(function(result) {
    var row = result.rows[0];

    if(_.isEmpty(row)) {
      res.status(404).end();
    } else {
      res.status(200).send(result.rows[0]);
    }
  })
  .catch(function(error) {
    res.status(500).send(error);
  });
});

router.put('/:id', function(req, res) {
  var name = req.body.name;
  var continent_id = req.body.continent_id;
  var image = req.body.image;

  var isBadRequest = _.isUndefined(name) || _.isUndefined(continent_id) || _.isUndefined(image);

  if(isBadRequest) {
    res.status(400).send("Bad Request");
    return;
  }

  var query = "UPDATE countries SET name = $1, continent_id = $2, image = $3 WHERE country_id = $4";
  var values = [name, continent_id, image, req.params.id];

  db.query(query, values)
  .then(function(result) {
    if(result.rowCount === 0) {
      res.status(404).send("Id not found");
    } else {
      res.status(200).end();
    }
  })
  .catch(function(error) {
    res.status(500).send(error);
  });
});

router.delete('/:id', function(req, res) {
  var query = "DELETE FROM countries WHERE country_id=$1";
  var values = [req.params.id];

  db.query(query, values)
  .then(function(result) {
    res.status(204).end();
  })
  .catch(function(error) {
    res.status(500).send(error);
  });
});

module.exports = router;
