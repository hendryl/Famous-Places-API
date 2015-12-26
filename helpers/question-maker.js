var chance = require('chance')();
var db = require('./db');

var query ='SELECT places.place_id, places.name, places.latitude, places.longitude, places.photo_id, locations.country, locations.continent FROM places LEFT JOIN (SELECT countries.country_id, countries.name AS "country", continents.name AS "continent" FROM countries JOIN continents on countries.continent_id = continents.continent_id) AS locations ON places.country_id = locations.country_id subquery ORDER BY places.place_id';

var characteristicQuery = 'SELECT tags.place_id FROM tags JOIN (SELECT characteristic_id, modes.mode_id FROM mode_characteristic JOIN modes ON mode_characteristic.mode_id = modes.mode_id WHERE modes.mode_id = $1) AS chars ON tags.characteristic_id = chars.characteristic_id';

var continentQuery = 'SELECT mode_continent.continent_id FROM modes JOIN mode_continent ON mode_continent.mode_id = modes.mode_id WHERE modes.mode_id = $1';

var countryQuery = 'SELECT mode_country.country_id FROM modes JOIN mode_country ON mode_country.mode_id = modes.mode_id WHERE modes.mode_id = $1';

function createQuestions(mode_id, amount) {
  var values = [mode_id];

  return new Promise(function(resolve, reject) {
    createQuery(values).then(function(queryString) {
      queryString = queryString.replace('$1', mode_id);
      db.query(queryString).then(function(result) {
         resolve(chance.pick(result.rows, amount));
      })
      .catch(function(error) {
        reject(error);
      });
    });
  });
}

function createQuery(values) {
  return new Promise(function(resolve, reject) {
    createSubquery(values).then(function(result) {
      var queryString = query.replace('subquery', result);
      resolve(queryString);
    }, function(reason) {
      reject(reason);
    });
  });
}

function createSubquery(values) {
  var characteristicPromise = needQuery(characteristicQuery, values);
  var continentPromise = needQuery(continentQuery, values);
  var countryPromise = needQuery(countryQuery, values);

  return new Promise(function(resolve, reject) {
    Promise.all([characteristicPromise, continentPromise, countryPromise])
    .then(function(results) {
      var subquery = '';
      var atLeastOneSub = false;

      if(results[0] || results[1] || results[2]) {
        subquery += 'WHERE ';

        if(results[0]) {
          subquery += 'places.place_id in (' + characteristicQuery + ') ';
          atLeastOneSub = true;
        }

        if(results[1]) {
          if(atLeastOneSub) {
            subquery += 'AND ';
          }
          subquery += 'locations.continent_id in (' + continentQuery + ') ';
          atLeastOneSub = true;
        }

        if(results[2]) {
          if(atLeastOneSub) {
            subquery += 'AND ';
          }
          subquery += 'places.place_id in (' + countryQuery + ')';
        }
      }

      resolve(subquery);
    }, function(reason) {
      reject(reason);
    });
  });
}

function needQuery(query, values) {
  return new Promise(function(resolve, reject) {
    db.query(query, values).then(function(result) {
      if(result.rows.length > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    }).catch(function(error){
      reject(error);
    });
  });
}

module.exports = {
  createQuestions: createQuestions
};
