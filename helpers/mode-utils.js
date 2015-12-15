var db = require('../helpers/db');
var _ = require('underscore');

module.exports = {
  createCountryLinks: createCountryLinks,
  createContinentLinks: createContinentLinks,
  createCharacteristicLinks: createCharacteristicLinks,
  needUpdateCountries: needUpdateCountries,
  needUpdateContinents: needUpdateContinents,
  needUpdateCharacteristics: needUpdateCharacteristics,
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

function needUpdateCountries(values) {
  return false;
}

function needUpdateContinents(values) {
  return false;
}

function needUpdateCharacteristics(values) {
  return false;
}

function updateCountries(values) {
  return;
}

function updateContinents(values) {
  return;
}

function updateCharacteristics(values) {
  return;
}
