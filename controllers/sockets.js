function prepare(io) {
  io.on('connection', function(socket) {
    console.log('User ' + socket.id + ' connected');
    socket.on('disconnect', function() {
      console.log('User ' + socket.id + ' disconnected');
    });
  });
}

module.exports = {
  prepare: prepare
};
