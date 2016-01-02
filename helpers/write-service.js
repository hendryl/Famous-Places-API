function write(conn, obj) {
  var json = JSON.stringify(obj);
  conn.write(json);
}

function writeJoinError(conn, reason) {
  write(conn, {
    type: 'join_room',
    result: false,
    reason: reason
  });
}

function writeError(conn, reason) {
  reason = reason || 'Undefined message type';

  write(conn, {
    type: 'error',
    reason: reason
  });
}

module.exports = {
  write: write,
  writeJoinError: writeJoinError,
  writeError: writeError
};
