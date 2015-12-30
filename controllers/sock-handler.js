function SockHandler(server) {
  server.on('connection', function(conn) {
    console.log('connection create ' + conn);

    conn.on('close', function() {
      console.log('connection close ' + conn);
    })
  })
}

module.exports = SockHandler;
