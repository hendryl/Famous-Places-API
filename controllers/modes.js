var _ = require('underscore');
var express = require('express');

var db = require('../helpers/db');
var isBadRequest = require('../helpers/request-checker');

var router = express.Router();

var createQuery = function(table, link, id, values) {
  if (values.length === 0) {
    return "";
  }

  var query = 'INSERT INTO ' + table + ' ("mode_id", "' + link + '") VALUES ';

  for (var value in values) {
    query += ('(' + id + ', ' + values[value] + ')');

    if (values[value] === _.last(values)) {
      query += ';';
    } else {
      query += ', ';
    }
  }

  return query;
};

var createCountryLinks = function(id, values) {
  var query = createQuery('mode_country', 'country_id', id, values);
  return db.query(query);
};

var createContinentLinks = function(id, values) {
  var query = createQuery('mode_continent', 'continent_id', id, values);
  return db.query(query);
};

var createCharacteristicLinks = function(id, values) {
  var query = createQuery('mode_characteristic', 'characteristic_id', id, values);
  return db.query(query);
};

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

router.post('/', function(req, res) {
  var body = req.body;
  var values = [
    body.name,
    body.enabled,
    body.image,
    body.description,
    body.countries,
    body.continents,
    body.characteristics,
  ];

  if(isBadRequest(values)) {
    res.status(400).send("Bad Request");
    return;
  }

  var mainQuery = 'INSERT INTO modes ("name", "enabled") VALUES($1, $2) RETURNING mode_id';
  values = values.slice(0, 2);

  db.query(mainQuery, values)
    .then(function(result) {
      console.log("main query successful");
      var row = result.rows[0];
      var id = row.mode_id;
      var promises = [];
      promises.push(createCountryLinks(id, body.countries));
      console.log("Success creating country link query");
      promises.push(createContinentLinks(id, body.continents));
      console.log("Success creating continent link query");
      promises.push(createCharacteristicLinks(id, body.characteristics));
      console.log("Success creating all link queries");
      Promise.all(promises)
      .then(function(result) {
        console.log("Successfully added rows for game mode");
        res.status(200).send(row);
      })
      .catch(function(error) {
        console.log("error at link queries");
        console.log(error);
        res.status(500).send(error);
      });
    })
    .catch(function(error) {
      console.log("error at first query");
      console.log(error);
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

router.delete('/:id',function(req, res) {
  var query = "BEGIN; DELETE FROM modes WHERE mode_id = $1; COMMIT;";

  query = query.split('$1').join(req.params.id);

  db.query(query)
  .then(function(result) {
    res.status(204).end();
  })
  .catch(function(error) {
    console.log(error);
    res.status(500).send(error);
  });
});

module.exports = router;
