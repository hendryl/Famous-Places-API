var chance = require('chance')();
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
    console.log("creating password");
    getCurrentPasswordList().then(function(result) {
      console.log("Successfully retrieved passwords from database");
      var passwords = result.rows;
      var usable = false;
      var password = '';

      while (!usable) {
        password = createPassword();
        usable = checkPasswordUsable(password, passwords);
      }

      console.log("password is " + password);
      resolve(password);
    }, function(error) {
      reject(error);
    });
  });
}

module.exports = {
  createPassword: createUsablePassword
};
