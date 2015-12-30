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

var logger = function(severity, message) {
  if(process.env.NODE_ENV === 'production') {
    if(severity != 'debug') {
      console.log(message);
    }
  } else {
    console.log(message);
  }
};

var sockjs = require('sockjs');
var sockjs_opts = {
  sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.3/sockjs.min.js",
  prefix: '/api/sockets',
  log: logger
};

var sockjsServer = sockjs.createServer(sockjs_opts);
sockjsServer.installHandlers(server);

var sockHandler = require('./controllers/sock-handler');
sockHandler(sockjsServer);

module.exports = server;
