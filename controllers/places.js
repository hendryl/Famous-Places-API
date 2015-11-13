var _ = require('underscore');
var express = require('express');

var db = require('../helpers/db');
var isBadRequest = require('../helpers/request-checker');

var router = express.Router();

var createTagQuery = function(id, tags) {
  var query = 'INSERT INTO tags ("place_id", "characteristic_id") VALUES ';

  for (var tag in tags) {
    query += ('(' + id + ', ' + tags[tag] + ')');

    if (tags[tag] === _.last(tags)) {
      query += ';';
    } else {
      query += ', ';
    }
  }

  return query;
};

var updateTags = function(id, tags) {
  var tagQuery = 'DELETE FROM tags WHERE tags.place_id = $1';
  var tagValues = [id];

  db.query(tagQuery, tagValues)
    .then(function(result) {
      tagQuery = createTagQuery(id, tags);

      db.query(tagQuery)
        .then(function(result) {
          return true;
        })
        .catch(function(error) {
          return error;
        });
    })
    .catch(function(error) {
      return error;
    });
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
  var values = [
    req.body.country_id,
    req.body.name,
    req.body.description,
    req.body.image,
    req.body.latitude,
    req.body.longitude,
    req.body.link,
    req.body.enabled,
    req.body.tags
  ];

  if (isBadRequest(values)) {
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

router.put('/:id', function(req, res) {
  var values = [
    req.body.name,
    req.body.description,
    req.body.image,
    req.body.latitude,
    req.body.longitude,
    req.body.link,
    req.body.enabled
  ];

  if (isBadRequest(values)) {
    res.status(400).send("Bad Request");
    return;
  }

  var id = req.params.id;
  var tags = req.body.tags;
  var shouldUpdateTags = !(_.isUndefined(tags));

  var tagPromise = new Promise(function(resolve, reject) {
    if (shouldUpdateTags) {
      var tagResult = updateTags(id, tags);

      if (tagResult === true) {
        resolve("Done updating tags");
      } else {
        res.status(500).send(tagResult);
        reject("Failed updating tags");
        return;
      }
    } else {
      resolve("Not updating tags");
    }
  });

  tagPromise.then(function(result) {
    console.log(result);

    var query = "UPDATE places SET name = $1, description = $2, image = $3, latitude = $4, longitude = $5, link = $6, enabled = $7 WHERE place_id = " + id ;

    db.query(query, values)
    .then(function(result) {
      res.status(200).end();
    })
    .catch(function(error) {
      res.status(500).send(error);
    });
  });
});

module.exports = router;
