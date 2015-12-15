var db = require('../helpers/db');
var _ = require('underscore');

module.exports = {
  createCountryLinks: createCountryLinks,
  createContinentLinks: createContinentLinks,
  createCharacteristicLinks: createCharacteristicLinks,
  parseCountryData: parseCountryData,
  parseContinentData: parseContinentData,
  parseCharacteristicData: parseCharacteristicData,
  updateCountries: updateCountries,
  updateContinents: updateContinents,
  updateCharacteristics: updateCharacteristics,
};

function createQuery(table, link, id, values) {
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
}

function createCountryLinks(id, values) {
  var query = createQuery('mode_country', 'country_id', id, values);
  return db.query(query);
}

function createContinentLinks(id, values) {
  var query = createQuery('mode_continent', 'continent_id', id, values);
  return db.query(query);
}

function createCharacteristicLinks(id, values) {
  var query = createQuery('mode_characteristic', 'characteristic_id', id, values);
  return db.query(query);
}

function parseCountryData (values) {
  var countries = [];
  _.each(values, function(value) {
    countries.push(value.country_id);
  });

  return countries;
}

function parseContinentData(values) {
  var continents = [];
  _.each(values, function(value) {
    continents.push(value.continent_id);
  });

  return continents;
}

function parseCharacteristicData(values) {
  var characteristics = [];
  _.each(values, function(value) {
    characteristics.push(value.characteristic_id);
  });

  return characteristics;
}

function updateCountries(id, values) {
  return new Promise(function(resolve, reject) {
    var query = 'DELETE FROM mode_country WHERE mode_id = ' + id;

    db.query(query)
    .then(function(result) {
      var createPromise = createCountryLinks(id, values);
      resolve(createPromise);
    })
    .catch(function(error) {
      reject(error);
    });
  });
}

function updateContinents(id, values) {
  return new Promise(function(resolve, reject) {
    var query = 'DELETE FROM mode_continent WHERE mode_id = ' + id;

    db.query(query)
    .then(function(result) {
      var createPromise = createContinentLinks(id, values);
      resolve(createPromise);
    })
    .catch(function(error) {
      reject(error);
    });
  });
}

function updateCharacteristics(id, values) {
  return new Promise(function(resolve, reject) {
    var query = 'DELETE FROM mode_characteristic WHERE mode_id = ' + id;

    db.query(query)
    .then(function(result) {
      var createPromise = createCharacteristicLinks(id, values);
      resolve(createPromise);
    })
    .catch(function(error) {
      reject(error);
    });
  });
}
