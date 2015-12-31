var db = require('./db');

function endGame(password) {
  var query = "UPDATE games SET active = false WHERE password = '" + password + "'";
  console.log(query);

  db.query(query).then(function(res) {
    console.log('game update success');
  }, function(err) {
    console.log('game update error:' + err);
  });
}

module.exports = {
  endGame: endGame
};
