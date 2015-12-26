var chance = require('chancejs');
var db = require('./db');
var _ = require('underscore');

function getCurrentPasswordList() {
  return db.query('SELECT password FROM games WHERE active = true');
}

function createPassword() {
  return chance.word({
    length: 6
  });
}

function checkPasswordUsable(password, passwords) {
  return !_.contains(passwords, password);
}

function createUsablePassword() {
  return new Promise(function(resolve, reject) {
    getCurrentPasswordList().then(function(result) {
      var passwords = result.rows;

      var usable = false;
      var password = '';

      while (usable === false) {
        password = createPassword();
        usable = checkPasswordUsable(password, passwords);
      }

      resolve(password);
    }, function(error) {
      reject(error);
    });
  });
}

module.exports = {
  createPassword: createUsablePassword
};
