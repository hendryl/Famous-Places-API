var _ = require('underscore');
var express = require('express');

var db = require('../helpers/db');
var isBadRequest = require('../helpers/request-checker');

var router = express.Router();

var createTagQuery = function(id, tags) {
  if (tags.length === 0) {
    return "";
  }

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

router.use('/:id', function(req, res, next) {
  var id = Number(req.params.id);

  if (_.isNumber(id)) {
    next();
  } else {
    res.status(400).send("Value should be a number");
  }
});

router.get('/:id', function(req, res) {
  var query = "SELECT * FROM places WHERE place_id = $1";
  var values = [req.params.id];

  db.query(query, values)
    .then(function(result) {
      var row = result.rows[0];

      if (_.isEmpty(row)) {
        res.status(404).end();
      } else {
        var tagQuery = "SELECT characteristic_id FROM tags WHERE place_id = $1";

        db.query(tagQuery, values)
        .then(function(result) {

          var tags = [];

          _.each(result.rows, function(tag) {
            tags.push(tag.characteristic_id);
          });

          row.tags = tags;
          res.status(200).send(row);
        })
        .catch(function(error) {
          res.status(500).send(error);
        });
      }
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

    if (!shouldUpdateTags) {
      resolve("Not updating tags");
    } else {
      var tagQuery = 'DELETE FROM tags WHERE tags.place_id = $1';
      var tagValues = [id];

      var errorCallback = function(error) {
        res.status(500).send(error);
        reject(error);
      };

      db.query(tagQuery, tagValues)
        .then(function(result) {
          tagQuery = createTagQuery(id, tags);

          if (tagQuery === "") {
            resolve("Done updating tags");
            return;
          }

          db.query(tagQuery)
            .then(function(result) {
              resolve("Done updating tags");
            })
            .catch(errorCallback);
        })
        .catch(errorCallback);
    }
  });

  tagPromise.then(function(result) {
    var query = "UPDATE places SET name = $1, description = $2, image = $3, latitude = $4, longitude = $5, link = $6, enabled = $7 WHERE place_id = " + id;

    db.query(query, values)
      .then(function(result) {
        res.status(200).end();
      })
      .catch(function(error) {
        res.status(500).send(error);
      });
  });
});

router.delete('/:id',function(req, res) {
  var query = "BEGIN; DELETE FROM tags WHERE place_id = $1; DELETE FROM places WHERE place_id = $1; COMMIT;";

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
