var _ = require('underscore');
var express = require('express');

var db = require('../helpers/db');
var isBadRequest = require('../helpers/request-checker');
var utils = require('../helpers/mode-utils');

var router = express.Router();

var parseCountryData = function(values) {
  var countries = [];
  _.each(values, function(value) {
    countries.push(value.country_id);
  });

  return countries;
};

var parseContinentData = function(values) {
  var continents = [];
  _.each(values, function(value) {
    continents.push(value.continent_id);
  });

  return continents;
};

var parseCharacteristicData = function(values) {
  var characteristics = [];
  _.each(values, function(value) {
    characteristics.push(value.characteristic_id);
  });

  return characteristics;
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

  var mainQuery = 'INSERT INTO modes ("name", "enabled", "image", "description") VALUES($1, $2, $3, $4) RETURNING mode_id';
  values = values.slice(0, 4);

  db.query(mainQuery, values)
    .then(function(result) {
      console.log("main query successful");
      var row = result.rows[0];
      var id = row.mode_id;
      var promises = [];
      promises.push(utils.createCountryLinks(id, body.countries));
      console.log("Success creating country link query");
      promises.push(utils.createContinentLinks(id, body.continents));
      console.log("Success creating continent link query");
      promises.push(utils.createCharacteristicLinks(id, body.characteristics));
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
        return;
      }

      var countryQuery = query.replace("modes", "mode_country");
      var continentQuery = query.replace("modes", "mode_continent");
      var characteristicQuery = query.replace("modes", "mode_characteristic");

      var promises = [];
      promises.push(db.query(countryQuery, values));
      promises.push(db.query(continentQuery, values));
      promises.push(db.query(characteristicQuery, values));

      Promise.all(promises).then(function(linkResults) {
        row.countries = parseCountryData(linkResults[0].rows);
        row.continents = parseContinentData(linkResults[1].rows);
        row.characteristics = parseCharacteristicData(linkResults[2].rows);

        res.status(200).send(row);
      })
      .catch(function(error) {
        res.status(500).send(error);
      });
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
