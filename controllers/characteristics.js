var db = require('../helpers/db');
var _ = require('underscore');

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  var query = "SELECT * FROM characteristics";

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

  if(!(_.isString(name))) {
    res.status(400).send("Bad Request: no name parameter");
    return;
  }

  var query = 'INSERT INTO characteristics ("name") VALUES ($1) RETURNING characteristic_id';
  var values = [name];

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
  var query = "SELECT * FROM characteristics WHERE characteristic_id = $1";
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

  if(!(_.isString(name))) {
    res.status(400).send("Bad Request: no name parameter");
    return;
  }

  var query = "UPDATE characteristics SET name = $1 WHERE characteristic_id = $2";
  var values = [name, req.params.id];

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
  var query = "DELETE FROM characteristics WHERE characteristic_id=$1";
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
