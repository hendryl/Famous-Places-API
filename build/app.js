'use strict';

var _connector = require('./database/connector');

var _connector2 = _interopRequireDefault(_connector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var express = require('express');
var app = express();

app.get('/', function (req, res) {
  var dbConnector = new _connector2.default();

  dbConnector.query("SELECT * FROM place");

  res.send("Hello World!");
});

app.get('/values', function (req, res) {
  var dbConnector = new _connector2.default();

  dbConnector.queryWithValues("SELECT * FROM place WHERE ? = ? ", ['id', 1]);

  res.send("Hello World 2!");
});

var server = app.listen(4000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
//# sourceMappingURL=app.js.map
