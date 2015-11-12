var pg = require('pg-then');
var config = require('../config')();

var db = pg.Pool(config.database_url);

module.exports = db;
