var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

var app = express();

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

app.use(cors());
app.use('/api', require('./controllers/index.js'));

var port = process.env.PORT || 8080;

var server = app.listen(port, function () {
  console.log('App listening at port %s', port);
});

var socketController = require('./controllers/sockets');
socketController(server);

module.exports = server;
