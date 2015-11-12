var db = require('../helpers/db');
var _ = require('underscore');

var express = require('express');
var router = express.Router();

var isBadRequest = function(values) {
  for(var value in values) {
    if (_.isUndefined(values[value])) {
      return true;
    }
  }
  return false;
};

var createTagQuery = function(id, tags) {
  var query = 'INSERT INTO tags ("place_id", "characteristic_id") VALUES ';

  for(var tag in tags) {
    query += ('(' + id + ', ' + tags[tag] + ')');

    if(tags[tag] === _.last(tags)) {
      query += ';';
    } else {
      query += ', ';
    }
  }

  return query;
};

router.get('/', function(req, res) {
  var query = "SELECT place_id, places.name, countries.name AS country, description, places.image, latitude, longitude, link, enabled FROM places LEFT JOIN countries ON countries.country_id = places.country_id ORDER BY place_id ASC";

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
    body.country_id,
    body.name,
    body.description,
    body.image,
    body.latitude,
    body.longitude,
    body.link,
    body.enabled,
    body.tags
  ];

  if(isBadRequest(values)) {
    res.status(400).send("Bad Request");
    return;
  }

  var query = 'INSERT INTO places ("country_id", "name", "description", "image", "latitude", "longitude", "link", "enabled") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING place_id';

  db.query(query, _.initial(values))
  .then(function(result) {
    var row = result.rows[0];
    var tags = _.last(values);
    var query = createTagQuery(row.place_id, tags);

    db.query(query)
    .then(function(result) {
      res.status(201).send(row);
    })
    .catch(function(error) {
      res.status(500).send(error);
    });
  })
  .catch(function(error) {
    res.status(500).send(error);
  });
});

module.exports = router;
